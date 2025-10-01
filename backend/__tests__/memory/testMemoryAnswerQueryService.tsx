import { MemoryAnswerQueryService } from "@backend/services/memory/MemoryAnswerQueryService";

// Test the MemoryAnswerQueryService
const memoryAnswerQueryService = new MemoryAnswerQueryService();

// Sample queries in the format "category: query"
const testQueries = [
  "conversation: Italian lesson progress and topics covered",
  "preference: Italian learning goals and vocabulary preferences", 
  "task: Italian lesson schedule and missed sessions",
  "knowledge: Italian vocabulary for real-life scenarios",
  "goal: Italian language learning objectives"
];

console.log("Testing MemoryAnswerQueryService with queries:");
console.log(testQueries);

// Test the unified method
const queryResults = await memoryAnswerQueryService.findMemoriesForQueries(testQueries);
console.log("\nQuery results:");
queryResults.forEach(result => {
  console.log(`Query: "${result.query}"`);
  console.log(`Category: "${result.category}"`);
  console.log(`Search Query: "${result.searchQuery}"`);
  console.log(`Memory: ${result.memory.title}`);
  console.log("---");
});

// Extract just the memories for convenience
const memories = queryResults.map(result => result.memory);
console.log("\nFound memories:");
console.log(memories.map(m => ({ id: m.id, title: m.title, category: m.category })));
