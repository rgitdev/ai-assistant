import { ChatMessage } from "backend/models/ChatMessage";
import { MemoryRecord } from "backend/models/Memory";

/**
 * Command interface for creating memory records.
 * Implements the Command Pattern to encapsulate memory creation operations.
 */
export interface CreateMemoryCommand {
  /**
   * Executes the command to create a memory record from a conversation.
   *
   * @param conversationId Unique conversation identifier
   * @param messages Conversation messages in chronological order
   * @returns Promise resolving to the created memory record
   */
  execute(conversationId: string, messages: ChatMessage[]): Promise<MemoryRecord>;
}
