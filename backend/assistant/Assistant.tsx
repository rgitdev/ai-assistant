import { ConversationMessage } from "backend/client/openai/OpenAIService";
import { ConversationRepositoryFactory } from "backend/repository/ConversationRepositoryFactory";
import { ChatMessage } from "backend/models/ChatMessage";
import { v4 as uuidv4 } from 'uuid';
import { AssistantService } from "@backend/services/assistant/AssistantService";
import { AssistantPromptBuilder } from "@backend/assistant/AssistantPromptBuilder";
import { MemoryCreator } from "@backend/services/memory/MemoryCreator";
import { MemoryProvider } from "@backend/services/memory/MemoryProvider";
import { MemorySearchService } from "@backend/services/memory/MemorySearchService";
import { VectorStore } from "@backend/client/vector/VectorStore";
import { OpenAIEmbeddingService } from "@backend/client/openai/OpenAIEmbeddingService";
import { ConversationService } from "@backend/services/conversation/ConversationService";
import { MemoryCategory, MemoryRecord, MEMORY_CATEGORY_DESCRIPTIONS } from "@backend/models/Memory";
import { CreateConversationMemoryCommand } from "@backend/services/memory/commands/CreateConversationMemoryCommand";
import { CreateUserProfileMemoryCommand } from "@backend/services/memory/commands/CreateUserProfileMemoryCommand";
import { CreateAssistantPersonaMemoryCommand } from "@backend/services/memory/commands/CreateAssistantPersonaMemoryCommand";
import { QueryService } from "@backend/services/query/QueryService";
import { MemoryQueryResolver } from "@backend/services/memory/MemoryQueryResolver";
import { assistantLogger } from "@backend/assistant/AssistantLogger";

export class Assistant {

  assistantService: AssistantService;
  conversationService: ConversationService;
  memoryCreator: MemoryCreator;
  memoryProvider: MemoryProvider;
  memorySearchService: MemorySearchService;
  queryService: QueryService;
  memoryQueryResolver: MemoryQueryResolver;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }

    const assistantService = new AssistantService();
    this.assistantService = assistantService;

    // Setup conversation service with repository
    const repositoryFactory = new ConversationRepositoryFactory();
    const conversationRepository = repositoryFactory.build();
    this.conversationService = new ConversationService(conversationRepository);

    // Orchestration: Assistant manages memory-related services
    this.memoryCreator = new MemoryCreator();
    this.memoryProvider = new MemoryProvider();

    const vectorStore = new VectorStore();
    const embeddingService = new OpenAIEmbeddingService();
    this.memorySearchService = new MemorySearchService(vectorStore, embeddingService);

    // Clean architecture: Query generation and memory resolution
    this.queryService = new QueryService();
    this.memoryQueryResolver = new MemoryQueryResolver(vectorStore, embeddingService);
  }


  /**
   * Handle a new message by creating a new conversation
   * @param message - The user's message
   * @returns Object containing the assistant's response and the new conversationId
   */
  async handleNewMessage(message: string): Promise<{ response: string; conversationId: string }> {
    const conversationId = await this.conversationService.createConversation();
    assistantLogger.logNewConversation(conversationId, message);
    return await this.handleMessage(conversationId, message);
  }

  /**
   * Handle a message in an existing conversation
   * @param conversationId - The ID of the existing conversation
   * @param message - The user's message
   * @returns Object containing the assistant's response and conversationId
   */
  async handleMessage(conversationId: string, message: string): Promise<{ response: string; conversationId: string }> {
    assistantLogger.logMessage(conversationId, message);

    // Add user message to conversation
    const userChatMessage: ChatMessage = {
      id: uuidv4(),
      content: message,
      role: 'user',
      timestamp: new Date().toISOString()
    };

    await this.conversationService.addMessage(conversationId, userChatMessage);

    // Generate and add assistant response
    const response = await this.generateAndAddResponse(conversationId);

    return { response, conversationId };
  }

  // Internal methods below

  /**
   * Generate assistant response for the current conversation and add it to the conversation
   * @param conversationId - The conversation ID
   * @returns The assistant's response text
   */
  private async generateAndAddResponse(conversationId: string): Promise<string> {
    // Get full conversation history and send to OpenAI
    const conversationMessages = await this.conversationService.getConversationMessages(conversationId);
    const openAIMessages: ConversationMessage[] = conversationMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const response = await this.sendConversation(openAIMessages);

    // Add assistant response to conversation
    const assistantChatMessage: ChatMessage = {
      id: uuidv4(),
      content: response,
      role: 'assistant',
      timestamp: new Date().toISOString()
    };

    await this.conversationService.addMessage(conversationId, assistantChatMessage);
    assistantLogger.logResponseGenerated(conversationId, response);

    return response;
  }

  private async sendConversation(messages: ConversationMessage[]): Promise<string> {
    console.log("Sending conversation to assistant:", messages.length, "messages");

    // Build prompt using AssistantPromptBuilder with component system
    const promptBuilder = new AssistantPromptBuilder();

    // Add time context (includes both system instruction and message)
    promptBuilder.withTimeContext();

    // Add memory context (includes both system instruction and messages)
    const memoryMessages = await this.getMemoryMessages(messages[messages.length - 1].content);
    promptBuilder.withMemoryMessages(memoryMessages);

    // Add conversation messages
    promptBuilder.withConversationMessages(messages);

    // Build system prompt (static, cacheable content with instructions for all components)
    const systemPrompt = promptBuilder.buildSystemPrompt();

    // Build messages (dynamic content: labeled context messages + conversation)
    const enhancedMessages = promptBuilder.buildMessages();

    console.log("Built enhanced messages:", enhancedMessages.length, "messages");

    const response = await this.assistantService.sendConversation(systemPrompt, enhancedMessages);
    return response;
  }

  /**
   * Orchestration method: Gather memory-related messages
   * Clean query routing workflow:
   * 1. Generate domain-agnostic queries from conversation
   * 2. Resolve queries to specific memories
   * 3. Assemble memory messages with builder pattern
   */
  private async getMemoryMessages(latestUserMessage: string): Promise<ConversationMessage[]> {
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
   * Edit the last user message in a conversation and regenerate the assistant's response
   * This will:
   * 1. Update the last user message and remove all following messages (via ConversationService)
   * 2. Generate a new assistant response
   *
   * @param conversationId - The conversation ID
   * @param messageId - The ID of the last user message to edit
   * @param newContent - The new content for the message
   * @returns Object containing the new assistant response and conversationId
   */
  async editLastUserMessageAndRegenerate(
    conversationId: string,
    messageId: string,
    newContent: string
  ): Promise<{ response: string; conversationId: string }> {
    assistantLogger.logMessageEdit(conversationId, messageId);

    // Step 1: Update last user message and remove following messages
    await this.conversationService.updateLastUserMessageAndRemoveFollowing(
      conversationId,
      messageId,
      newContent
    );

    // Step 2: Generate and add new assistant response
    const response = await this.generateAndAddResponse(conversationId);

    return { response, conversationId };
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

if (require.main === module) {
  const assistant = new Assistant();
  assistant.handleNewMessage("Hello, how are you? what's your name?").then(result => {
    console.log("Response:", result.response);
    console.log("Conversation ID:", result.conversationId);
  });
}