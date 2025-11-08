import { MemoryFragment, MemoryFragmentType, SystemPromptConfig } from "./MemoryFragment";
import { IMemoryRepository } from "backend/repository/memory/IMemoryRepository";
import { userProfileSystemPrompt } from "@backend/services/memory/prompts/userProfileSystemPrompt";

/**
 * Fragment for retrieving the latest user profile memory.
 */
export class LastUserProfileFragment implements MemoryFragment {
  constructor(private readonly memoryRepository: IMemoryRepository) {}

  getCreationSystemPrompt(): SystemPromptConfig {
    return {
      name: MemoryFragmentType.USER_PROFILE,
      prompt: userProfileSystemPrompt,
    };
  }

  async getMemory(): Promise<string | null> {
    const systemPrompt = this.getCreationSystemPrompt();
    const userProfileMemory = await this.memoryRepository.findMemoriesByMetadata({
      systemPrompt: systemPrompt.name,
    });

    const lastUserProfileMemory = userProfileMemory.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

    if (!lastUserProfileMemory) {
      return null;
    }

    return `User profile: ${lastUserProfileMemory.title}\n\n${lastUserProfileMemory.content}`;
  }
}
