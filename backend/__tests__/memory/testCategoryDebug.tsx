import { MemoryRepositoryFactory } from "@backend/repository/memory/MemoryRepositoryFactory";
import { MemoryCategory } from "@backend/models/Memory";

// Debug category-based search
const memoryRepoFactory = new MemoryRepositoryFactory();
const memoryRepository = memoryRepoFactory.build();

console.log("=== Category Debug Test ===");

// Get all memories to see their categories
const allMemories = await memoryRepository.getAllMemories();
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
const conversationMemories = await memoryRepository.findMemoriesByCategory(MemoryCategory.CONVERSATION);
console.log(`Found ${conversationMemories.length} conversation memories`);

console.log("\nTesting direct category search for 'user_profile':");
const userProfileMemories = await memoryRepository.findMemoriesByCategory(MemoryCategory.USER_PROFILE);
console.log(`Found ${userProfileMemories.length} user_profile memories`);

console.log("\nTesting direct category search for 'goal':");
const goalMemories = await memoryRepository.findMemoriesByCategory(MemoryCategory.GOAL);
console.log(`Found ${goalMemories.length} goal memories`);

console.log("\n=== Category Debug Test Complete ===");
