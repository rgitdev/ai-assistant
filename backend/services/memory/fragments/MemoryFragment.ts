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
}
