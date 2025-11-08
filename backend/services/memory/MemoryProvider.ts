import { IMemoryRepository } from "backend/repository/memory/IMemoryRepository";
import { MemoryRepositoryFactory } from "backend/repository/memory/MemoryRepositoryFactory";
import { MemoryFormatter } from "./fragments/MemoryFormatter";
import { LastConversationFragment } from "./fragments/LastConversationFragment";
import { LastUserProfileFragment } from "./fragments/LastUserProfileFragment";
import { LastAssistantPersonaFragment } from "./fragments/LastAssistantPersonaFragment";

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
    const fragments = [
      new LastConversationFragment(this.memoryRepository),
      new LastUserProfileFragment(this.memoryRepository),
      new LastAssistantPersonaFragment(this.memoryRepository),
    ];

    const formatter = new MemoryFormatter(fragments);
    return formatter.format();
  }
}
