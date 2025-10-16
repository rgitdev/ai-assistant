import { OpenAIService, ConversationMessage } from "backend/client/openai/OpenAIService";
import { OpenAIServiceFactory } from "backend/client/openai/OpenAIServiceFactory";
import { getAssistantSystemPrompt } from "backend/assistant/prompts/systemPrompt";
import { MemoryService } from "../memory/MemoryService";
import { MemorySearchService } from "../memory/MemorySearchService";
import { OpenAIEmbeddingService } from "@backend/client/openai/OpenAIEmbeddingService";
import { VectorStore } from "@backend/client/vector/VectorStore";
export class AssistantService {
  
  openAIService: OpenAIService;
  memoryService: MemoryService;
  memorySearchService: MemorySearchService;
  vectorStore: VectorStore;
  embeddingService: OpenAIEmbeddingService;
  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }
    const openAIFactory = new OpenAIServiceFactory();
    this.openAIService = openAIFactory.build();
    
    const memoryService = new MemoryService();
    this.memoryService = memoryService;

    const vectorStore = new VectorStore();
    this.vectorStore = vectorStore;

    const embeddingService = new OpenAIEmbeddingService();
    this.embeddingService = embeddingService;

    const memorySearchService = new MemorySearchService(vectorStore, embeddingService);
    this.memorySearchService = memorySearchService;
  }


  async sendMessage(systemPrompt: string, message: string): Promise<string> {
    console.log("Sending message to assistant:", message);
    const response = await this.openAIService.sendChatMessage(systemPrompt, message);
    return response;
  }

  async sendConversationWithMemory(
    baseSystemPrompt: string,
    memoryInstructionPrompt: string, 
    messages: ConversationMessage[]
  ): Promise<string> {
    console.log("Sending conversation to assistant:", messages.length, "messages");

    const fullSystemPrompt = baseSystemPrompt + "\n\n" + memoryInstructionPrompt;
    const enhancedMessages = await this.addMemoryToMessages(messages);

    console.log("Adding memory messages to conversation:", enhancedMessages.length, "messages");

    const response = await this.openAIService.sendChatMessages(fullSystemPrompt, enhancedMessages);
    return response;
  }

  async addMemoryToMessages(messages: ConversationMessage[]): Promise<ConversationMessage[]> {
    const enhancedMessages: ConversationMessage[] = [];

    // Add time context message
    const timeContextMessage = this.getCurrentTimeContextMessage();
    enhancedMessages.push(timeContextMessage);

    // Add search results

    const foundMemories = await this.memorySearchService.searchMemories(messages[messages.length - 1].content);
    // Add memory messages
    const lastMemory = await this.memoryService.getMemoriesAsAssistantMessage();
    if (lastMemory) {
      enhancedMessages.push(lastMemory);
    }

    // Add original conversation messages
    enhancedMessages.push(...messages);

    return enhancedMessages;
  }

  private getCurrentTimeContextMessage(): ConversationMessage {
    const currentTime = new Date().toLocaleString('en-US', { 
      timeZone: 'Europe/Berlin', 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });

    return {
      role: "assistant",
      content: `## Current Context
Current date and time: ${currentTime} (GMT+1/CEST)

When discussing time-sensitive topics, always reference the current date and time provided above to maintain temporal accuracy in your responses.`
    };
  }
  
}

if (require.main === module) {
  const assistant = new AssistantService();
  assistant.sendMessage(getAssistantSystemPrompt(), "Hello, how are you? what's your name?").then(console.log);
}