import { IConversationRepository } from "backend/repository/IConversationRepository";
import { ChatMessage, Conversation } from "backend/models/ChatMessage";

/**
 * ConversationService handles all conversation-related operations
 * including CRUD operations, validation, updates, and message management.
 * This service encapsulates all interaction with the conversation repository.
 */
export class ConversationService {
  private conversationRepository: IConversationRepository;

  constructor(conversationRepository: IConversationRepository) {
    this.conversationRepository = conversationRepository;
  }

  /**
   * Create a new conversation
   * @returns The ID of the newly created conversation
   */
  async createConversation(): Promise<string> {
    return await this.conversationRepository.createConversation();
  }

  /**
   * Get all conversations
   * @returns Array of all conversations
   */
  async getConversations(): Promise<Conversation[]> {
    return await this.conversationRepository.getConversations();
  }

  /**
   * Get all messages in a conversation
   * @param conversationId - The conversation ID
   * @returns Array of chat messages in chronological order
   */
  async getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
    return await this.conversationRepository.getConversationMessages(conversationId);
  }

  /**
   * Add a message to a conversation
   * @param conversationId - The conversation ID
   * @param message - The message to add
   */
  async addMessage(conversationId: string, message: ChatMessage): Promise<void> {
    await this.conversationRepository.addMessage(conversationId, message);
  }

  /**
   * Update the name of a conversation
   * @param conversationId - The conversation ID
   * @param name - The new name for the conversation
   */
  async updateConversationName(conversationId: string, name: string): Promise<void> {
    await this.conversationRepository.updateConversationName(conversationId, name);
  }

  /**
   * Truncate conversation by removing a message and all following messages
   * This is useful for UI operations like editing messages where you want to:
   * 1. Remove the old message and all responses after it
   * 2. Then add the edited message through normal flow
   *
   * @param conversationId - The conversation ID
   * @param fromMessageId - Remove this message and all following messages
   * @throws Error if conversation or message not found
   */
  async truncateConversation(
    conversationId: string,
    fromMessageId: string
  ): Promise<void> {
    const messages = await this.conversationRepository.getConversationMessages(conversationId);

    if (!messages || messages.length === 0) {
      throw new Error('Conversation is empty');
    }

    const messageExists = messages.some(m => m.id === fromMessageId);
    if (!messageExists) {
      throw new Error('Message not found in conversation');
    }

    // Delete the message and all following messages
    await this.conversationRepository.deleteMessagesFrom(conversationId, fromMessageId);
  }
}
