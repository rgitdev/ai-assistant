import { CreateMemoryCommand } from "./CreateMemoryCommand";
import { ChatMessage } from "backend/models/ChatMessage";
import { MemoryCategory } from "backend/models/Memory";
import { memorySystemPrompt } from "@backend/services/memory/prompts/memorySystemPrompt";

/**
 * Factory function for creating conversation summary memory commands.
 * Encapsulates the configuration (system prompt and category) for conversation memories.
 *
 * @param conversationId Unique conversation identifier
 * @param messages Conversation messages in chronological order
 * @returns Command with baked-in configuration
 */
export function CreateConversationMemoryCommand(
  conversationId: string,
  messages: ChatMessage[]
): CreateMemoryCommand {
  return {
    conversationId,
    messages,
    memoryCategory: MemoryCategory.CONVERSATION,
    systemPrompt: memorySystemPrompt,
  };
}
