import { MemoryFragment } from "./MemoryFragment";
import { IMemoryRepository } from "backend/repository/memory/IMemoryRepository";

const createMemorySystemPrompt = {
  name: "createMemorySystemPrompt",
};

/**
 * Fragment for retrieving the latest conversation memory.
 */
export class LastConversationFragment implements MemoryFragment {
  constructor(private readonly memoryRepository: IMemoryRepository) {}

  async getMemory(): Promise<string | null> {
    const memories = await this.memoryRepository.findMemoriesByMetadata({
      systemPrompt: createMemorySystemPrompt.name,
    });

    const memory = memories.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

    if (!memory) {
      return null;
    }

    return `Latest conversation memory: ${memory.title}\n\n${memory.content}`;
  }
}
