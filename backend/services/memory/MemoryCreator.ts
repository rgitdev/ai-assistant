import { IMemoryRepository, MemoryCreateInput } from "backend/repository/memory/IMemoryRepository";
import { MemoryRepositoryFactory } from "backend/repository/memory/MemoryRepositoryFactory";
import { MemoryRecord, MemoryCategory } from "backend/models/Memory";
import { CreateMemoryCommand } from "./commands/CreateMemoryCommand";
import { AssistantService } from "backend/services/assistant/AssistantService";

/**
 * Service responsible for creating and storing memories from conversations.
 * Uses AssistantService for OpenAI interaction (separation of concerns).
 * Commands are simple data structures with configuration baked in.
 */
export class MemoryCreator {
  private readonly assistantService: AssistantService;
  private readonly memoryRepository: IMemoryRepository;
  private readonly overwrite: boolean;

  constructor(assistantService: AssistantService) {
    this.assistantService = assistantService;

    const memoryRepoFactory = new MemoryRepositoryFactory();
    this.memoryRepository = memoryRepoFactory.build();

    this.overwrite = false;
  }

  /**
   * Creates a memory record from a command.
   * Checks for duplicates and persists the memory.
   *
   * @param command Command containing conversationId, messages, category, and systemPrompt
   * @returns The persisted memory record
   */
  public async createMemory(command: CreateMemoryCommand): Promise<MemoryRecord> {
    const { conversationId, messages, memoryCategory, systemPrompt } = command;

    const createInput = await this.createMemoryInput(
      conversationId,
      messages,
      memoryCategory,
      systemPrompt
    );

    const prevRecords = await this.memoryRepository.findMemoryBySource({
      type: "chat",
      reference: conversationId,
    });

    const previousMatchingMemory = prevRecords.find(r => r.category === memoryCategory);

    if (previousMatchingMemory && !this.overwrite) {
      return previousMatchingMemory;
    }

    console.log("Checking previous memories for conversation: ", conversationId, prevRecords.map(r => r.id));
    const record = await this.memoryRepository.createMemory(createInput);
    console.log("Created memory: ", record.id);

    if (previousMatchingMemory) {
      console.log("Deleting previous memories", previousMatchingMemory.id);
      // await Promise.all(prevRecords.map(r => this.memoryRepository.deleteMemory(r.id)));
    }

    return record;
  }

  /**
   * Creates the memory input by using AssistantService for OpenAI interaction.
   * AssistantService handles the LLM call and returns the parsed response.
   */
  private async createMemoryInput(
    conversationId: string,
    messages: any[],
    category: MemoryCategory,
    systemPrompt: string
  ): Promise<MemoryCreateInput> {
    if (!conversationId || conversationId.trim().length === 0) {
      throw new Error("conversationId is required");
    }

    // Delegate OpenAI interaction to AssistantService
    const memoryResponse = await this.assistantService.createMemoryInput(
      systemPrompt,
      messages
    );

    const title = memoryResponse.title;
    const content = memoryResponse.memory;
    const importance = 3;

    // Derive the creator name from the category
    const createdBy = `MemoryCreator.createMemory`;

    return {
      title,
      content,
      tags: [],
      importance,
      category,
      sources: [
        {
          type: "chat",
          reference: conversationId,
          title: "Conversation",
          excerpt: undefined,
          timestamp: new Date(),
        },
      ],
      metadata: {
        conversationId,
        messageCount: messages.length,
        createdFrom: "conversation",
        createdBy,
      },
    };
  }
}
