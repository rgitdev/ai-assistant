import { MemoryFragment, MemoryFragmentType, SystemPromptConfig } from "./MemoryFragment";
import { IMemoryRepository } from "backend/repository/memory/IMemoryRepository";
import { assistantPersonaSystemPrompt } from "@backend/services/memory/prompts/assistantPersonaSystemPrompt";

/**
 * Fragment for retrieving the latest assistant persona memory.
 */
export class LastAssistantPersonaFragment implements MemoryFragment {
  constructor(private readonly memoryRepository: IMemoryRepository) {}

  getCreationSystemPrompt(): SystemPromptConfig {
    return {
      name: MemoryFragmentType.ASSISTANT_PERSONA,
      prompt: assistantPersonaSystemPrompt,
    };
  }

  async getMemory(): Promise<string | null> {
    const systemPrompt = this.getCreationSystemPrompt();
    const assistantPersonaMemory = await this.memoryRepository.findMemoriesByMetadata({
      systemPrompt: systemPrompt.name,
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
