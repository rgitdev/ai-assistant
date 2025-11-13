import { ServiceContainer } from '@backend/di/ServiceContainer';
import { VectorStore } from '@backend/client/vector/VectorStore';
import { OpenAIEmbeddingService } from '@backend/client/openai/OpenAIEmbeddingService';
import { DatabaseService } from '@backend/client/database/DatabaseService';
import { OpenAIService } from '@backend/client/openai/OpenAIService';
import { OpenAIServiceFactory } from '@backend/client/openai/OpenAIServiceFactory';

/**
 * Register all client services (external API clients, database, vector store, etc.)
 *
 * Client services are low-level infrastructure components that interact with
 * external systems like OpenAI API, vector stores, and databases.
 *
 * These have no dependencies on other backend services.
 */
export function registerClients() {
  // Vector storage for embeddings
  ServiceContainer.register('VectorStore', () => new VectorStore());

  // OpenAI chat service for AI communication
  ServiceContainer.register('OpenAIService', () => {
    const factory = new OpenAIServiceFactory();
    return factory.build();
  });

  // OpenAI embedding service for text-to-vector conversion
  ServiceContainer.register('OpenAIEmbeddingService', () => new OpenAIEmbeddingService());

  // Database service for persistent storage
  ServiceContainer.register('DatabaseService', () => new DatabaseService());
}
