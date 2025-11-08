import { MemoryFragment } from "./MemoryFragment";
import { IMemoryRepository } from "backend/repository/memory/IMemoryRepository";

const createUserProfileSystemPrompt = {
  name: "userProfileSystemPrompt",
};

/**
 * Fragment for retrieving the latest user profile memory.
 */
export class LastUserProfileFragment implements MemoryFragment {
  constructor(private readonly memoryRepository: IMemoryRepository) {}

  async getMemory(): Promise<string | null> {
    const userProfileMemory = await this.memoryRepository.findMemoriesByMetadata({
      systemPrompt: createUserProfileSystemPrompt.name,
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
