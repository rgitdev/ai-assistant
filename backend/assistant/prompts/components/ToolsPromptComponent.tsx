import { SystemPromptComponent } from "./interfaces";

/**
 * System component that provides instructions about available tools.
 * This is a system-only component (no associated messages).
 * Tools are provided via OpenAI API, not as messages.
 */
export class ToolsPromptComponent implements SystemPromptComponent {
  getLabel(): string {
    return "TOOLS";
  }

  getInstruction(): string {
    return `## Available Tools
You have access to tools that can help you provide better responses. These tools are automatically available through the function calling API.

When you need information that a tool can provide (like weather forecasts), feel free to use the appropriate tool. The system will handle the tool execution and provide you with the results.

Use tools naturally when they would enhance your response. Don't mention the technical details of tool usage to the user unless specifically asked.`;
  }
}
