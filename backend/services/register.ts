import { ServiceContainer } from '@backend/di/ServiceContainer';
import { ConversationService } from '@backend/services/conversation/ConversationService';
import { AssistantService } from '@backend/services/assistant/AssistantService';
import { MemoryCreator } from '@backend/services/memory/MemoryCreator';
import { MemoryProvider } from '@backend/services/memory/MemoryProvider';
import { MemorySearchService } from '@backend/services/memory/MemorySearchService';
import { QueryService } from '@backend/services/query/QueryService';
import { MemoryQueryResolver } from '@backend/services/memory/MemoryQueryResolver';
import { IConversationRepository } from '@backend/repository/IConversationRepository';
import { VectorStore } from '@backend/client/vector/VectorStore';
import { OpenAIEmbeddingService } from '@backend/client/openai/OpenAIEmbeddingService';

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

  // OpenAI communication service
  ServiceContainer.register('AssistantService', () => new AssistantService());

  // Memory creation service
  ServiceContainer.register('MemoryCreator', () => new MemoryCreator());

  // Memory retrieval and formatting service
  ServiceContainer.register('MemoryProvider', () => new MemoryProvider());

  // Memory search service (with vector similarity)
  ServiceContainer.register('MemorySearchService', () => {
    const vectorStore = ServiceContainer.get<VectorStore>('VectorStore');
    const embeddingService = ServiceContainer.get<OpenAIEmbeddingService>('OpenAIEmbeddingService');
    return new MemorySearchService(vectorStore, embeddingService);
  });

  // Query extraction service
  ServiceContainer.register('QueryService', () => new QueryService());

  // Memory query resolution service
  ServiceContainer.register('MemoryQueryResolver', () => {
    const vectorStore = ServiceContainer.get<VectorStore>('VectorStore');
    const embeddingService = ServiceContainer.get<OpenAIEmbeddingService>('OpenAIEmbeddingService');
    return new MemoryQueryResolver(vectorStore, embeddingService);
  });
}
