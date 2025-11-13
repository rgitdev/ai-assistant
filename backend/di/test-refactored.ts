/**
 * Quick test for DI container with refactored constructors
 */
import { ServiceContainer } from './ServiceContainer';
import { registerAllServices } from '@backend/registerServices';

console.log('🧪 Testing DI Container with refactored constructors...\n');

try {
  // Clear and register all services
  ServiceContainer.clear();
  registerAllServices();
  console.log('✓ All services registered successfully');
  console.log(`✓ Total services: ${ServiceContainer.keys().length}`);

  // Test resolving key services
  console.log('\nResolving services:');

  // Client layer
  const vectorStore = ServiceContainer.get('VectorStore');
  console.log('✓ VectorStore');

  const openAIService = ServiceContainer.get('OpenAIService');
  console.log('✓ OpenAIService');

  const embeddingService = ServiceContainer.get('OpenAIEmbeddingService');
  console.log('✓ OpenAIEmbeddingService');

  // Repository layer
  const conversationRepo = ServiceContainer.get('ConversationRepository');
  console.log('✓ ConversationRepository');

  const memoryRepo = ServiceContainer.get('MemoryRepository');
  console.log('✓ MemoryRepository');

  // Service layer
  const conversationService = ServiceContainer.get('ConversationService');
  console.log('✓ ConversationService');

  const assistantService = ServiceContainer.get('AssistantService');
  console.log('✓ AssistantService');

  const memoryCreator = ServiceContainer.get('MemoryCreator');
  console.log('✓ MemoryCreator');

  const memoryProvider = ServiceContainer.get('MemoryProvider');
  console.log('✓ MemoryProvider');

  const queryService = ServiceContainer.get('QueryService');
  console.log('✓ QueryService');

  const memorySearchService = ServiceContainer.get('MemorySearchService');
  console.log('✓ MemorySearchService');

  const memoryQueryResolver = ServiceContainer.get('MemoryQueryResolver');
  console.log('✓ MemoryQueryResolver');

  // Assistant layer
  const assistantMemories = ServiceContainer.get('AssistantMemories');
  console.log('✓ AssistantMemories');

  const assistant = ServiceContainer.get('Assistant');
  console.log('✓ Assistant');

  // Verify singleton behavior
  const assistant2 = ServiceContainer.get('Assistant');
  if (assistant === assistant2) {
    console.log('\n✓ Singleton pattern works correctly');
  } else {
    throw new Error('Singleton pattern failed!');
  }

  console.log('\n✅ All tests passed!');
  console.log('✅ DI container working correctly with refactored constructors');

} catch (error) {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
}
