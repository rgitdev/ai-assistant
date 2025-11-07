import { ConversationMessage } from "backend/client/openai/OpenAIService";
import { SystemPromptComponent, MessageComponent } from "./interfaces";

/**
 * System component that provides instructions for interpreting memory messages.
 * Explains that messages labeled "MEMORY MESSAGE:" contain memories from previous conversations.
 */
export class MemorySystemPromptComponent implements SystemPromptComponent {
  getLabel(): string {
    return "MEMORY MESSAGE";
  }

  getInstruction(): string {
    return `## Memory Context
Messages labeled "MEMORY MESSAGE:" contain your memories from previous conversations with this user. These memories help maintain continuity across sessions. Use them to:
- Recall previous topics and preferences
- Maintain consistent personality traits
- Reference past interactions naturally without explicitly mentioning "I remember from our previous conversation"
- Build upon established context and relationship dynamics`;
  }
}

/**
 * Message component that generates memory messages from conversation history.
 * Creates labeled assistant messages containing various types of memories.
 */
export class MemoryMessageComponent implements MessageComponent {
  constructor(private memoryMessages: ConversationMessage[]) {}

  getLabel(): string {
    return "MEMORY MESSAGE";
  }

  buildMessages(): ConversationMessage[] {
    if (this.memoryMessages.length === 0) {
      return [];
    }

    // Prefix each memory message with the MEMORY MESSAGE label
    return this.memoryMessages.map(msg => ({
      role: msg.role,
      content: `MEMORY MESSAGE:\n${msg.content}`
    }));
  }
}
