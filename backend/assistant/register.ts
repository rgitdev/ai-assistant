import { ServiceContainer } from '@backend/di/ServiceContainer';
import { Assistant } from '@backend/assistant/Assistant';
import { AssistantMemories } from '@backend/assistant/AssistantMemories';
import { ConversationService } from '@backend/services/conversation/ConversationService';
import { MemoryCreator } from '@backend/services/memory/MemoryCreator';
import { MemoryProvider } from '@backend/services/memory/MemoryProvider';
import { QueryService } from '@backend/services/query/QueryService';
import { MemoryQueryResolver } from '@backend/services/memory/MemoryQueryResolver';
import { AssistantService } from '@backend/services/assistant/AssistantService';
import { MemorySearchService } from '@backend/services/memory/MemorySearchService';

/**
 * Register assistant-related components.
 *
 * These are high-level orchestrators that coordinate multiple services
 * to provide complete assistant functionality.
 *
 * Dependencies:
 * - All service layer components
 * - Repository layer (indirectly through services)
 */
export function registerAssistant() {
  // AssistantMemories - Memory orchestration
  ServiceContainer.register('AssistantMemories', () => {
    const conversationService = ServiceContainer.get<ConversationService>('ConversationService');
    const memoryCreator = ServiceContainer.get<MemoryCreator>('MemoryCreator');
    const memoryProvider = ServiceContainer.get<MemoryProvider>('MemoryProvider');
    const queryService = ServiceContainer.get<QueryService>('QueryService');
    const memoryQueryResolver = ServiceContainer.get<MemoryQueryResolver>('MemoryQueryResolver');
    const assistantService = ServiceContainer.get<AssistantService>('AssistantService');

    return new AssistantMemories(
      conversationService,
      memoryCreator,
      memoryProvider,
      queryService,
      memoryQueryResolver,
      assistantService
    );
  });

  // Assistant - Main assistant orchestrator
  ServiceContainer.register('Assistant', () => {
    return new Assistant();
  });
}
