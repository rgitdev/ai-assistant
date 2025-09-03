import { OpenAIService, ConversationMessage } from "backend/client/openai/OpenAIService";
import { OpenAIServiceFactory } from "backend/client/openai/OpenAIServiceFactory";
import { systemPrompt } from "./prompts/systemPrompt";
import { IConversationRepository } from "backend/repository/IConversationRepository";
import { ConversationRepositoryFactory } from "backend/repository/ConversationRepositoryFactory";
import { ChatMessage } from "backend/models/ChatMessage";

export class Assistant {
  
  openAIService: OpenAIService;
  conversationRepository: IConversationRepository;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }
    const openAIFactory = new OpenAIServiceFactory();
    this.openAIService = openAIFactory.build();
    
    const repositoryFactory = new ConversationRepositoryFactory();
    this.conversationRepository = repositoryFactory.build();
  }


  async sendMessage(message: string): Promise<string> {
    console.log("Sending message to assistant:", message);
    const response = await this.openAIService.sendChatMessage(systemPrompt, message);
    return response;
  }

  async sendConversation(messages: ConversationMessage[]): Promise<string> {
    console.log("Sending conversation to assistant:", messages.length, "messages");
    const response = await this.openAIService.sendChatMessages(systemPrompt, messages);
    return response;
  }

  async sendMessageToConversation(conversationId: string, userMessage: string): Promise<{ response: string; conversationId: string }> {
    const userChatMessage: ChatMessage = {
      id: this.generateId(),
      content: userMessage,
      role: 'user',
      timestamp: new Date().toISOString()
    };

    await this.conversationRepository.addMessage(conversationId, userChatMessage);

    const response = await this.sendMessage(userMessage);

    const assistantChatMessage: ChatMessage = {
      id: this.generateId(),
      content: response,
      role: 'assistant',
      timestamp: new Date().toISOString()
    };

    await this.conversationRepository.addMessage(conversationId, assistantChatMessage);

    return { response, conversationId };
  }

  async createConversation(): Promise<string> {
    return await this.conversationRepository.createConversation();
  }

  async getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
    return await this.conversationRepository.getConversationMessages(conversationId);
  }

  async getConversations() {
    return await this.conversationRepository.getConversations();
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

if (require.main === module) {
  const assistant = new Assistant();
  assistant.sendMessage("Hello, how are you? what's your name?").then(console.log);
}