import { ChatMessage } from "backend/models/ChatMessage";
import { MemoryCategory } from "backend/models/Memory";

/**
 * Base command data structure for creating memory records.
 * Simple data record with no dependencies or logic.
 * Contains all data needed to create a memory.
 */
export interface CreateMemoryCommand {
  conversationId: string;
  messages: ChatMessage[];
  memoryCategory: MemoryCategory;
  systemPrompt: string;
}
