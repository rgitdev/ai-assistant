import { MemoryFragment } from "./MemoryFragment";
import { IMemoryRepository } from "backend/repository/memory/IMemoryRepository";

const createAssistantPersonaSystemPrompt = {
  name: "createAssistantPersonaSystemPrompt",
};

/**
 * Fragment for retrieving the latest assistant persona memory.
 */
export class LastAssistantPersonaFragment implements MemoryFragment {
  constructor(private readonly memoryRepository: IMemoryRepository) {}

  getFragmentName(): string {
    return "LastAssistantPersonaFragment";
  }

  async getMemory(): Promise<string | null> {
    const assistantPersonaMemory = await this.memoryRepository.findMemoriesByMetadata({
      systemPrompt: createAssistantPersonaSystemPrompt.name,
    });

    const lastAssistantPersonaMemory = assistantPersonaMemory.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

    if (!lastAssistantPersonaMemory) {
      return null;
    }

    return `Assistant persona: ${lastAssistantPersonaMemory.title}\n\n${lastAssistantPersonaMemory.content}`;
  }
}
