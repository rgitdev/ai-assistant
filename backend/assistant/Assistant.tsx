import { ConversationMessage } from "backend/client/openai/OpenAIService";
import { ChatMessage } from "backend/models/ChatMessage";
import { v4 as uuidv4 } from 'uuid';
import { AssistantService } from "@backend/services/assistant/AssistantService";
import { AssistantPromptBuilder } from "@backend/assistant/AssistantPromptBuilder";
import { AssistantMemories } from "@backend/assistant/AssistantMemories";
import { MemorySearchService } from "@backend/services/memory/MemorySearchService";
import { ConversationService } from "@backend/services/conversation/ConversationService";
import { IImageRepository } from "@backend/repository/image/IImageRepository";
import { MemoryCategory, MemoryRecord } from "@backend/models/Memory";
import { assistantLogger } from "@backend/assistant/AssistantLogger";
import { AssistantTools } from "@backend/assistant/AssistantTools";

export class Assistant {

  assistantService: AssistantService;
  conversationService: ConversationService;
  assistantMemories: AssistantMemories;
  memorySearchService: MemorySearchService;
  imageRepository: IImageRepository;

  constructor(
    assistantService: AssistantService,
    conversationService: ConversationService,
    assistantMemories: AssistantMemories,
    memorySearchService: MemorySearchService,
    imageRepository: IImageRepository
  ) {
    this.assistantService = assistantService;
    this.conversationService = conversationService;
    this.assistantMemories = assistantMemories;
    this.memorySearchService = memorySearchService;
    this.imageRepository = imageRepository;
  }


  /**
   * Handle a new message by creating a new conversation
   * @param message - The user's message
   * @param images - Optional array of image files
   * @returns Object containing the assistant's response and the new conversationId
   */
  async handleNewMessage(message: string, images?: File[] | Blob[]): Promise<{ response: string; conversationId: string }> {
    const conversationId = await this.conversationService.createConversation();
    assistantLogger.logNewConversation(conversationId, message);
    return await this.handleMessage(conversationId, message, images);
  }

  /**
   * Handle a message in an existing conversation
   * @param conversationId - The ID of the existing conversation
   * @param message - The user's message
   * @param images - Optional array of image files
   * @returns Object containing the assistant's response and conversationId
   */
  async handleMessage(conversationId: string, message: string, images?: File[] | Blob[]): Promise<{ response: string; conversationId: string }> {
    assistantLogger.logMessage(conversationId, message);

    // Step 1: Create message ID and save images (if any)
    const messageId = uuidv4();
    const imageIds: string[] = [];

    if (images && images.length > 0) {
      for (const image of images) {
        const arrayBuffer = await image.arrayBuffer();
        const imageData = Buffer.from(arrayBuffer);
        const mimeType = image.type || 'image/jpeg';

        const metadata = await this.imageRepository.saveImage(
          conversationId,
          messageId,
          imageData,
          mimeType,
          (image as File).name
        );
        imageIds.push(metadata.id);
      }
    }

    // Step 2: Persist user message immediately (never lose user input)
    const userChatMessage: ChatMessage = {
      id: messageId,
      content: message,
      role: 'user',
      timestamp: new Date().toISOString(),
      imageIds: imageIds.length > 0 ? imageIds : undefined
    };
    await this.conversationService.addMessage(conversationId, userChatMessage);

    // Step 3: Generate assistant response (can fail - that's okay, user message is saved)
    const response = await this.generateResponse(conversationId, images);

    // Step 4: Persist assistant response (only reached if generation succeeded)
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
   * @param images - Optional array of image files to include with the last user message
   * @returns The assistant's response text
   */
  private async generateResponse(conversationId: string, images?: File[] | Blob[]): Promise<string> {
    // Get full conversation history
    const conversationMessages = await this.conversationService.getConversationMessages(conversationId);
    const messages: ConversationMessage[] = conversationMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // If images are provided, convert the last user message to multi-part content
    if (images && images.length > 0 && messages.length > 0 && messages[messages.length - 1].role === 'user') {
      const lastMessage = messages[messages.length - 1];
      const textContent = typeof lastMessage.content === 'string' ? lastMessage.content : '';

      // Convert images to base64
      const imageContents = await Promise.all(
        images.map(async (image) => {
          const arrayBuffer = await image.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString('base64');
          const mimeType = image.type || 'image/jpeg';
          return {
            type: "image_url" as const,
            image_url: { url: `data:${mimeType};base64,${base64}` }
          };
        })
      );

      // Create multi-part content with text and images
      messages[messages.length - 1] = {
        role: 'user',
        content: [
          { type: "text" as const, text: textContent },
          ...imageContents
        ]
      };
    }

    console.log("Sending conversation to assistant:", messages.length, "messages");

    // Build prompt using AssistantPromptBuilder with component system
    const promptBuilder = new AssistantPromptBuilder();

    // Add time context (includes both system instruction and message)
    promptBuilder.withTimeContext();

    // Add memory context (includes both system instruction and messages)
    // Extract text content from last message (handle both string and multi-part content)
    const lastMessageContent = messages[messages.length - 1].content;
    const lastMessageText = typeof lastMessageContent === 'string'
      ? lastMessageContent
      : lastMessageContent.find(part => part.type === 'text')?.text || '';
    const memoryMessages = await this.assistantMemories.getMemoryMessages(lastMessageText);
    promptBuilder.withMemoryMessages(memoryMessages);

    // Add tools context (includes system instruction about available tools)
    promptBuilder.withTools();

    // Add conversation messages
    promptBuilder.withConversationMessages(messages);

    // Build system prompt (static, cacheable content with instructions for all components)
    const systemPrompt = promptBuilder.buildSystemPrompt();

    // Build messages (dynamic content: labeled context messages + conversation)
    const enhancedMessages = promptBuilder.buildMessages();

    console.log("Built enhanced messages:", enhancedMessages.length, "messages");

    // Send conversation with tools enabled
    const response = await this.assistantService.sendConversationWithTools(
      systemPrompt,
      enhancedMessages,
      {
        enableTools: true,
        toolNames: AssistantTools.getToolNames(),
        maxToolIterations: 5
      }
    );
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