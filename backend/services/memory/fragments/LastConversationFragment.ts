import { MemoryFragment } from "./MemoryFragment";
import { IMemoryRepository } from "backend/repository/memory/IMemoryRepository";
import { MemoryCategory } from "backend/models/Memory";

/**
 * Fragment for retrieving the latest conversation memory.
 */
export class LastConversationFragment implements MemoryFragment {
  readonly category = MemoryCategory.CONVERSATION;

  constructor(private readonly memoryRepository: IMemoryRepository) {}

  async getMemory(): Promise<string | null> {
    const memories = await this.memoryRepository.findMemoriesByCategory(this.category);

    const memory = memories.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

    if (!memory) {
      return null;
    }

    return `Latest conversation memory: ${memory.title}\n\n${memory.content}`;
  }
}
