import { MemoryFragment } from "./MemoryFragment";

/**
 * Collector class that processes memory fragments and compiles them into a formatted output.
 * Asynchronously processes each fragment and joins non-null memories with double newlines.
 */
export class MemoryFormatter {
  constructor(private readonly fragments: MemoryFragment[]) {}

  /**
   * Processes all fragments and returns a formatted string of memories.
   * @returns A formatted string containing all non-null fragment memories, joined by double newlines
   */
  async format(): Promise<string> {
    const memoryPromises = this.fragments.map((fragment) => fragment.getMemory());
    const memories = await Promise.all(memoryPromises);

    const nonNullMemories = memories.filter((memory): memory is string => memory !== null);

    if (nonNullMemories.length === 0) {
      return "";
    }

    return `Latest memories:\n\n${nonNullMemories.join("\n\n")}`;
  }
}
