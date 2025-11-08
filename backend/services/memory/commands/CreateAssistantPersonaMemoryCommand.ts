import { CreateMemoryCommand } from "./CreateMemoryCommand";
import { ChatMessage } from "backend/models/ChatMessage";
import { MemoryCategory } from "backend/models/Memory";
import { assistantPersonaSystemPrompt } from "@backend/services/memory/prompts/assistantPersonaSystemPrompt";

/**
 * Factory function for creating assistant persona memory commands.
 * Encapsulates the configuration (system prompt and category) for assistant persona memories.
 *
 * @param conversationId Unique conversation identifier
 * @param messages Conversation messages in chronological order
 * @returns Command with baked-in configuration
 */
export function CreateAssistantPersonaMemoryCommand(
  conversationId: string,
  messages: ChatMessage[]
): CreateMemoryCommand {
  return {
    conversationId,
    messages,
    memoryCategory: MemoryCategory.ASSISTANT_PERSONA,
    systemPrompt: assistantPersonaSystemPrompt,
  };
}
