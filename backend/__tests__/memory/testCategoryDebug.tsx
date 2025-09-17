import { MemoryService } from "@backend/services/memory/MemoryService";
import { MemoryAnswerQueryService } from "@backend/services/memory/MemoryAnswerQueryService";
import { MemoryRepositoryFactory } from "@backend/repository/memory/MemoryRepositoryFactory";
import { ChatMessage } from "@backend/models/ChatMessage";

// Debug category-based search
const memoryService = new MemoryService();
const memoryAnswerQueryService = new MemoryAnswerQueryService();
const memoryRepoFactory = new MemoryRepositoryFactory();
const memoryRepository = memoryRepoFactory.build();

console.log("=== Category Debug Test ===");

// Get all memories to see their categories
const allMemories = await memoryRepository.listMemories();
console.log("All memories in database:");
allMemories.forEach((memory, index) => {
  console.log(`${index + 1}. Title: ${memory.title}`);
  console.log(`   Category: ${memory.category || 'undefined'}`);
  console.log(`   Content: ${memory.content.substring(0, 100)}...`);
  console.log(`   Metadata: ${JSON.stringify(memory.metadata)}`);
  console.log("---");
});

// Test direct category search
console.log("\nTesting direct category search for 'conversation':");
const conversationMemories = await memoryRepository.searchMemoriesByCategory('conversation', 'Italian learning', { topK: 5 });
console.log(`Found ${conversationMemories.length} conversation memories`);

console.log("\nTesting direct category search for 'user_profile':");
const userProfileMemories = await memoryRepository.searchMemoriesByCategory('user_profile', 'Italian learning', { topK: 5 });
console.log(`Found ${userProfileMemories.length} user_profile memories`);

console.log("\nTesting direct category search for 'goal':");
const goalMemories = await memoryRepository.searchMemoriesByCategory('goal', 'Italian learning', { topK: 5 });
console.log(`Found ${goalMemories.length} goal memories`);

console.log("\n=== Category Debug Test Complete ===");
