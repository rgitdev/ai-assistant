import { ConversationMessage } from "backend/client/openai/OpenAIService";

/**
 * Component that contributes static instruction text to the system prompt.
 * This instruction explains how to interpret messages with a specific label.
 *
 * Example: An instruction might say "Messages labeled 'MEMORY MESSAGE:' contain
 * your memories from previous conversations."
 */
export interface SystemPromptComponent {
  /**
   * Unique label used to identify this type of message (e.g., "MEMORY MESSAGE")
   * This label will be used to prefix messages in the conversation.
   */
  getLabel(): string;

  /**
   * Static instruction text that explains how to interpret messages with this label.
   * This text is added to the system prompt (cacheable).
   */
  getInstruction(): string;
}

/**
 * Component that generates dynamic messages to be included in the conversation.
 * Messages are prefixed with a label that corresponds to a SystemPromptComponent.
 *
 * Example: A message might contain "MEMORY MESSAGE: User prefers technical details..."
 */
export interface MessageComponent {
  /**
   * The label that matches a SystemPromptComponent.
   * Used to prefix the message content.
   */
  getLabel(): string;

  /**
   * Build dynamic message(s) with label prefix.
   * Returns an array of conversation messages to be inserted into the conversation.
   */
  buildMessages(): ConversationMessage[];
}
