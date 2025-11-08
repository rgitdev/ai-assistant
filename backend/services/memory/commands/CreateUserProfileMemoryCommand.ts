import { CreateMemoryCommand } from "./CreateMemoryCommand";
import { ChatMessage } from "backend/models/ChatMessage";
import { MemoryCategory } from "backend/models/Memory";
import { userProfileSystemPrompt } from "@backend/services/memory/prompts/userProfileSystemPrompt";

/**
 * Factory function for creating user profile memory commands.
 * Encapsulates the configuration (system prompt and category) for user profile memories.
 *
 * @param conversationId Unique conversation identifier
 * @param messages Conversation messages in chronological order
 * @returns Command with baked-in configuration
 */
export function CreateUserProfileMemoryCommand(
  conversationId: string,
  messages: ChatMessage[]
): CreateMemoryCommand {
  return {
    conversationId,
    messages,
    memoryCategory: MemoryCategory.USER_PROFILE,
    systemPrompt: userProfileSystemPrompt,
  };
}
