import { IMemoryRepository, MemoryCreateInput } from "backend/repository/memory/IMemoryRepository";
import { MemoryRepositoryFactory } from "backend/repository/memory/MemoryRepositoryFactory";
import { MemoryRecord, MemoryCategory } from "backend/models/Memory";
import { CreateMemoryCommand } from "./commands/CreateMemoryCommand";
import { ChatMessage } from "backend/models/ChatMessage";
import { ConversationMessage } from "backend/client/openai/OpenAIService";
import { z } from "zod";

const CreatedMemoryResponseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  memory: z.string().min(1, "Memory content is required"),
});

type CreatedMemoryResponse = z.infer<typeof CreatedMemoryResponseSchema>;

export interface MemoryPreparation {
  systemPrompt: string;
  messages: ConversationMessage[];
  conversationId: string;
  category: MemoryCategory;
  messageCount: number;
}

/**
 * Service responsible for creating and storing memories from conversations.
 * No dependency on AssistantService - orchestration happens at Assistant level.
 * Commands are simple data structures with configuration baked in.
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
   * Prepares memory creation by checking if memory already exists.
   * Returns preparation data if memory should be created, null otherwise.
   *
   * @param command Command containing conversationId, messages, category, and systemPrompt
   * @returns MemoryPreparation if memory should be created, null if already exists
   */
  public async prepareMemoryCreation(command: CreateMemoryCommand): Promise<MemoryPreparation | null> {
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

    return {
      systemPrompt,
      messages: openAIMessages,
      conversationId,
      category: memoryCategory,
      messageCount: messages.length
    };
  }

  /**
   * Stores a memory from the JSON response returned by AssistantService.
   *
   * @param preparation The preparation data from prepareMemoryCreation
   * @param memoryJson JSON string from AssistantService.createMemory
   * @returns The persisted memory record
   */
  public async storeMemory(
    preparation: MemoryPreparation,
    memoryJson: string
  ): Promise<MemoryRecord> {
    // Parse and validate JSON response
    const responseJson = JSON.parse(memoryJson);
    const memoryResponse = CreatedMemoryResponseSchema.parse(responseJson);

    const title = memoryResponse.title;
    const content = memoryResponse.memory;
    const importance = 3;

    const createdBy = `MemoryCreator.storeMemory`;

    const createInput: MemoryCreateInput = {
      title,
      content,
      tags: [],
      importance,
      category: preparation.category,
      sources: [
        {
          type: "chat",
          reference: preparation.conversationId,
          title: "Conversation",
          excerpt: undefined,
          timestamp: new Date(),
        },
      ],
      metadata: {
        conversationId: preparation.conversationId,
        messageCount: preparation.messageCount,
        createdFrom: "conversation",
        createdBy,
      },
    };

    console.log("Creating memory for conversation:", preparation.conversationId);
    const record = await this.memoryRepository.createMemory(createInput);
    console.log("Created memory:", record.id);

    return record;
  }
}
