import { ChatMessage } from "backend/models/ChatMessage";
import { ConversationMessage, OpenAIService } from "backend/client/openai/OpenAIService";
import { IMemoryRepository, MemoryCreateInput } from "backend/repository/memory/IMemoryRepository";
import { MemoryRecord, MemoryCategory } from "backend/models/Memory";
import { memorySystemPrompt } from "@backend/services/memory/prompts/memorySystemPrompt";
import { CreateMemoryCommand } from "./CreateMemoryCommand";
import { z } from "zod";

const CreatedMemoryResponseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  memory: z.string().min(1, "Memory content is required"),
});

type CreatedMemoryResponse = z.infer<typeof CreatedMemoryResponseSchema>;

/**
 * Command for creating conversation summary memories.
 * Encapsulates the logic for generating and storing conversation memories.
 */
export class CreateConversationMemoryCommand implements CreateMemoryCommand {
  constructor(
    private readonly openAIService: OpenAIService,
    private readonly memoryRepository: IMemoryRepository,
    private readonly overwrite: boolean = false
  ) {}

  async execute(conversationId: string, messages: ChatMessage[]): Promise<MemoryRecord> {
    const createInput = await this.createMemoryInput(conversationId, messages);

    const prevRecords = await this.memoryRepository.findMemoryBySource({
      type: "chat",
      reference: conversationId,
    });

    const previousMatchingMemory = prevRecords.find(r => r.category === MemoryCategory.CONVERSATION);

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

  private async createMemoryInput(
    conversationId: string,
    messages: ChatMessage[]
  ): Promise<MemoryCreateInput> {
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

    const responseRawJson = await this.openAIService.sendMessages(
      memorySystemPrompt,
      openAIMessages
    );

    const responseJson = JSON.parse(responseRawJson) as CreatedMemoryResponse;

    const title = responseJson.title;
    const content = responseJson.memory;
    const importance = 3;

    return {
      title,
      content,
      tags: [],
      importance,
      category: MemoryCategory.CONVERSATION,
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
        createdBy: "CreateConversationMemoryCommand",
      },
    };
  }
}
