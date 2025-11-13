import { ServiceContainer } from '@backend/di/ServiceContainer';
import { ConversationRepositoryFactory } from '@backend/repository/ConversationRepositoryFactory';
import { MemoryRepositoryFactory } from '@backend/repository/memory/MemoryRepositoryFactory';
import { IConversationRepository } from '@backend/repository/IConversationRepository';
import { IMemoryRepository } from '@backend/repository/memory/IMemoryRepository';

/**
 * Register all repository services (data access layer)
 *
 * Repositories handle data persistence and retrieval.
 * They abstract the underlying storage mechanism (file, database, etc.)
 *
 * Dependencies: None (repositories are leaf nodes in the dependency graph)
 */
export function registerRepositories() {
  // Conversation repository - manages conversation persistence
  ServiceContainer.register<IConversationRepository>('ConversationRepository', () => {
    const factory = new ConversationRepositoryFactory();
    return factory.build();
  });

  // Memory repository - manages memory persistence
  ServiceContainer.register<IMemoryRepository>('MemoryRepository', () => {
    const factory = new MemoryRepositoryFactory();
    return factory.build();
  });
}
