import { ConversationMessage } from "backend/client/openai/OpenAIService";
import { IConversationRepository } from "backend/repository/IConversationRepository";
import { ConversationRepositoryFactory } from "backend/repository/ConversationRepositoryFactory";
import { ChatMessage } from "backend/models/ChatMessage";
import { v4 as uuidv4 } from 'uuid';
import { AssistantService } from "@backend/services/assistant/AssistantService";
import { getAssistantSystemPrompt, getBaseAssistantSystemPrompt, getMemoryInstructionPrompt } from "@backend/assistant/prompts/systemPrompt";

export class Assistant {
  
  assistantService: AssistantService;
  conversationRepository: IConversationRepository;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }

    const assistantService = new AssistantService();
    this.assistantService = assistantService;

    const repositoryFactory = new ConversationRepositoryFactory();
    this.conversationRepository = repositoryFactory.build();
  }


  async sendMessage(message: string): Promise<string> {
    console.log("Sending message to assistant:", message);
    const response = await this.assistantService.sendMessage(getAssistantSystemPrompt(), message);
    return response;
  }

  async sendConversation(messages: ConversationMessage[]): Promise<string> {
    console.log("Sending conversation to assistant:", messages.length, "messages");
    const response = await this.assistantService.sendConversationWithMemory(
      getBaseAssistantSystemPrompt(), 
      getMemoryInstructionPrompt(), 
      messages
    );
    return response;
  }

  async sendMessageToConversation(conversationId: string, userMessage: string): Promise<{ response: string; conversationId: string }> {
    const userChatMessage: ChatMessage = {
      id: uuidv4(),
      content: userMessage,
      role: 'user',
      timestamp: new Date().toISOString()
    };

    await this.conversationRepository.addMessage(conversationId, userChatMessage);

    // Get full conversation history and send to OpenAI
    const conversationMessages = await this.conversationRepository.getConversationMessages(conversationId);
    const openAIMessages: ConversationMessage[] = conversationMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const response = await this.sendConversation(openAIMessages);

    const assistantChatMessage: ChatMessage = {
      id: uuidv4(),
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

  async updateConversationName(conversationId: string, name: string): Promise<void> {
    await this.conversationRepository.updateConversationName(conversationId, name);
  }

  private async validateLastMessage(conversationId: string, messageId: string): Promise<void> {
    const messages = await this.conversationRepository.getConversationMessages(conversationId);
    if (!messages || messages.length === 0) {
      throw new Error('Conversation is empty');
    }
    const lastUserMessageIndex = [...messages]
      .map((m, idx) => ({ m, idx }))
      .filter(({ m }) => m.role === 'user')
      .map(({ idx }) => idx)
      .pop();
    if (lastUserMessageIndex === undefined) {
      throw new Error('No user message to edit');
    }
    const lastUserMessage = messages[lastUserMessageIndex];
    if (lastUserMessage.id !== messageId) {
      throw new Error('Only the last user message can be edited');
    }
  }

  async editLastUserMessageAndRegenerate(
    conversationId: string,
    messageId: string,
    newContent: string
  ): Promise<{ response: string; conversationId: string }> {
    await this.validateLastMessage(conversationId, messageId);

    await this.conversationRepository.updateMessage(messageId, newContent);
    await this.conversationRepository.deleteMessagesAfter(conversationId, messageId);

    const truncatedMessages = await this.conversationRepository.getConversationMessages(conversationId);
    const openAIMessages: ConversationMessage[] = truncatedMessages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));
    const response = await this.sendConversation(openAIMessages);

    const assistantChatMessage: ChatMessage = {
      id: uuidv4(),
      content: response,
      role: 'assistant',
      timestamp: new Date().toISOString(),
    };
    await this.conversationRepository.addMessage(conversationId, assistantChatMessage);

    return { response, conversationId };
  }
}

if (require.main === module) {
  const assistant = new Assistant();
  assistant.sendMessage("Hello, how are you? what's your name?").then(console.log);
}