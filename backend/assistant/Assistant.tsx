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

    await this.conversationRepository.addMessage(conversationId, userChatMessage);

    // Get full conversation history and send to OpenAI
    const conversationMessages = await this.conversationRepository.getConversationMessages(conversationId);
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

    await this.conversationRepository.addMessage(conversationId, assistantChatMessage);

    return { response, conversationId };
  }

  // Internal methods below

  private async sendConversation(messages: ConversationMessage[]): Promise<string> {
    console.log("Sending conversation to assistant:", messages.length, "messages");
    const response = await this.assistantService.sendConversationWithMemory(
      getBaseAssistantSystemPrompt(),
      getMemoryInstructionPrompt(),
      messages
    );
    return response;
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
  assistant.handleNewMessage("Hello, how are you? what's your name?").then(result => {
    console.log("Response:", result.response);
    console.log("Conversation ID:", result.conversationId);
  });
}