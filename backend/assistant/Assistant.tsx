import { ConversationMessage } from "backend/client/openai/OpenAIService";
import { ConversationRepositoryFactory } from "backend/repository/ConversationRepositoryFactory";
import { ChatMessage } from "backend/models/ChatMessage";
import { v4 as uuidv4 } from 'uuid';
import { AssistantService } from "@backend/services/assistant/AssistantService";
import { getAssistantSystemPrompt, getBaseAssistantSystemPrompt, getMemoryInstructionPrompt } from "@backend/assistant/prompts/systemPrompt";
import { MemoryService } from "@backend/services/memory/MemoryService";
import { MemorySearchService } from "@backend/services/memory/MemorySearchService";
import { VectorStore } from "@backend/client/vector/VectorStore";
import { OpenAIEmbeddingService } from "@backend/client/openai/OpenAIEmbeddingService";
import { ConversationService } from "@backend/services/conversation/ConversationService";

export class Assistant {

  assistantService: AssistantService;
  conversationService: ConversationService;
  memoryService: MemoryService;
  memorySearchService: MemorySearchService;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }

    const assistantService = new AssistantService();
    this.assistantService = assistantService;

    // Setup conversation service with repository
    const repositoryFactory = new ConversationRepositoryFactory();
    const conversationRepository = repositoryFactory.build();
    this.conversationService = new ConversationService(conversationRepository);

    // Orchestration: Assistant manages memory-related services
    this.memoryService = new MemoryService();

    const vectorStore = new VectorStore();
    const embeddingService = new OpenAIEmbeddingService();
    this.memorySearchService = new MemorySearchService(vectorStore, embeddingService);
  }


  /**
   * Handle a new message by creating a new conversation
   * @param message - The user's message
   * @returns Object containing the assistant's response and the new conversationId
   */
  async handleNewMessage(message: string): Promise<{ response: string; conversationId: string }> {
    const conversationId = await this.createConversation();
    return await this.handleMessage(conversationId, message);
  }

  /**
   * Handle a message in an existing conversation
   * @param conversationId - The ID of the existing conversation
   * @param message - The user's message
   * @returns Object containing the assistant's response and conversationId
   */
  async handleMessage(conversationId: string, message: string): Promise<{ response: string; conversationId: string }> {
    // Add user message to conversation
    const userChatMessage: ChatMessage = {
      id: uuidv4(),
      content: message,
      role: 'user',
      timestamp: new Date().toISOString()
    };

    await this.conversationService.addMessage(conversationId, userChatMessage);

    // Generate and add assistant response
    const response = await this.generateAndAddResponse(conversationId);

    return { response, conversationId };
  }

  // Internal methods below

  /**
   * Generate assistant response for the current conversation and add it to the conversation
   * @param conversationId - The conversation ID
   * @returns The assistant's response text
   */
  private async generateAndAddResponse(conversationId: string): Promise<string> {
    // Get full conversation history and send to OpenAI
    const conversationMessages = await this.conversationService.getConversationMessages(conversationId);
    const openAIMessages: ConversationMessage[] = conversationMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const response = await this.sendConversation(openAIMessages);

    // Add assistant response to conversation
    const assistantChatMessage: ChatMessage = {
      id: uuidv4(),
      content: response,
      role: 'assistant',
      timestamp: new Date().toISOString()
    };

    await this.conversationService.addMessage(conversationId, assistantChatMessage);

    return response;
  }

  private async sendConversation(messages: ConversationMessage[]): Promise<string> {
    console.log("Sending conversation to assistant:", messages.length, "messages");

    // Orchestrate: Add memory context to messages
    const enhancedMessages = await this.addMemoryToMessages(messages);
    console.log("Added memory messages to conversation:", enhancedMessages.length, "messages");

    const fullSystemPrompt = getBaseAssistantSystemPrompt() + "\n\n" + getMemoryInstructionPrompt();
    const response = await this.assistantService.sendConversation(fullSystemPrompt, enhancedMessages);
    return response;
  }

  /**
   * Orchestration method: Add memory context to conversation messages
   * Combines time context, memory search results, and latest memories
   */
  private async addMemoryToMessages(messages: ConversationMessage[]): Promise<ConversationMessage[]> {
    const enhancedMessages: ConversationMessage[] = [];

    // Add time context message
    const timeContextMessage = this.getCurrentTimeContextMessage();
    enhancedMessages.push(timeContextMessage);

    // Add search results from vector store
    const foundMemories = await this.memorySearchService.searchMemories(messages[messages.length - 1].content);

    // Add latest memory messages
    const lastMemory = await this.memoryService.getMemoriesAsAssistantMessage();
    if (lastMemory) {
      enhancedMessages.push(lastMemory);
    }

    // Add original conversation messages
    enhancedMessages.push(...messages);

    return enhancedMessages;
  }

  /**
   * Helper method: Create a time context message for the assistant
   */
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

  async createConversation(): Promise<string> {
    return await this.conversationService.createConversation();
  }

  async getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
    return await this.conversationService.getConversationMessages(conversationId);
  }

  async getConversations() {
    return await this.conversationService.getConversations();
  }

  async updateConversationName(conversationId: string, name: string): Promise<void> {
    await this.conversationService.updateConversationName(conversationId, name);
  }

  /**
   * Edit the last user message in a conversation and regenerate the assistant's response
   * This will:
   * 1. Update the last user message and remove all following messages (via ConversationService)
   * 2. Generate a new assistant response
   *
   * @param conversationId - The conversation ID
   * @param messageId - The ID of the last user message to edit
   * @param newContent - The new content for the message
   * @returns Object containing the new assistant response and conversationId
   */
  async editLastUserMessageAndRegenerate(
    conversationId: string,
    messageId: string,
    newContent: string
  ): Promise<{ response: string; conversationId: string }> {
    // Step 1: Update last user message and remove following messages
    await this.conversationService.updateLastUserMessageAndRemoveFollowing(
      conversationId,
      messageId,
      newContent
    );

    // Step 2: Generate and add new assistant response
    const response = await this.generateAndAddResponse(conversationId);

    return { response, conversationId };
  }
}

if (require.main === module) {
  const assistant = new Assistant();
  assistant.handleNewMessage("Hello, how are you? what's your name?").then(result => {
    console.log("Response:", result.response);
    console.log("Conversation ID:", result.conversationId);
  });
}