/**
 * Centralized type definition for all fragment creation names.
 * This eliminates duplication across fragment implementations and MemoryCreator.
 */
export enum MemoryFragmentType {
  CONVERSATION = "createMemorySystemPrompt",
  USER_PROFILE = "userProfileSystemPrompt",
  ASSISTANT_PERSONA = "createAssistantPersonaSystemPrompt",
}

/**
 * System prompt configuration for memory creation.
 */
export interface SystemPromptConfig {
  name: string;
  prompt: string;
}

/**
 * Interface for memory fragments that can be composed together.
 * Each fragment is responsible for fetching and formatting a specific type of memory.
 */
export interface MemoryFragment {
  /**
   * Returns the formatted memory content.
   * @returns A Promise resolving to string content or null if no memory exists
   */
  getMemory(): Promise<string | null>;

  /**
   * Returns the system prompt configuration used for creating this fragment type.
   * This allows fragments to be the single source of truth for their creation prompts.
   * @returns The system prompt configuration with name and prompt content
   */
  getCreationSystemPrompt(): SystemPromptConfig;
}
