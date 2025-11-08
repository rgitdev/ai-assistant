import { MemoryFragment } from "./MemoryFragment";
import { IMemoryRepository } from "backend/repository/memory/IMemoryRepository";
import { MemoryCategory } from "backend/models/Memory";
import { assistantPersonaSystemPrompt } from "@backend/services/memory/prompts/assistantPersonaSystemPrompt";

/**
 * Fragment for retrieving the latest assistant persona memory.
 */
export class LastAssistantPersonaFragment implements MemoryFragment {
  readonly category = MemoryCategory.ASSISTANT_PERSONA;

  constructor(private readonly memoryRepository: IMemoryRepository) {}

  getCreationSystemPrompt(): string {
    return assistantPersonaSystemPrompt;
  }

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
