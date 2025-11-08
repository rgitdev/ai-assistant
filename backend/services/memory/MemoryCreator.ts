import { ChatMessage } from "backend/models/ChatMessage";
import { ConversationMessage, OpenAIService } from "backend/client/openai/OpenAIService";
import { OpenAIServiceFactory } from "backend/client/openai/OpenAIServiceFactory";
import { IMemoryRepository, MemoryCreateInput } from "backend/repository/memory/IMemoryRepository";
import { MemoryRepositoryFactory } from "backend/repository/memory/MemoryRepositoryFactory";
import { MemoryRecord, MemoryCategory } from "backend/models/Memory";
import { SystemPromptConfig } from "@backend/services/memory/fragments/MemoryFragment";
import { LastConversationFragment } from "@backend/services/memory/fragments/LastConversationFragment";
import { LastUserProfileFragment } from "@backend/services/memory/fragments/LastUserProfileFragment";
import { LastAssistantPersonaFragment } from "@backend/services/memory/fragments/LastAssistantPersonaFragment";
import { z } from "zod";

const CreatedMemoryResponseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  memory: z.string().min(1, "Memory content is required"),
});

type CreatedMemoryResponse = z.infer<typeof CreatedMemoryResponseSchema>;

/**
 * Service responsible for creating and storing memories from conversations.
 * Handles memory creation with OpenAI and persists to repository.
 */
export class MemoryCreator {
  private readonly openAIService: OpenAIService;
  private readonly memoryRepository: IMemoryRepository;

  // Fragment instances used to get system prompt configurations
  private readonly conversationFragment: LastConversationFragment;
  private readonly userProfileFragment: LastUserProfileFragment;
  private readonly assistantPersonaFragment: LastAssistantPersonaFragment;

  private readonly overwrite: boolean = false;

  constructor() {
    const openAIFactory = new OpenAIServiceFactory();
    this.openAIService = openAIFactory.build();

    const memoryRepoFactory = new MemoryRepositoryFactory();
    this.memoryRepository = memoryRepoFactory.build();

    // Initialize fragments to access their system prompt configurations
    this.conversationFragment = new LastConversationFragment(this.memoryRepository);
    this.userProfileFragment = new LastUserProfileFragment(this.memoryRepository);
    this.assistantPersonaFragment = new LastAssistantPersonaFragment(this.memoryRepository);
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
      this.conversationFragment.getCreationSystemPrompt(),
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
      this.userProfileFragment.getCreationSystemPrompt(),
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
      this.assistantPersonaFragment.getCreationSystemPrompt(),
      MemoryCategory.ASSISTANT_PERSONA);
  }

  private async createMemoryForCategoryInternal(
    conversationId: string,
    messages: ChatMessage[],
    systemPrompt: SystemPromptConfig,
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
    systemPrompt: SystemPromptConfig,
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
        createdBy: "MemoryCreator",
        systemPrompt: systemPrompt.name,
      },
    };
  }
}
