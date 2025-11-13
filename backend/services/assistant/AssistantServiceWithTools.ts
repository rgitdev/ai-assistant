// backend/services/assistant/AssistantServiceWithTools.ts
// Service that supports OpenAI tool-calling via OpenAIService layer

import { ConversationMessage, OpenAIService } from "backend/client/openai/OpenAIService";
import { OpenAIServiceFactory } from "backend/client/openai/OpenAIServiceFactory";
import { ToolRegistry } from "./ToolRegistry";

export class AssistantServiceWithTools {
  private readonly openAIService: OpenAIService;
  private readonly toolRegistry: ToolRegistry;
  
  constructor(toolRegistry: ToolRegistry) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }

    const factory = new OpenAIServiceFactory();
    this.openAIService = factory.build();
    this.toolRegistry = toolRegistry;
  }

  /**
   * Send a conversation to OpenAI with tool support.
   * OpenAI will automatically decide when to use tools.
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
      (name, args) => this.toolRegistry.executeTool(name, args),
      toolOptions
    );
  }

  /**
   * Get list of available tools
   */
  getAvailableTools(): string[] {
    return this.toolRegistry.getToolNames();
  }
}