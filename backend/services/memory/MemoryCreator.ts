import { IMemoryRepository, MemoryCreateInput } from "backend/repository/memory/IMemoryRepository";
import { MemoryRepositoryFactory } from "backend/repository/memory/MemoryRepositoryFactory";
import { MemoryRecord } from "backend/models/Memory";
import { CreateMemoryCommand } from "./commands/CreateMemoryCommand";
import { ConversationMessage } from "backend/client/openai/OpenAIService";
import { z } from "zod";

const CreatedMemoryResponseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  memory: z.string().min(1, "Memory content is required"),
});

type CreatedMemoryResponse = z.infer<typeof CreatedMemoryResponseSchema>;

/**
 * Executor function type for LLM memory creation.
 * Takes system prompt and messages, returns JSON string with memory data.
 */
export type MemoryExecutor = (
  systemPrompt: string,
  messages: ConversationMessage[]
) => Promise<string>;

/**
 * Service responsible for creating and storing memories from conversations.
 * Uses dependency injection via executor function to call LLM.
 * No direct dependencies on AssistantService - keeps it clean and testable.
 */
export class MemoryCreator {
  private readonly memoryRepository: IMemoryRepository;
  private readonly overwrite: boolean;

  constructor() {
    const memoryRepoFactory = new MemoryRepositoryFactory();
    this.memoryRepository = memoryRepoFactory.build();

    this.overwrite = false;
  }

  /**
   * Creates a memory record from a command using provided executor function.
   * Checks for duplicates, calls executor to generate memory, and persists it.
   *
   * @param command Command containing conversationId, messages, category, and systemPrompt
   * @param executor Function that calls LLM to create memory (injected dependency)
   * @returns The created memory record, or null if already exists
   */
  public async createMemory(
    command: CreateMemoryCommand,
    executor: MemoryExecutor
  ): Promise<MemoryRecord | null> {
    const { conversationId, messages, memoryCategory, systemPrompt } = command;

    if (!conversationId || conversationId.trim().length === 0) {
      throw new Error("conversationId is required");
    }
    if (!messages || messages.length === 0) {
      throw new Error("messages are required to create a memory");
    }

    // Check for existing memories
    const prevRecords = await this.memoryRepository.findMemoryBySource({
      type: "chat",
      reference: conversationId,
    });

    const previousMatchingMemory = prevRecords.find(r => r.category === memoryCategory);

    if (previousMatchingMemory && !this.overwrite) {
      console.log(`Memory already exists for conversation ${conversationId}, category ${memoryCategory}`);
      return null;
    }

    // Convert ChatMessage to OpenAI ConversationMessage format
    const openAIMessages: ConversationMessage[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Call executor (injected LLM function) to generate memory
    const memoryJson = await executor(systemPrompt, openAIMessages);

    // Parse and validate JSON response
    const responseJson = JSON.parse(memoryJson);
    const memoryResponse = CreatedMemoryResponseSchema.parse(responseJson);

    const title = memoryResponse.title;
    const content = memoryResponse.memory;
    const importance = 3;

    const createdBy = `MemoryCreator.createMemory`;

    const createInput: MemoryCreateInput = {
      title,
      content,
      tags: [],
      importance,
      category: memoryCategory,
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

    console.log("Creating memory for conversation:", conversationId);
    const record = await this.memoryRepository.createMemory(createInput);
    console.log("Created memory:", record.id);

    return record;
  }
}
