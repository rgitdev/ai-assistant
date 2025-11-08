import { MemoryCreator } from "@backend/services/memory/MemoryCreator";
import { MemoryAnswerQueryService } from "@backend/services/memory/MemoryAnswerQueryService";
import { ChatMessage } from "@backend/models/ChatMessage";
import { CreateConversationMemoryCommand } from "@backend/services/memory/commands/CreateConversationMemoryCommand";
import { CreateUserProfileMemoryCommand } from "@backend/services/memory/commands/CreateUserProfileMemoryCommand";
import { CreateAssistantPersonaMemoryCommand } from "@backend/services/memory/commands/CreateAssistantPersonaMemoryCommand";
import { AssistantService } from "@backend/services/assistant/AssistantService";

// Set environment variable for test file
process.env.MEMORY_TEST_FILE = "backend/data/test-memories.json";

// Test category-based search with fresh memories
const assistantService = new AssistantService();
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

// Create some memories first - use executor pattern
console.log("Creating memories...");
try {
  const commands = [
    CreateConversationMemoryCommand("test-conversation-env-1", sampleMessages),
    CreateUserProfileMemoryCommand("test-conversation-env-1", sampleMessages),
    CreateAssistantPersonaMemoryCommand("test-conversation-env-1", sampleMessages)
  ];

  for (const command of commands) {
    const memory = await memoryCreator.createMemory(
      command,
      (systemPrompt, messages) => assistantService.createMemory(systemPrompt, messages)
    );
    if (memory) {
      console.log("Created memory:", memory.title, "Category:", memory.category);
    }
  }
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
