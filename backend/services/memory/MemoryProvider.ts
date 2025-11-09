import { IMemoryRepository } from "backend/repository/memory/IMemoryRepository";
import { MemoryRepositoryFactory } from "backend/repository/memory/MemoryRepositoryFactory";
import { MemoryFormatter } from "./fragments/MemoryFormatter";
import { LastConversationFragment } from "./fragments/LastConversationFragment";
import { LastUserProfileFragment } from "./fragments/LastUserProfileFragment";
import { LastAssistantPersonaFragment } from "./fragments/LastAssistantPersonaFragment";
import { MemoryFragment } from "./fragments/MemoryFragment";
import { MemoryRecord, MemoryCategory } from "@backend/models/Memory";

/**
 * Custom memory fragment for ad-hoc memories.
 */
class CustomMemoryFragment implements MemoryFragment {
  constructor(
    public readonly category: MemoryCategory,
    private readonly memory: MemoryRecord
  ) {}

  async getMemory(): Promise<string | null> {
    return `${this.memory.title}\n${this.memory.content}`;
  }
}

/**
 * Builder for flexible memory message assembly.
 * Allows composing different memory sources with a fluent API.
 */
export class MemoryProviderBuilder {
  private fragments: MemoryFragment[] = [];
  private memoryRepository: IMemoryRepository;

  constructor() {
    const memoryRepoFactory = new MemoryRepositoryFactory();
    this.memoryRepository = memoryRepoFactory.build();
  }

  /**
   * Include latest conversation memory.
   */
  withLatestConversation(): this {
    this.fragments.push(new LastConversationFragment(this.memoryRepository));
    return this;
  }

  /**
   * Include user profile memory.
   */
  withUserProfile(): this {
    this.fragments.push(new LastUserProfileFragment(this.memoryRepository));
    return this;
  }

  /**
   * Include assistant persona memory.
   */
  withAssistantPersona(): this {
    this.fragments.push(new LastAssistantPersonaFragment(this.memoryRepository));
    return this;
  }

  /**
   * Add a custom memory record.
   */
  withMemory(memory: MemoryRecord): this {
    this.fragments.push(new CustomMemoryFragment(memory.category, memory));
    return this;
  }

  /**
   * Add multiple custom memory records.
   */
  withMemories(memories: MemoryRecord[]): this {
    memories.forEach(memory => this.withMemory(memory));
    return this;
  }

  /**
   * Add a custom fragment.
   */
  withFragment(fragment: MemoryFragment): this {
    this.fragments.push(fragment);
    return this;
  }

  /**
   * Build and format all memories.
   */
  async build(): Promise<string> {
    const formatter = new MemoryFormatter(this.fragments);
    return formatter.format();
  }
}

/**
 * Service responsible for retrieving and formatting memories.
 * Provides memories in a formatted string for use in assistant prompts.
 * Uses builder pattern for flexible memory composition.
 */
export class MemoryProvider {
  private readonly memoryRepository: IMemoryRepository;

  constructor() {
    const memoryRepoFactory = new MemoryRepositoryFactory();
    this.memoryRepository = memoryRepoFactory.build();
  }

  /**
   * Create a new builder for flexible memory composition.
   */
  builder(): MemoryProviderBuilder {
    return new MemoryProviderBuilder();
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
    // Default behavior using builder for backward compatibility
    return this.builder()
      .withLatestConversation()
      .withUserProfile()
      .withAssistantPersona()
      .build();
  }
}
