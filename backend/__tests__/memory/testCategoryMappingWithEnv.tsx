import { MemoryService } from "@backend/services/memory/MemoryService";

// Set environment variable for test file
process.env.MEMORY_TEST_FILE = "backend/data/test-memories.json";

// Test category mapping directly
const memoryService = new MemoryService();

console.log("=== Category Mapping Test with Test File ===");
console.log("Using test file:", process.env.MEMORY_TEST_FILE);

// Test the mapping function directly (we'll need to make it public or test through reflection)
// For now, let's create memories and check their categories

const testMessages = [
  {
    "id": "test-1",
    "content": "Test message for user profile",
    "role": "user",
    "timestamp": "2025-01-01T10:00:00.000Z"
  }
];

console.log("Creating user profile memory...");
const userProfileMemory = await memoryService.createMemoryForCollectingUserInformation("test-mapping-env-1", testMessages);
console.log("User profile memory category:", userProfileMemory.category);

console.log("Creating assistant persona memory...");
const assistantPersonaMemory = await memoryService.createMemoryForCollectingAssistantPersona("test-mapping-env-1", testMessages);
console.log("Assistant persona memory category:", assistantPersonaMemory.category);

console.log("Creating conversation memory...");
const conversationMemory = await memoryService.createMemoryForConversation("test-mapping-env-1", testMessages);
console.log("Conversation memory category:", conversationMemory.category);

console.log("=== Category Mapping Test Complete ===");
