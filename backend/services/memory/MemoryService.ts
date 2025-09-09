import { ChatMessage } from "backend/models/ChatMessage";
import { ConversationMessage, OpenAIService } from "backend/client/openai/OpenAIService";
import { OpenAIServiceFactory } from "backend/client/openai/OpenAIServiceFactory";
import { IMemoryRepository, MemoryCreateInput } from "backend/repository/memory/IMemoryRepository";
import { MemoryRepositoryFactory } from "backend/repository/memory/MemoryRepositoryFactory";
import { MemoryRecord } from "backend/models/Memory";
import { memorySystemPrompt } from "@backend/services/memory/prompts/memorySystemPrompt";
import { z } from "zod";

const CreatedMemoryResponseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  memory: z.string().min(1, "Memory content is required"),
});

type CreatedMemoryResponse = z.infer<typeof CreatedMemoryResponseSchema>;

/**
 * Service responsible for creating and storing memories from conversations.
 */
export class MemoryService {
  private readonly openAIService: OpenAIService;
  private readonly memoryRepository: IMemoryRepository;

  constructor() {
    const openAIFactory = new OpenAIServiceFactory();
    this.openAIService = openAIFactory.build();

    const memoryRepoFactory = new MemoryRepositoryFactory();
    this.memoryRepository = memoryRepoFactory.build();
  }

  /**
   * Creates a memory record summarizing a conversation.
   * - Uses OpenAI to generate a structured JSON memory (title, content, tags, importance)
   * - Persists the memory using the configured memory repository
   *
   * @param conversationId Unique conversation identifier
   * @param messages Conversation messages in chronological order
   * @returns The persisted memory record
   */
  public async createMemoryForConversation(
    conversationId: string,
    messages: ChatMessage[]
  ): Promise<MemoryRecord> {
    if (!conversationId || conversationId.trim().length === 0) {
      throw new Error("conversationId is required");
    }
    if (!messages || messages.length === 0) {
      throw new Error("messages are required to create a memory");
    }

    const openAIMessages: ConversationMessage[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Ask OpenAI to produce a JSON memory object based on the conversation
    const responseRawJson = await this.openAIService.sendMessages(
      memorySystemPrompt,
      openAIMessages
    );

    const responseJson = JSON.parse(responseRawJson) as CreatedMemoryResponse;

    const title = responseJson.title;
    const content = responseJson.memory
    const importance = 3;

    const createInput: MemoryCreateInput = {
      title,
      content,
      tags: [],
      importance,
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
        createdBy: "MemoryService",
      },
    };

    const prevRecord = await this.memoryRepository.findMemoryBySource({
      type: "chat",
      reference: conversationId,
    });
    
    console.log("Checking previous memory for conversation: ", conversationId, prevRecord?.id);
    const record = await this.memoryRepository.createMemory(createInput);
    if (prevRecord) {
      console.log("Deleting previous memory", prevRecord.id);
     // await this.memoryRepository.deleteMemory(prevRecord.id);
    }
    return record;
  }

  public async getLastMemoryAsMessage() : Promise<ConversationMessage | null> {

    const memory = await this.memoryRepository.getMemory("b310e9ba-0b1e-4436-bed5-8314f4f5f0dd");
    if (!memory) {
      return null;
    }
    return {
      role: "assistant",
      content: `Latest memory: ${memory.title}\n\n${memory.content}`,
    };
  }
}

