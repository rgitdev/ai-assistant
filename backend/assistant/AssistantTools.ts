/**
 * AssistantTools defines which tools are available to the Assistant.
 * This provides a centralized configuration for tool selection,
 * allowing the Assistant to use a specific subset of tools from the ToolRegistry.
 */
export class AssistantTools {
  /**
   * List of tool names that the Assistant should have access to.
   * Includes conversation retrieval, image analysis, and weather tools.
   */
  static readonly TOOL_NAMES = [
    'weather_forecast',
    'get_conversation',
    'get_images_for_analysis',
    'analyze_message_with_images'
  ];

  /**
   * Get the list of tool names available to the Assistant.
   * @returns Array of tool names
   */
  static getToolNames(): string[] {
    return this.TOOL_NAMES;
  }

  /**
   * Check if a tool is available to the Assistant.
   * @param toolName - The name of the tool to check
   * @returns true if the tool is available, false otherwise
   */
  static isToolAvailable(toolName: string): boolean {
    return this.TOOL_NAMES.includes(toolName);
  }
}
