import { MemoryFragment } from "./MemoryFragment";
import { IMemoryRepository } from "backend/repository/memory/IMemoryRepository";
import { MemoryCategory, MEMORY_SYSTEM_PROMPT_NAMES } from "backend/models/Memory";
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
    const systemPromptName = MEMORY_SYSTEM_PROMPT_NAMES[this.category]!;
    const assistantPersonaMemory = await this.memoryRepository.findMemoriesByMetadata({
      systemPrompt: systemPromptName,
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
