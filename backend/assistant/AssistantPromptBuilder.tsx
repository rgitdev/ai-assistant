import { ConversationMessage } from "backend/client/openai/OpenAIService";
import { getBaseAssistantSystemPrompt, getMemoryInstructionPrompt } from "./prompts/systemPrompt";

/**
 * Builder class for constructing assistant prompts.
 * Separates static content (cacheable in system prompt) from dynamic content (in messages).
 *
 * Static content (system prompt):
 * - Persona (character definition)
 * - Chat usage instructions
 * - Memory instructions
 *
 * Dynamic content (messages):
 * - Time context
 * - Memory search results
 * - Conversation history
 */
export class AssistantPromptBuilder {
  private timeContext: string | null = null;
  private memoryMessages: ConversationMessage[] = [];
  private conversationMessages: ConversationMessage[] = [];

  /**
   * Build the static system prompt (cacheable content)
   */
  buildSystemPrompt(): string {
    return getBaseAssistantSystemPrompt() + "\n\n" + getMemoryInstructionPrompt();
  }

  /**
   * Add time context message (dynamic content)
   */
  withTimeContext(currentTime: string): this {
    this.timeContext = currentTime;
    return this;
  }

  /**
   * Add memory messages (dynamic content)
   */
  withMemoryMessages(messages: ConversationMessage[]): this {
    this.memoryMessages = messages;
    return this;
  }

  /**
   * Add conversation messages (dynamic content)
   */
  withConversationMessages(messages: ConversationMessage[]): this {
    this.conversationMessages = messages;
    return this;
  }

  /**
   * Build the complete message array with dynamic content in correct order:
   * 1. Time context (if provided)
   * 2. Memory messages (if any)
   * 3. Conversation history
   */
  buildMessages(): ConversationMessage[] {
    const messages: ConversationMessage[] = [];

    // Add time context message if provided
    if (this.timeContext) {
      messages.push({
        role: "assistant",
        content: `## Current Context
Current date and time: ${this.timeContext} (GMT+1/CEST)

When discussing time-sensitive topics, always reference the current date and time provided above to maintain temporal accuracy in your responses.`
      });
    }

    // Add memory messages (search results, latest memories, etc.)
    messages.push(...this.memoryMessages);

    // Add original conversation messages
    messages.push(...this.conversationMessages);

    return messages;
  }

  /**
   * Helper method to create a time context string in the expected format
   */
  static getCurrentTimeString(): string {
    return new Date().toLocaleString('en-US', {
      timeZone: 'Europe/Berlin',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  /**
   * Reset the builder to clean state
   */
  reset(): this {
    this.timeContext = null;
    this.memoryMessages = [];
    this.conversationMessages = [];
    return this;
  }
}
