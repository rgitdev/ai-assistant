import { ConversationMessage } from "backend/client/openai/OpenAIService";
import { ChatMessage } from "backend/models/ChatMessage";
import { MemoryCategory, MemoryRecord } from "@backend/models/Memory";
import { v4 as uuidv4 } from 'uuid';
import { AssistantService } from "@backend/services/assistant/AssistantService";
import { MemoryCreator } from "@backend/services/memory/MemoryCreator";
import { MemoryProvider } from "@backend/services/memory/MemoryProvider";
import { ConversationService } from "@backend/services/conversation/ConversationService";
import { CreateConversationMemoryCommand } from "@backend/services/memory/commands/CreateConversationMemoryCommand";
import { CreateUserProfileMemoryCommand } from "@backend/services/memory/commands/CreateUserProfileMemoryCommand";
import { CreateAssistantPersonaMemoryCommand } from "@backend/services/memory/commands/CreateAssistantPersonaMemoryCommand";
import { QueryService } from "@backend/services/query/QueryService";
import { MemoryQueryResolver } from "@backend/services/memory/MemoryQueryResolver";
import { assistantLogger } from "@backend/assistant/AssistantLogger";

/**
 * AssistantMemories - Dedicated class for memory-related operations
 * Separates memory orchestration concerns from main Assistant class
 *
 * Responsibilities:
 * - Retrieve and format memory messages for conversation context
 * - Create new memories from conversations
 */
export class AssistantMemories {
  private conversationService: ConversationService;
  private memoryCreator: MemoryCreator;
  private memoryProvider: MemoryProvider;
  private queryService: QueryService;
  private memoryQueryResolver: MemoryQueryResolver;
  private assistantService: AssistantService;

  constructor(
    conversationService: ConversationService,
    memoryCreator: MemoryCreator,
    memoryProvider: MemoryProvider,
    queryService: QueryService,
    memoryQueryResolver: MemoryQueryResolver,
    assistantService: AssistantService
  ) {
    this.conversationService = conversationService;
    this.memoryCreator = memoryCreator;
    this.memoryProvider = memoryProvider;
    this.queryService = queryService;
    this.memoryQueryResolver = memoryQueryResolver;
    this.assistantService = assistantService;
  }

  /**
   * Orchestration method: Gather memory-related messages
   * Clean query routing workflow:
   * 1. Generate domain-agnostic queries from conversation
   * 2. Resolve queries to specific memories
   * 3. Assemble memory messages with builder pattern
   */
  async getMemoryMessages(latestUserMessage: string): Promise<ConversationMessage[]> {
    const memoryMessages: ConversationMessage[] = [];

    // Step 1: Generate queries from recent conversation context
    // Convert last message to ChatMessage format for QueryService
    const recentMessages: ChatMessage[] = [{
      id: uuidv4(),
      content: latestUserMessage,
      role: 'user',
      timestamp: new Date().toISOString()
    }];

    // Generate all query types (memory, websearch, calendar, etc.)
    const queries = await this.queryService.extractQueries(recentMessages);
    assistantLogger.logQueryExtraction(queries);

    // Step 2: Resolve memory queries (MemoryQueryResolver filters to type="memory")
    const queryResults = await this.memoryQueryResolver.resolveQueries(queries);
    assistantLogger.logQueryResolution(queryResults);

    // Step 3: Build memory context with resolved memories + latest memories
    const builder = this.memoryProvider.builder()
      .withLatestConversation()
      .withUserProfile()
      .withAssistantPersona();

    // Add memories from query resolution
    queryResults.forEach(result => {
      builder.withMemory(result.memory);
    });

    const formattedMemories = await builder.build();

    if (formattedMemories && formattedMemories.trim().length > 0) {
      memoryMessages.push({
        role: "assistant",
        content: formattedMemories
      });
    }

    return memoryMessages;
  }

  /**
   * Create a memory for a conversation.
   * Passes executor function to MemoryCreator for LLM interaction.
   *
   * @param conversationId - The conversation ID to create memory from
   * @param category - The category of memory to create
   * @returns The created memory record, or null if already exists
   */
  async createMemoryForConversation(
    conversationId: string,
    category: MemoryCategory
  ): Promise<MemoryRecord | null> {
    // Get conversation messages
    const messages = await this.conversationService.getConversationMessages(conversationId);

    if (!messages || messages.length === 0) {
      throw new Error(`No messages found for conversation ${conversationId}`);
    }

    // Create appropriate command based on category
    let command;
    switch (category) {
      case MemoryCategory.CONVERSATION:
        command = CreateConversationMemoryCommand(conversationId, messages);
        break;
      case MemoryCategory.USER_PROFILE:
        command = CreateUserProfileMemoryCommand(conversationId, messages);
        break;
      case MemoryCategory.ASSISTANT_PERSONA:
        command = CreateAssistantPersonaMemoryCommand(conversationId, messages);
        break;
      default:
        throw new Error(`Unsupported memory category: ${category}`);
    }

    // Create memory with executor function (dependency injection)
    const memory = await this.memoryCreator.createMemory(
      command,
      (systemPrompt, messages) => this.assistantService.createMemory(systemPrompt, messages)
    );

    if (memory) {
      assistantLogger.logMemoryCreated(category, memory.id, conversationId);
      console.log(`Created ${category} memory for conversation ${conversationId}: ${memory.id}`);
    } else {
      assistantLogger.logMemoryAlreadyExists(category, conversationId);
    }

    return memory;
  }
}
