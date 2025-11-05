import { ConversationMessage } from "backend/client/openai/OpenAIService";
import { IConversationRepository } from "backend/repository/IConversationRepository";
import { ConversationRepositoryFactory } from "backend/repository/ConversationRepositoryFactory";
import { ChatMessage } from "backend/models/ChatMessage";
import { v4 as uuidv4 } from 'uuid';
import { AssistantService, SendConversationRequest } from "@backend/services/assistant/AssistantService";
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

    return response;
  }

  private async sendConversation(messages: ConversationMessage[]): Promise<string> {
    console.log("Sending conversation to assistant:", messages.length, "messages");
    const request = new SendConversationRequest(
      getBaseAssistantSystemPrompt(),
      getMemoryInstructionPrompt(),
      messages
    );
    const response = await this.assistantService.sendConversationWithMemory(request);
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

  /**
   * Validates that the given message is the last user message in the conversation
   * @throws Error if validation fails
   */
  private async validateIsLastUserMessage(conversationId: string, messageId: string): Promise<void> {
    const messages = await this.conversationRepository.getConversationMessages(conversationId);

    if (!messages || messages.length === 0) {
      throw new Error('Conversation is empty');
    }

    // Find the last user message
    const lastUserMessage = [...messages]
      .filter(m => m.role === 'user')
      .pop();

    if (!lastUserMessage) {
      throw new Error('No user message found in conversation');
    }

    if (lastUserMessage.id !== messageId) {
      throw new Error('Only the last user message can be edited');
    }
  }

  /**
   * Edit the last user message in a conversation and regenerate the assistant's response
   * This will:
   * 1. Validate that the message is the last user message
   * 2. Update the message content
   * 3. Delete all messages after it (including old assistant responses)
   * 4. Generate a new assistant response
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
    // Step 1: Validate that this is the last user message
    await this.validateIsLastUserMessage(conversationId, messageId);

    // Step 2: Update the user message with new content
    await this.conversationRepository.updateMessage(messageId, newContent);

    // Step 3: Delete all messages after the edited message (old assistant responses)
    await this.conversationRepository.deleteMessagesAfter(conversationId, messageId);

    // Step 4: Generate and add new assistant response
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