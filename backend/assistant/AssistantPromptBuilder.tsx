import { ConversationMessage } from "backend/client/openai/OpenAIService";
import { SystemPromptComponent, MessageComponent } from "./prompts/components/interfaces";
import { PersonaComponent } from "./prompts/components/PersonaComponent";
import { ChatUsageComponent } from "./prompts/components/ChatUsageComponent";
import { TimeContextSystemPromptComponent, TimeContextMessageComponent } from "./prompts/components/TimeContextPromptComponent";
import { MemorySystemPromptComponent, MemoryMessageComponent } from "./prompts/components/MemoryPromptComponent";

/**
 * Builder class for constructing assistant prompts using a modular component system.
 *
 * Architecture:
 * - System prompt (static, cacheable): Contains instructions about how to interpret labeled messages
 * - Messages (dynamic): Contains actual data prefixed with labels
 *
 * Example:
 * System Prompt: "Messages labeled 'MEMORY MESSAGE:' contain your memories..."
 * Messages: [{ role: "assistant", content: "MEMORY MESSAGE: User prefers technical details..." }]
 *
 * This separation enables:
 * - OpenAI prompt caching for static instructions
 * - Clear labeling of message purposes
 * - Easy extensibility by adding new component pairs
 */
export class AssistantPromptBuilder {
  private systemComponents: SystemPromptComponent[] = [];
  private messageComponents: MessageComponent[] = [];
  private conversationMessages: ConversationMessage[] = [];

  constructor() {
    // Always include base components (persona and chat usage)
    this.systemComponents.push(new PersonaComponent());
    this.systemComponents.push(new ChatUsageComponent());
  }

  /**
   * Register a component pair: system instruction + optional message generator
   *
   * @param systemComp - Component that provides static instruction for system prompt
   * @param messageComp - Optional component that generates dynamic messages
   */
  registerComponent(
    systemComp: SystemPromptComponent,
    messageComp?: MessageComponent
  ): this {
    this.systemComponents.push(systemComp);
    if (messageComp) {
      this.messageComponents.push(messageComp);
    }
    return this;
  }

  /**
   * Add time context to the conversation.
   * Registers both the instruction and the message component.
   */
  withTimeContext(): this {
    return this.registerComponent(
      new TimeContextSystemPromptComponent(),
      new TimeContextMessageComponent()
    );
  }

  /**
   * Add memory messages to the conversation.
   * Registers both the instruction and the message component.
   *
   * @param messages - Memory messages from previous conversations
   */
  withMemoryMessages(messages: ConversationMessage[]): this {
    if (messages.length > 0) {
      return this.registerComponent(
        new MemorySystemPromptComponent(),
        new MemoryMessageComponent(messages)
      );
    }
    return this;
  }

  /**
   * Add conversation messages (user and assistant messages).
   * These are appended after all context messages.
   *
   * @param messages - Conversation history
   */
  withConversationMessages(messages: ConversationMessage[]): this {
    this.conversationMessages = messages;
    return this;
  }

  /**
   * Build the static system prompt from all registered components.
   * This is cacheable by OpenAI for better performance.
   */
  buildSystemPrompt(): string {
    return this.systemComponents
      .map(comp => comp.getInstruction())
      .join('\n\n');
  }

  /**
   * Build the complete message array in correct order:
   * 1. Context messages (time, memory, etc.) with labels
   * 2. Conversation history (user/assistant messages)
   */
  buildMessages(): ConversationMessage[] {
    const contextMessages = this.messageComponents
      .flatMap(comp => comp.buildMessages());

    return [...contextMessages, ...this.conversationMessages];
  }

  /**
   * Reset the builder to clean state.
   * Note: Keeps base components (persona, chat usage) but clears registered components.
   */
  reset(): this {
    // Keep only the base components
    this.systemComponents = [new PersonaComponent(), new ChatUsageComponent()];
    this.messageComponents = [];
    this.conversationMessages = [];
    return this;
  }
}
