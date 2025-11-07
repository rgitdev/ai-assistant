import { ConversationMessage } from "backend/client/openai/OpenAIService";
import { SystemPromptComponent, MessageComponent } from "./interfaces";

/**
 * System component that provides instructions for interpreting time context messages.
 * Explains that messages labeled "TIME CONTEXT:" contain current date/time information.
 */
export class TimeContextSystemPromptComponent implements SystemPromptComponent {
  getLabel(): string {
    return "TIME CONTEXT";
  }

  getInstruction(): string {
    return `## Time Context
Messages labeled "TIME CONTEXT:" provide the current date and time in CEST/GMT+1 timezone.
When discussing time-sensitive topics or scheduling, always reference this information to maintain temporal accuracy in your responses.`;
  }
}

/**
 * Message component that generates a time context message with the current date and time.
 * Creates a labeled assistant message showing the current time.
 */
export class TimeContextMessageComponent implements MessageComponent {
  getLabel(): string {
    return "TIME CONTEXT";
  }

  buildMessages(): ConversationMessage[] {
    const currentTime = this.getCurrentTimeString();

    return [{
      role: "assistant",
      content: `TIME CONTEXT: ${currentTime}`
    }];
  }

  /**
   * Helper method to create a time context string in the expected format
   */
  private getCurrentTimeString(): string {
    return new Date().toLocaleString('en-US', {
      timeZone: 'Europe/Berlin',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }) + ' (CEST/GMT+1)';
  }
}
