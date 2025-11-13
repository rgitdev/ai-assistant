import { OpenAIService, ConversationMessage } from "backend/client/openai/OpenAIService";
import { AssistantPromptBuilder } from "backend/assistant/AssistantPromptBuilder";
import { ToolRegistry } from "./ToolRegistry";

/**
 * Service responsible for OpenAI communication.
 * Supports both simple conversations and tool-enhanced conversations.
 */
export class AssistantService {

  private readonly openAIService: OpenAIService;
  private readonly toolRegistry?: ToolRegistry;

  constructor(openAIService: OpenAIService, toolRegistry?: ToolRegistry) {
    this.openAIService = openAIService;
    this.toolRegistry = toolRegistry;
  }


  /**
   * Send a single message to the assistant
   */
  async sendMessage(systemPrompt: string, message: string): Promise<string> {
    console.log("Sending message to assistant:", message);
    const response = await this.openAIService.sendChatMessage(systemPrompt, message);
    return response;
  }

  /**
   * Send a conversation (multiple messages) to the assistant
   */
  async sendConversation(systemPrompt: string, messages: ConversationMessage[]): Promise<string> {
    console.log("Sending conversation to assistant:", messages.length, "messages");
    const response = await this.openAIService.sendChatMessages(systemPrompt, messages);
    return response;
  }

  /**
   * Create memory from conversation messages using OpenAI.
   * Returns JSON string with memory data.
   *
   * @param systemPrompt The system prompt for memory creation
   * @param messages The conversation messages
   * @returns JSON string with memory data
   */
  async createMemory(systemPrompt: string, messages: ConversationMessage[]): Promise<string> {
    if (!messages || messages.length === 0) {
      throw new Error("messages are required to create a memory");
    }

    // Call OpenAI with JSON response format
    const responseJson = await this.openAIService.sendMessages(
      systemPrompt,
      messages
    );

    return responseJson;
  }

  /**
   * Send a conversation to OpenAI with tool support.
   * OpenAI will automatically decide when to use tools.
   * Requires ToolRegistry to be provided in constructor.
   */
  async sendConversationWithTools(
    systemPrompt: string,
    messages: ConversationMessage[],
    options: {
      maxToolIterations?: number;
      enableTools?: boolean;
      toolNames?: string[];
    } = {}
  ): Promise<string> {
    if (!this.toolRegistry) {
      throw new Error("ToolRegistry is required for sendConversationWithTools. Please provide it in the constructor.");
    }

    const { maxToolIterations = 5, enableTools = true, toolNames } = options;
    const tools = enableTools ? this.toolRegistry.getFilteredOpenAIToolDefinitions(toolNames) : undefined;

    // Only include toolChoice when tools are enabled (OpenAI doesn't allow tool_choice without tools)
    const toolOptions = enableTools
      ? { maxToolIterations, toolChoice: "auto" as const }
      : { maxToolIterations };

    return this.openAIService.sendConversationWithTools(
      systemPrompt,
      messages,
      tools,
      (name, args) => this.toolRegistry!.executeTool(name, args),
      toolOptions
    );
  }

  /**
   * Get list of available tools.
   * Requires ToolRegistry to be provided in constructor.
   */
  getAvailableTools(): string[] {
    if (!this.toolRegistry) {
      return [];
    }
    return this.toolRegistry.getToolNames();
  }

}