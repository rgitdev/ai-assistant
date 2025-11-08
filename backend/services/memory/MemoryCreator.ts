import { ChatMessage } from "backend/models/ChatMessage";
import { OpenAIService } from "backend/client/openai/OpenAIService";
import { OpenAIServiceFactory } from "backend/client/openai/OpenAIServiceFactory";
import { IMemoryRepository } from "backend/repository/memory/IMemoryRepository";
import { MemoryRepositoryFactory } from "backend/repository/memory/MemoryRepositoryFactory";
import { MemoryRecord } from "backend/models/Memory";
import { CreateConversationMemoryCommand } from "./commands/CreateConversationMemoryCommand";
import { CreateUserProfileMemoryCommand } from "./commands/CreateUserProfileMemoryCommand";
import { CreateAssistantPersonaMemoryCommand } from "./commands/CreateAssistantPersonaMemoryCommand";
import { CreateMemoryCommand } from "./commands/CreateMemoryCommand";

/**
 * Service responsible for creating and storing memories from conversations.
 * Uses the Command Pattern to delegate memory creation to specific command implementations.
 */
export class MemoryCreator {
  private readonly conversationCommand: CreateMemoryCommand;
  private readonly userProfileCommand: CreateMemoryCommand;
  private readonly assistantPersonaCommand: CreateMemoryCommand;

  constructor() {
    const openAIFactory = new OpenAIServiceFactory();
    const openAIService: OpenAIService = openAIFactory.build();

    const memoryRepoFactory = new MemoryRepositoryFactory();
    const memoryRepository: IMemoryRepository = memoryRepoFactory.build();

    const overwrite = false;

    // Initialize command instances
    this.conversationCommand = new CreateConversationMemoryCommand(
      openAIService,
      memoryRepository,
      overwrite
    );
    this.userProfileCommand = new CreateUserProfileMemoryCommand(
      openAIService,
      memoryRepository,
      overwrite
    );
    this.assistantPersonaCommand = new CreateAssistantPersonaMemoryCommand(
      openAIService,
      memoryRepository,
      overwrite
    );
  }

  /**
   * Creates a memory record summarizing a conversation.
   * Delegates to the CreateConversationMemoryCommand.
   *
   * @param conversationId Unique conversation identifier
   * @param messages Conversation messages in chronological order
   * @returns The persisted memory record
   */
  public async createMemoryForConversation(
    conversationId: string,
    messages: ChatMessage[]
  ): Promise<MemoryRecord> {
    return this.conversationCommand.execute(conversationId, messages);
  }

  /**
   * Creates a memory record for collecting user information from a conversation.
   * Delegates to the CreateUserProfileMemoryCommand.
   *
   * @param conversationId Unique conversation identifier
   * @param messages Conversation messages in chronological order
   * @returns The persisted memory record
   */
  public async createMemoryForCollectingUserInformation(
    conversationId: string,
    messages: ChatMessage[]
  ): Promise<MemoryRecord> {
    return this.userProfileCommand.execute(conversationId, messages);
  }

  /**
   * Creates a memory record for collecting assistant persona information from a conversation.
   * Delegates to the CreateAssistantPersonaMemoryCommand.
   *
   * @param conversationId Unique conversation identifier
   * @param messages Conversation messages in chronological order
   * @returns The persisted memory record
   */
  public async createMemoryForCollectingAssistantPersona(
    conversationId: string,
    messages: ChatMessage[]
  ): Promise<MemoryRecord> {
    return this.assistantPersonaCommand.execute(conversationId, messages);
  }
}
