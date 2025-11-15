import { ServiceContainer } from '@backend/di/ServiceContainer';
import { ConversationService } from '@backend/services/conversation/ConversationService';
import { AssistantService } from '@backend/services/assistant/AssistantService';
import { ImageService } from '@backend/services/image/ImageService';
import { MemoryCreator } from '@backend/services/memory/MemoryCreator';
import { MemoryProvider } from '@backend/services/memory/MemoryProvider';
import { MemorySearchService } from '@backend/services/memory/MemorySearchService';
import { QueryService } from '@backend/services/query/QueryService';
import { MemoryQueryResolver } from '@backend/services/memory/MemoryQueryResolver';
import { IConversationRepository } from '@backend/repository/IConversationRepository';
import { IMemoryRepository } from '@backend/repository/memory/IMemoryRepository';
import { IImageRepository } from '@backend/repository/image/IImageRepository';
import { VectorStore } from '@backend/client/vector/VectorStore';
import { OpenAIEmbeddingService } from '@backend/client/openai/OpenAIEmbeddingService';
import { OpenAIService } from '@backend/client/openai/OpenAIService';
import { ToolRegistry } from '@backend/services/assistant/ToolRegistry';
import { WeatherForecastTool } from '@backend/services/assistant/tools/weather/WeatherForecastTool';
import { GetConversationTool } from '@backend/services/assistant/tools/GetConversationTool';
import { GetImagesForAnalysisTool } from '@backend/services/assistant/tools/image/GetImagesForAnalysisTool';
import { AnalyzeMessageWithImagesTool } from '@backend/services/assistant/tools/image/AnalyzeMessageWithImagesTool';

/**
 * Register all business service layer components.
 *
 * Services implement core business logic and orchestrate operations.
 *
 * Dependencies:
 * - Repositories (for data persistence)
 * - Client services (for external APIs, vector store, etc.)
 */
export function registerServices() {
  // Conversation management service
  ServiceContainer.register('ConversationService', () => {
    const conversationRepository = ServiceContainer.get<IConversationRepository>('ConversationRepository');
    return new ConversationService(conversationRepository);
  });

  // Image management service
  ServiceContainer.register('ImageService', () => {
    const imageRepository = ServiceContainer.get<IImageRepository>('ImageRepository');
    return new ImageService(imageRepository);
  });

  // OpenAI communication service with tool support
  ServiceContainer.register('AssistantService', () => {
    const openAIService = ServiceContainer.get<OpenAIService>('OpenAIService');
    const toolRegistry = ServiceContainer.get<ToolRegistry>('ToolRegistry');
    return new AssistantService(openAIService, toolRegistry);
  });

  // Memory creation service
  ServiceContainer.register('MemoryCreator', () => {
    const memoryRepository = ServiceContainer.get<IMemoryRepository>('MemoryRepository');
    return new MemoryCreator(memoryRepository);
  });

  // Memory retrieval and formatting service
  ServiceContainer.register('MemoryProvider', () => {
    const memoryRepository = ServiceContainer.get<IMemoryRepository>('MemoryRepository');
    return new MemoryProvider(memoryRepository);
  });

  // Memory search service (with vector similarity)
  ServiceContainer.register('MemorySearchService', () => {
    const vectorStore = ServiceContainer.get<VectorStore>('VectorStore');
    const embeddingService = ServiceContainer.get<OpenAIEmbeddingService>('OpenAIEmbeddingService');
    return new MemorySearchService(vectorStore, embeddingService);
  });

  // Query extraction service
  ServiceContainer.register('QueryService', () => {
    const openAIService = ServiceContainer.get<OpenAIService>('OpenAIService');
    return new QueryService(openAIService);
  });

  // Memory query resolution service
  ServiceContainer.register('MemoryQueryResolver', () => {
    const vectorStore = ServiceContainer.get<VectorStore>('VectorStore');
    const embeddingService = ServiceContainer.get<OpenAIEmbeddingService>('OpenAIEmbeddingService');
    return new MemoryQueryResolver(vectorStore, embeddingService);
  });

  // Tool Registry with registered tools
  ServiceContainer.register('ToolRegistry', () => {
    const toolRegistry = new ToolRegistry();

    // Get services needed for tools
    const conversationService = ServiceContainer.get<ConversationService>('ConversationService');
    const imageService = ServiceContainer.get<ImageService>('ImageService');

    // Register WeatherForecastTool
    const weatherForecastTool = new WeatherForecastTool();
    toolRegistry.registerTool(weatherForecastTool);

    // Register GetConversationTool
    const getConversationTool = new GetConversationTool(conversationService);
    toolRegistry.registerTool(getConversationTool);

    // Register image analysis tools
    const getImagesForAnalysisTool = new GetImagesForAnalysisTool(imageService);
    toolRegistry.registerTool(getImagesForAnalysisTool);

    const analyzeMessageWithImagesTool = new AnalyzeMessageWithImagesTool(imageService, conversationService);
    toolRegistry.registerTool(analyzeMessageWithImagesTool);

    return toolRegistry;
  });
}
