import { ChatMessage } from "@backend/models/ChatMessage";
import { MemoryQueryService } from "@backend/services/memory/MemoryQueryService";
import { MemoryAnswerQueryService } from "@backend/services/memory/MemoryAnswerQueryService";
import { MemoryCreator } from "@backend/services/memory/MemoryCreator";
import { CreateConversationMemoryCommand } from "@backend/services/memory/commands/CreateConversationMemoryCommand";
import { CreateUserProfileMemoryCommand } from "@backend/services/memory/commands/CreateUserProfileMemoryCommand";
import { CreateAssistantPersonaMemoryCommand } from "@backend/services/memory/commands/CreateAssistantPersonaMemoryCommand";
import { AssistantService } from "@backend/services/assistant/AssistantService";

// Set environment variable for test file
process.env.MEMORY_TEST_FILE = "backend/data/test-memories.json";

// Test the full integration between MemoryQueryService and MemoryAnswerQueryService
const messages: ChatMessage[] = [
  {
    "id": "dcbf4496-2b28-4f6b-af89-37fe7726b919",
    "content": "Hello Lili, how are you",
    "role": "user",
    "timestamp": "2025-09-03T21:37:34.910Z"
  },
  {
    "id": "bbed7e84-0d4f-4eea-a401-d8b816c87c36",
    "content": "Bonjour, my dear Radek! How thoughtful of you to inquire—why, I am feeling positively radiant today, surrounded by all the comforts one expects of a Rochefort and, naturellement, basking in Salt's magnificent company. His fur is simply immaculate; one might say even the finest silks would weep with envy! Oh-hohohoho!\n\nBut truly, is there not something delightfully invigorating about this hour? The day stretches before us—a blank canvas of possibility and adventure! I trust you have not allowed yourself to be tethered by anything dreadfully tiresome, such as spreadsheets or—mon Dieu—commuter trains? Do share: what little spark has found its way into your day, cher ami?",
    "role": "assistant",
    "timestamp": "2025-09-03T21:37:38.904Z"
  },
  {
    "id": "fdfc9f4d-2b03-4dd1-8945-f17c926ac55d",
    "content": "I skipped the italian lessons today, we had 2 of them this week, just was busy. for lesson 1 we had greetings etc. lesson 2 cconversation at the coffe. that quite intense. what would you suggest for lesson 3? some vocabulary useful in real life scenario... i dont know where to start.",
    "role": "user",
    "timestamp": "2025-09-03T21:39:40.581Z"
  }
];

console.log("=== Full Memory Integration Test with Test File ===");
console.log("Using test file:", process.env.MEMORY_TEST_FILE);

// Create memories first - orchestrate manually since we're using hardcoded messages
const assistantService = new AssistantService();
const memoryCreator = new MemoryCreator();
console.log("Creating memories from conversation...");
try {
  const commands = [
    CreateConversationMemoryCommand("integration-test-1", messages),
    CreateUserProfileMemoryCommand("integration-test-1", messages),
    CreateAssistantPersonaMemoryCommand("integration-test-1", messages)
  ];

  for (const command of commands) {
    // Step 1: Prepare memory creation
    const preparation = await memoryCreator.prepareMemoryCreation(command);

    if (preparation) {
      // Step 2: Call AssistantService to create memory via LLM
      const memoryJson = await assistantService.createMemory(
        preparation.systemPrompt,
        preparation.messages
      );

      // Step 3: Store the memory
      await memoryCreator.storeMemory(preparation, memoryJson);
    }
  }
  console.log("Memories created successfully!");
} catch (error) {
  console.error("Error creating memories:", error);
}

// Step 1: Generate queries using MemoryQueryService
const memoryQueryService = new MemoryQueryService();
const queries = await memoryQueryService.extractQueries(messages);
console.log("\nGenerated queries:");
console.log(queries);

// Step 2: Find memories using MemoryAnswerQueryService (unified API)
const memoryAnswerQueryService = new MemoryAnswerQueryService();
const queryResults = await memoryAnswerQueryService.findMemoriesForQueries(queries);

// Step 3: Show detailed results for debugging
console.log("\nDetailed query results:");
queryResults.forEach((result, index) => {
  console.log(`${index + 1}. Query: "${result.query}"`);
  console.log(`   Category: "${result.category}"`);
  console.log(`   Search: "${result.searchQuery}"`);
  console.log(`   Memory: ${result.memory.title}`);
  console.log("");
});

// Step 4: Extract just the memories for convenience
const memories = queryResults.map(result => result.memory);
console.log("\nFound memories:");
memories.forEach((memory, index) => {
  console.log(`${index + 1}. ${memory.title} (Category: ${memory.category})`);
  console.log(`   Content: ${memory.content.substring(0, 100)}...`);
});

console.log("=== Full Integration Test Complete ===");
