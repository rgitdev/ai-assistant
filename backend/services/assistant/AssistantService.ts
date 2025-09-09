import { OpenAIService, ConversationMessage } from "backend/client/openai/OpenAIService";
import { OpenAIServiceFactory } from "backend/client/openai/OpenAIServiceFactory";
import { systemPrompt } from "backend/assistant/prompts/systemPrompt";
import { MemoryService } from "../memory/MemoryService";

export class AssistantService {
  
  openAIService: OpenAIService;
  memoryService: MemoryService;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }
    const openAIFactory = new OpenAIServiceFactory();
    this.openAIService = openAIFactory.build();
    
    const memoryService = new MemoryService();
    this.memoryService = memoryService;
  }


  async sendMessage(systemPrompt: string, message: string): Promise<string> {
    console.log("Sending message to assistant:", message);
    const response = await this.openAIService.sendChatMessage(systemPrompt, message);
    return response;
  }

  async sendConversation(systemPrompt: string, messages: ConversationMessage[]): Promise<string> {
    console.log("Sending conversation to assistant:", messages.length, "messages");

    const enhancedMessages = await this.addMemoryMessages(messages);

    console.log("Adding memory messages to conversation:", enhancedMessages.length, "messages");

    const response = await this.openAIService.sendChatMessages(systemPrompt, enhancedMessages);
    return response;
  }

  async addMemoryMessages(messages: ConversationMessage[]): Promise<ConversationMessage[]> {

    const lastMemory = await this.memoryService.getLastMemoryAsMessage();
    if (lastMemory) {
      return [lastMemory, ...messages];
    }
    return messages;

  }
}

if (require.main === module) {
  const assistant = new AssistantService();
  assistant.sendMessage(systemPrompt, "Hello, how are you? what's your name?").then(console.log);
}