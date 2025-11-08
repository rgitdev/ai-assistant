import { MemoryFragment } from "./MemoryFragment";
import { IMemoryRepository } from "backend/repository/memory/IMemoryRepository";
import { MemoryCategory } from "backend/models/Memory";
import { userProfileSystemPrompt } from "@backend/services/memory/prompts/userProfileSystemPrompt";

/**
 * Fragment for retrieving the latest user profile memory.
 */
export class LastUserProfileFragment implements MemoryFragment {
  readonly category = MemoryCategory.USER_PROFILE;

  constructor(private readonly memoryRepository: IMemoryRepository) {}

  getCreationSystemPrompt(): string {
    return userProfileSystemPrompt;
  }

  async getMemory(): Promise<string | null> {
    const userProfileMemory = await this.memoryRepository.findMemoriesByCategory(this.category);

    const lastUserProfileMemory = userProfileMemory.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

    if (!lastUserProfileMemory) {
      return null;
    }

    return `User profile: ${lastUserProfileMemory.title}\n\n${lastUserProfileMemory.content}`;
  }
}
