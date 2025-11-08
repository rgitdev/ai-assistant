import { MemoryCreator } from "@backend/services/memory/MemoryCreator";
import { MemoryAnswerQueryService } from "@backend/services/memory/MemoryAnswerQueryService";
import { ChatMessage } from "@backend/models/ChatMessage";

// Set environment variable for test file
process.env.MEMORY_TEST_FILE = "backend/data/test-memories.json";

// Test category-based search with fresh memories
const memoryCreator = new MemoryCreator();
const memoryAnswerQueryService = new MemoryAnswerQueryService();

console.log("=== Category Search Test with Test File ===");
console.log("Using test file:", process.env.MEMORY_TEST_FILE);

// Sample conversation to create memories
const sampleMessages: ChatMessage[] = [
  {
    "id": "test-1",
    "content": "I love learning Italian! My goal is to be able to have conversations with locals when I visit Italy next year.",
    "role": "user",
    "timestamp": "2025-01-01T10:00:00.000Z"
  },
  {
    "id": "test-2", 
    "content": "That's wonderful! Italian is a beautiful language. What specific areas of conversation are you most interested in?",
    "role": "assistant",
    "timestamp": "2025-01-01T10:01:00.000Z"
  },
  {
    "id": "test-3",
    "content": "I want to be able to order food, ask for directions, and have basic conversations about my interests like art and music.",
    "role": "user", 
    "timestamp": "2025-01-01T10:02:00.000Z"
  }
];

// Create some memories first
console.log("Creating memories...");
try {
  const memory1 = await memoryCreator.createMemoryForConversation("test-conversation-env-1", sampleMessages);
  console.log("Created memory 1:", memory1.title, "Category:", memory1.category);

  const memory2 = await memoryCreator.createMemoryForCollectingUserInformation("test-conversation-env-1", sampleMessages);
  console.log("Created memory 2:", memory2.title, "Category:", memory2.category);

  const memory3 = await memoryCreator.createMemoryForCollectingAssistantPersona("test-conversation-env-1", sampleMessages);
  console.log("Created memory 3:", memory3.title, "Category:", memory3.category);
} catch (error) {
  console.error("Error creating memories:", error);
}

// Test category-based search
const testQueries = [
  "conversation: Italian learning goals and interests",
  "user_profile: user preferences for Italian conversation topics",
  "other: assistant communication style"
];

console.log("\nTesting category-based search with queries:");
console.log(testQueries);

const memories = await memoryAnswerQueryService.findMemoriesForQueries(testQueries);
console.log("\nFound memories:");
memories.forEach((memory, index) => {
  console.log(`${index + 1}. ${memory.title} (Category: ${memory.category})`);
  console.log(`   Content: ${memory.content.substring(0, 100)}...`);
});

console.log("\n=== Category Search Test Complete ===");
