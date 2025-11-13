import { ConversationMessage } from "backend/client/openai/OpenAIService";
import { ConversationRepositoryFactory } from "backend/repository/ConversationRepositoryFactory";
import { ChatMessage } from "backend/models/ChatMessage";
import { v4 as uuidv4 } from 'uuid';
import { AssistantService } from "@backend/services/assistant/AssistantService";
import { AssistantPromptBuilder } from "@backend/assistant/AssistantPromptBuilder";
import { AssistantMemories } from "@backend/assistant/AssistantMemories";
import { MemoryCreator } from "@backend/services/memory/MemoryCreator";
import { MemoryProvider } from "@backend/services/memory/MemoryProvider";
import { MemorySearchService } from "@backend/services/memory/MemorySearchService";
import { VectorStore } from "@backend/client/vector/VectorStore";
import { OpenAIEmbeddingService } from "@backend/client/openai/OpenAIEmbeddingService";
import { ConversationService } from "@backend/services/conversation/ConversationService";
import { MemoryCategory, MemoryRecord } from "@backend/models/Memory";
import { QueryService } from "@backend/services/query/QueryService";
import { MemoryQueryResolver } from "@backend/services/memory/MemoryQueryResolver";
import { assistantLogger } from "@backend/assistant/AssistantLogger";

export class Assistant {

  assistantService: AssistantService;
  conversationService: ConversationService;
  assistantMemories: AssistantMemories;
  memorySearchService: MemorySearchService;

  constructor(
    assistantService?: AssistantService,
    conversationService?: ConversationService,
    assistantMemories?: AssistantMemories,
    memorySearchService?: MemorySearchService
  ) {
    // Allow dependency injection for testing and DI container
    if (assistantService && conversationService && assistantMemories && memorySearchService) {
      this.assistantService = assistantService;
      this.conversationService = conversationService;
      this.assistantMemories = assistantMemories;
      this.memorySearchService = memorySearchService;
    } else {
      // Fallback to creating dependencies (for backward compatibility and testing)
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error("OPENAI_API_KEY environment variable is not set");
      }

      const assistantSvc = new AssistantService();
      this.assistantService = assistantSvc;

      // Setup conversation service with repository
      const repositoryFactory = new ConversationRepositoryFactory();
      const conversationRepository = repositoryFactory.build();
      this.conversationService = new ConversationService(conversationRepository);

      // Memory-related services
      const memoryCreator = new MemoryCreator();
      const memoryProvider = new MemoryProvider();

      const vectorStore = new VectorStore();
      const embeddingService = new OpenAIEmbeddingService();
      this.memorySearchService = new MemorySearchService(vectorStore, embeddingService);

      // Query generation and memory resolution
      const queryService = new QueryService();
      const memoryQueryResolver = new MemoryQueryResolver(vectorStore, embeddingService);

      // Orchestration: AssistantMemories manages memory operations
      this.assistantMemories = new AssistantMemories(
        this.conversationService,
        memoryCreator,
        memoryProvider,
        queryService,
        memoryQueryResolver,
        assistantSvc
      );
    }
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

    // Step 1: Persist user message immediately (never lose user input)
    const userChatMessage: ChatMessage = {
      id: uuidv4(),
      content: message,
      role: 'user',
      timestamp: new Date().toISOString()
    };
    await this.conversationService.addMessage(conversationId, userChatMessage);

    // Step 2: Generate assistant response (can fail - that's okay, user message is saved)
    const response = await this.generateResponse(conversationId);

    // Step 3: Persist assistant response (only reached if generation succeeded)
    const assistantChatMessage: ChatMessage = {
      id: uuidv4(),
      content: response,
      role: 'assistant',
      timestamp: new Date().toISOString()
    };
    await this.conversationService.addMessage(conversationId, assistantChatMessage);
    assistantLogger.logResponseGenerated(conversationId, response);

    return { response, conversationId };
  }

  // Internal methods below

  /**
   * Generate assistant response for the current conversation
   * Pure generation function - no side effects, no persistence
   * @param conversationId - The conversation ID
   * @returns The assistant's response text
   */
  private async generateResponse(conversationId: string): Promise<string> {
    // Get full conversation history
    const conversationMessages = await this.conversationService.getConversationMessages(conversationId);
    const messages: ConversationMessage[] = conversationMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    console.log("Sending conversation to assistant:", messages.length, "messages");

    // Build prompt using AssistantPromptBuilder with component system
    const promptBuilder = new AssistantPromptBuilder();

    // Add time context (includes both system instruction and message)
    promptBuilder.withTimeContext();

    // Add memory context (includes both system instruction and messages)
    const memoryMessages = await this.assistantMemories.getMemoryMessages(messages[messages.length - 1].content);
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
   * Create a memory for a conversation.
   * Delegates to AssistantMemories for memory creation.
   *
   * @param conversationId - The conversation ID to create memory from
   * @param category - The category of memory to create
   * @returns The created memory record, or null if already exists
   */
  async createMemoryForConversation(
    conversationId: string,
    category: MemoryCategory
  ): Promise<MemoryRecord | null> {
    return await this.assistantMemories.createMemoryForConversation(conversationId, category);
  }
}

if (require.main === module) {
  const assistant = new Assistant();
  assistant.handleNewMessage("Hello, how are you? what's your name?").then(result => {
    console.log("Response:", result.response);
    console.log("Conversation ID:", result.conversationId);
  });
}