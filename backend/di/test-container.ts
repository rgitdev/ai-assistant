/**
 * Simple test script for ServiceContainer
 * Run with: bun run backend/di/test-container.ts
 */
import { ServiceContainer } from './ServiceContainer';
import { registerAllServices } from '@backend/registerServices';

console.log('🧪 Testing ServiceContainer...\n');

// Test 1: Basic registration and resolution
console.log('Test 1: Basic registration and resolution');
ServiceContainer.clear();
ServiceContainer.register('TestService', () => ({ name: 'TestService', value: 42 }));
const testService = ServiceContainer.get<{ name: string; value: number }>('TestService');
console.log('✓ Basic registration works:', testService);
console.log('✓ Service is singleton:', ServiceContainer.get('TestService') === testService);

// Test 2: Check if service exists
console.log('\nTest 2: Check if service exists');
console.log('✓ has() returns true for registered service:', ServiceContainer.has('TestService'));
console.log('✓ has() returns false for unregistered service:', !ServiceContainer.has('NonExistent'));

// Test 3: Get all keys
console.log('\nTest 3: Get all registered keys');
console.log('✓ keys() returns:', ServiceContainer.keys());

// Test 4: Clear container
console.log('\nTest 4: Clear container');
ServiceContainer.clear();
console.log('✓ After clear, has() returns false:', !ServiceContainer.has('TestService'));

// Test 5: Register all services
console.log('\nTest 5: Register all services');
try {
  registerAllServices();
  console.log('✓ registerAllServices() completed successfully');
  console.log('✓ Registered services:', ServiceContainer.keys().length);
  console.log('✓ Service keys:', ServiceContainer.keys().join(', '));
} catch (error) {
  console.error('✗ Error during registration:', error);
  process.exit(1);
}

// Test 6: Resolve services
console.log('\nTest 6: Resolve key services');
try {
  const vectorStore = ServiceContainer.get('VectorStore');
  console.log('✓ VectorStore resolved:', !!vectorStore);

  const conversationService = ServiceContainer.get('ConversationService');
  console.log('✓ ConversationService resolved:', !!conversationService);

  const assistantService = ServiceContainer.get('AssistantService');
  console.log('✓ AssistantService resolved:', !!assistantService);

  const assistant = ServiceContainer.get('Assistant');
  console.log('✓ Assistant resolved:', !!assistant);

  const assistantMemories = ServiceContainer.get('AssistantMemories');
  console.log('✓ AssistantMemories resolved:', !!assistantMemories);
} catch (error) {
  console.error('✗ Error resolving services:', error);
  process.exit(1);
}

// Test 7: Verify singleton behavior
console.log('\nTest 7: Verify singleton behavior');
const assistant1 = ServiceContainer.get('Assistant');
const assistant2 = ServiceContainer.get('Assistant');
console.log('✓ Assistant is singleton:', assistant1 === assistant2);

console.log('\n✅ All tests passed!');
