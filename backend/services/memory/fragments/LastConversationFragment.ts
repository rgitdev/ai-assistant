import { MemoryFragment, MemoryFragmentType, SystemPromptConfig } from "./MemoryFragment";
import { IMemoryRepository } from "backend/repository/memory/IMemoryRepository";
import { memorySystemPrompt } from "@backend/services/memory/prompts/memorySystemPrompt";

/**
 * Fragment for retrieving the latest conversation memory.
 */
export class LastConversationFragment implements MemoryFragment {
  constructor(private readonly memoryRepository: IMemoryRepository) {}

  getCreationSystemPrompt(): SystemPromptConfig {
    return {
      name: MemoryFragmentType.CONVERSATION,
      prompt: memorySystemPrompt,
    };
  }

  async getMemory(): Promise<string | null> {
    const systemPrompt = this.getCreationSystemPrompt();
    const memories = await this.memoryRepository.findMemoriesByMetadata({
      systemPrompt: systemPrompt.name,
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
