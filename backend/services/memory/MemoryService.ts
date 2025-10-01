import { ChatMessage } from "backend/models/ChatMessage";
import { ConversationMessage, OpenAIService } from "backend/client/openai/OpenAIService";
import { OpenAIServiceFactory } from "backend/client/openai/OpenAIServiceFactory";
import { IMemoryRepository, MemoryCreateInput } from "backend/repository/memory/IMemoryRepository";
import { MemoryRepositoryFactory } from "backend/repository/memory/MemoryRepositoryFactory";
import { MemoryRecord, MemoryCategory } from "backend/models/Memory";
import { memorySystemPrompt } from "@backend/services/memory/prompts/memorySystemPrompt";
import { userProfileSystemPrompt } from "@backend/services/memory/prompts/userProfileSystemPrompt";
import { assistantPersonaSystemPrompt } from "@backend/services/memory/prompts/assistantPersonaSystemPrompt";
import { z } from "zod";

const CreatedMemoryResponseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  memory: z.string().min(1, "Memory content is required"),
});

type CreatedMemoryResponse = z.infer<typeof CreatedMemoryResponseSchema>;

type SystemPrompt = {
  name: string;
  prompt: string;
}

const createMemorySystemPrompt = {
  name: "createMemorySystemPrompt",
  prompt: memorySystemPrompt,
}

const createUserProfileSystemPrompt = {
  name: "userProfileSystemPrompt",
  prompt: userProfileSystemPrompt,
}

const createAssistantPersonaSystemPrompt = {
  name: "createAssistantPersonaSystemPrompt",
  prompt: assistantPersonaSystemPrompt,
}
/**
 * Service responsible for creating and storing memories from conversations.
 */
export class MemoryService {
  private readonly openAIService: OpenAIService;
  private readonly memoryRepository: IMemoryRepository;

  private readonly overwrite: boolean = false;
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
    return this.createMemoryForCategoryInternal(
      conversationId, 
      messages, 
      createMemorySystemPrompt,
      MemoryCategory.CONVERSATION);
  }

  /**
   * Creates a memory record for collecting user information from a conversation.
   * - Uses OpenAI to generate a structured JSON memory focused on user information
   * - Persists the memory using the configured memory repository
   *
   * @param conversationId Unique conversation identifier
   * @param messages Conversation messages in chronological order
   * @returns The persisted memory record
   */
  public async createMemoryForCollectingUserInformation(
    conversationId: string,
    messages: ChatMessage[]
  ): Promise<MemoryRecord> {
    return this.createMemoryForCategoryInternal(
      conversationId, 
      messages, 
      createUserProfileSystemPrompt,
      MemoryCategory.USER_PROFILE);
  }

  /**
   * Creates a memory record for collecting assistant persona information from a conversation.
   * - Uses OpenAI to generate a structured JSON memory focused on assistant characteristics and preferences
   * - Persists the memory using the configured memory repository
   * - Helps maintain consistency in assistant behavior across conversations
   *
   * @param conversationId Unique conversation identifier
   * @param messages Conversation messages in chronological order
   * @returns The persisted memory record
   */
  public async createMemoryForCollectingAssistantPersona(
    conversationId: string,
    messages: ChatMessage[]
  ): Promise<MemoryRecord> {
    return this.createMemoryForCategoryInternal(
      conversationId, 
      messages, 
      createAssistantPersonaSystemPrompt,
      MemoryCategory.ASSISTANT_PERSONA);
  }

    public async createMemoryForCategoryInternal(
      conversationId: string,
      messages: ChatMessage[],
      systemPrompt: SystemPrompt,
      category: MemoryCategory): Promise<MemoryRecord> {
  
    const createInput = await this.createMemoryInputFromConversation(
      conversationId,
      messages,
      systemPrompt,
      "conversation",
      category
    );
    
    const prevRecords = await this.memoryRepository.findMemoryBySource({
      type: "chat",
      reference: conversationId,
    });
    
    const previousMatchingMemory = prevRecords.find(r => r.metadata?.systemPrompt === systemPrompt.name );

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
   * Creates a MemoryCreateInput from conversation data using the specified system prompt.
   * This is a helper method to avoid code duplication.
   *
   * @param conversationId Unique conversation identifier
   * @param messages Conversation messages in chronological order
   * @param systemPrompt The system prompt to use for memory generation
   * @param memoryType The type of memory being created
   * @param category The memory category
   * @returns MemoryCreateInput ready for repository creation
   */
  private async createMemoryInputFromConversation(
    conversationId: string,
    messages: ChatMessage[],
    systemPrompt: SystemPrompt,
    memoryType: string,
    category: MemoryCategory
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

    // Ask OpenAI to produce a JSON memory object based on the conversation
    const responseRawJson = await this.openAIService.sendMessages(
      systemPrompt.prompt,
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
        createdFrom: memoryType,
        createdBy: "MemoryService",
        systemPrompt: systemPrompt.name,
      },
    };
  }

  public async getMemoriesAsAssistantMessage() : Promise<ConversationMessage | null> {

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

    return {
      role: "assistant",
      content: `Latest memories: 
      
      ${memory ? `\nLatest conversation memory: ${memory.title}\n\n${memory.content}` : ""}
      
      ${lastUserProfileMemory ? `\nUser profile: ${lastUserProfileMemory.title}\n\n${lastUserProfileMemory.content}` : ""}

      ${lastAssistantPersonaMemory ? `\nAssistant persona: ${lastAssistantPersonaMemory.title}\n\n${lastAssistantPersonaMemory.content}` : ""}
      `,
    };
  }


  
}

