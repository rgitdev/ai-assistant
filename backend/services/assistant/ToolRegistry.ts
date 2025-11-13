// backend/services/assistant/ToolRegistry.ts
import type { ChatCompletionTool } from "openai/resources/chat/completions";

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (args: any) => Promise<any>;
}

/**
 * Registry for managing tools that the Assistant can use.
 * Provides OpenAI-compatible tool definitions and execution.
 */
export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  /**
   * Register a new tool
   */
  registerTool(tool: Tool): void {
    this.tools.set(tool.name, tool);
    console.log(`Registered tool: ${tool.name}`);
  }

  /**
   * Get a tool by name
   */
  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all tool definitions in OpenAI format
   */
  getOpenAIToolDefinitions(): ChatCompletionTool[] {
    return Array.from(this.tools.values()).map(tool => ({
      type: "function" as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      }
    }));
  }

  /**
   * Get filtered tool definitions in OpenAI format
   * @param toolNames - Array of tool names to include. If not provided, returns all tools.
   */
  getFilteredOpenAIToolDefinitions(toolNames?: string[]): ChatCompletionTool[] {
    if (!toolNames || toolNames.length === 0) {
      return this.getOpenAIToolDefinitions();
    }

    return toolNames
      .map(name => this.tools.get(name))
      .filter((tool): tool is Tool => tool !== undefined)
      .map(tool => ({
        type: "function" as const,
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters
        }
      }));
  }

  /**
   * Execute a tool by name with arguments
   */
  async executeTool(name: string, args: any): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }
    
    console.log(`Executing tool: ${name}`, args);
    const result = await tool.execute(args);
    console.log(`Tool ${name} completed`);
    
    return result;
  }

  /**
   * Get list of all registered tool names
   */
  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }
}