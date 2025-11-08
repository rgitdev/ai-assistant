import { MemoryFragment } from "./MemoryFragment";
import { IMemoryRepository } from "backend/repository/memory/IMemoryRepository";
import { MemoryCategory } from "backend/models/Memory";

/**
 * Fragment for retrieving the latest assistant persona memory.
 */
export class LastAssistantPersonaFragment implements MemoryFragment {
  readonly category = MemoryCategory.ASSISTANT_PERSONA;

  constructor(private readonly memoryRepository: IMemoryRepository) {}

  async getMemory(): Promise<string | null> {
    const assistantPersonaMemory = await this.memoryRepository.findMemoriesByCategory(this.category);

    const lastAssistantPersonaMemory = assistantPersonaMemory.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

    if (!lastAssistantPersonaMemory) {
      return null;
    }

    return `Assistant persona: ${lastAssistantPersonaMemory.title}\n\n${lastAssistantPersonaMemory.content}`;
  }
}
