import { ChatMessage } from "@backend/models/ChatMessage";
import { MemoryQueryService } from "@backend/services/memory/MemoryQueryService";
import { MemoryAnswerQueryService } from "@backend/services/memory/MemoryAnswerQueryService";

// Test the integration between MemoryQueryService and MemoryAnswerQueryService
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

console.log("=== Memory Integration Test ===");

// Step 1: Generate queries using MemoryQueryService
const memoryQueryService = new MemoryQueryService();
const queries = await memoryQueryService.extractQueries(messages);
console.log("Generated queries:");
console.log(queries);

// Step 2: Find memories using MemoryAnswerQueryService
const memoryAnswerQueryService = new MemoryAnswerQueryService();
const memories = await memoryAnswerQueryService.findMemoriesForQueries(queries);
console.log("\nFound memories:");
console.log(memories.map(m => ({ id: m.id, title: m.title, category: m.category })));

// Step 3: Show detailed results for debugging
const detailedResults = await memoryAnswerQueryService.findMemoriesForQueriesDetailed(queries);
console.log("\nDetailed query results:");
detailedResults.forEach((result, index) => {
  console.log(`${index + 1}. Query: "${result.query}"`);
  console.log(`   Category: "${result.category}"`);
  console.log(`   Search: "${result.searchQuery}"`);
  console.log(`   Memory: ${result.memory ? `Found (${result.memory.title})` : 'Not found'}`);
  console.log("");
});

console.log("=== Integration Test Complete ===");
