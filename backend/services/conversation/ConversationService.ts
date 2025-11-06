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
   * Validates that the given message is the last user message in the conversation
   * @throws Error if validation fails
   */
  async validateIsLastUserMessage(conversationId: string, messageId: string): Promise<void> {
    const messages = await this.conversationRepository.getConversationMessages(conversationId);

    if (!messages || messages.length === 0) {
      throw new Error('Conversation is empty');
    }

    // Find the last user message
    const userMessages = messages.filter(m => m.role === 'user');
    const lastUserMessage = userMessages[userMessages.length - 1];

    if (!lastUserMessage) {
      throw new Error('No user message found in conversation');
    }

    if (lastUserMessage.id !== messageId) {
      console.error('Message ID mismatch:', {
        expected: messageId,
        actual: lastUserMessage.id,
        lastUserMessageIndex: userMessages.length - 1,
        totalMessages: messages.length,
        userMessageCount: userMessages.length
      });
      throw new Error('Only the last user message can be edited');
    }
  }

  /**
   * Updates the last user message and removes all subsequent messages
   * This is a transactional operation that:
   * 1. Finds the last user message in the conversation
   * 2. Updates the message content
   * 3. Deletes all messages after it (including assistant responses)
   *
   * @param conversationId - The conversation ID
   * @param messageId - The ID of the last user message to update (for validation, but we use the actual last user message ID)
   * @param newContent - The new content for the message
   * @throws Error if validation fails
   */
  async updateLastUserMessageAndRemoveFollowing(
    conversationId: string,
    messageId: string,
    newContent: string
  ): Promise<void> {
    const messages = await this.conversationRepository.getConversationMessages(conversationId);

    if (!messages || messages.length === 0) {
      throw new Error('Conversation is empty');
    }

    // Find the last user message (use the actual message ID from the conversation)
    const userMessages = messages.filter(m => m.role === 'user');
    const lastUserMessage = userMessages[userMessages.length - 1];

    if (!lastUserMessage) {
      throw new Error('No user message found in conversation');
    }

    // Use the actual last user message ID, not the one passed from frontend
    const actualMessageId = lastUserMessage.id;

    // Step 1: Update the user message with new content
    await this.conversationRepository.updateMessage(actualMessageId, newContent);

    // Step 2: Delete all messages after the edited message (old assistant responses)
    await this.conversationRepository.deleteMessagesAfter(conversationId, actualMessageId);
  }
}
