import { IMemoryRepository } from "backend/repository/memory/IMemoryRepository";
import { MemoryRepositoryFactory } from "backend/repository/memory/MemoryRepositoryFactory";

const createMemorySystemPrompt = {
  name: "createMemorySystemPrompt",
}

const createUserProfileSystemPrompt = {
  name: "userProfileSystemPrompt",
}

const createAssistantPersonaSystemPrompt = {
  name: "createAssistantPersonaSystemPrompt",
}

/**
 * Service responsible for retrieving and formatting memories.
 * Provides memories in a formatted string for use in assistant prompts.
 */
export class MemoryProvider {
  private readonly memoryRepository: IMemoryRepository;

  constructor() {
    const memoryRepoFactory = new MemoryRepositoryFactory();
    this.memoryRepository = memoryRepoFactory.build();
  }

  /**
   * Retrieves and formats the latest memories from different categories.
   * Returns a formatted string containing:
   * - Latest conversation memory
   * - User profile information
   * - Assistant persona information
   *
   * @returns Formatted string of memories, or empty string if no memories exist
   */
  public async getFormattedMemories(): Promise<string> {
    const userProfileMemory = await this.memoryRepository.findMemoriesByMetadata({
      systemPrompt: createUserProfileSystemPrompt.name,
    });

    const lastUserProfileMemory = userProfileMemory.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    const assistantPersonaMemory = await this.memoryRepository.findMemoriesByMetadata({
      systemPrompt: createAssistantPersonaSystemPrompt.name,
    });
    const lastAssistantPersonaMemory = assistantPersonaMemory.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    const memories = await this.memoryRepository.findMemoriesByMetadata({
      systemPrompt: createMemorySystemPrompt.name,
    });

    const memory = memories.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    return `Latest memories:

      ${memory ? `\nLatest conversation memory: ${memory.title}\n\n${memory.content}` : ""}

      ${lastUserProfileMemory ? `\nUser profile: ${lastUserProfileMemory.title}\n\n${lastUserProfileMemory.content}` : ""}

      ${lastAssistantPersonaMemory ? `\nAssistant persona: ${lastAssistantPersonaMemory.title}\n\n${lastAssistantPersonaMemory.content}` : ""}
      `;
  }
}
