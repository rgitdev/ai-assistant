import { MemoryCategory } from "backend/models/Memory";

/**
 * Interface for memory fragments that can be composed together.
 * Each fragment is responsible for fetching and formatting a specific type of memory.
 */
export interface MemoryFragment {
  /**
   * The memory category this fragment handles.
   * Used to determine the system prompt name for memory creation and retrieval.
   */
  readonly category: MemoryCategory;

  /**
   * Returns the system prompt text used for creating this fragment type.
   * This allows fragments to be the single source of truth for their creation prompts.
   * @returns The system prompt text
   */
  getCreationSystemPrompt(): string;

  /**
   * Returns the formatted memory content.
   * @returns A Promise resolving to string content or null if no memory exists
   */
  getMemory(): Promise<string | null>;
}
