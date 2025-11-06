import { IConversationRepository } from "backend/repository/IConversationRepository";
import { ChatMessage } from "backend/models/ChatMessage";

/**
 * ConversationService handles conversation state management operations
 * including validation, updates, and message removal.
 */
export class ConversationService {
  private conversationRepository: IConversationRepository;

  constructor(conversationRepository: IConversationRepository) {
    this.conversationRepository = conversationRepository;
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
   * Updates the last user message and removes all subsequent messages
   * This is a transactional operation that:
   * 1. Validates the message is the last user message
   * 2. Updates the message content
   * 3. Deletes all messages after it (including assistant responses)
   *
   * @param conversationId - The conversation ID
   * @param messageId - The ID of the last user message to update
   * @param newContent - The new content for the message
   * @throws Error if validation fails
   */
  async updateLastUserMessageAndRemoveFollowing(
    conversationId: string,
    messageId: string,
    newContent: string
  ): Promise<void> {
    // Step 1: Validate that this is the last user message
    await this.validateIsLastUserMessage(conversationId, messageId);

    // Step 2: Update the user message with new content
    await this.conversationRepository.updateMessage(messageId, newContent);

    // Step 3: Delete all messages after the edited message (old assistant responses)
    await this.conversationRepository.deleteMessagesAfter(conversationId, messageId);
  }
}
