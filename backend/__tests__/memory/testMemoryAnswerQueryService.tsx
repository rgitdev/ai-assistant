import { MemoryQueryResolver } from "@backend/services/memory/MemoryQueryResolver";
import { Query } from "@backend/services/query/QueryService";
import { VectorStore } from "@backend/client/vector/VectorStore";
import { OpenAIEmbeddingService } from "@backend/client/openai/OpenAIEmbeddingService";

// Test the MemoryQueryResolver (renamed from MemoryAnswerQueryService)
const vectorStore = new VectorStore();
const embeddingService = new OpenAIEmbeddingService();
const memoryQueryResolver = new MemoryQueryResolver(vectorStore, embeddingService);

// Sample queries using simplified Query interface (no category metadata)
const testQueries: Query[] = [
  { type: "memory", text: "Italian lesson progress and topics covered" },
  { type: "memory", text: "Italian learning goals and vocabulary preferences" },
  { type: "memory", text: "Italian lesson schedule and missed sessions" },
  { type: "memory", text: "Italian vocabulary for real-life scenarios" },
  { type: "memory", text: "Italian language learning objectives" }
];

console.log("Testing MemoryQueryResolver with queries:");
console.log(testQueries);

// Test the resolve method
const queryResults = await memoryQueryResolver.resolveQueries(testQueries);
console.log("\nQuery results:");
queryResults.forEach(result => {
  console.log(`Query: "${result.query.type}: ${result.query.text}"`);
  console.log(`Memory: ${result.memory.title}`);
  console.log("---");
});

// Extract just the memories for convenience
const memories = queryResults.map(result => result.memory);
console.log("\nFound memories:");
console.log(memories.map(m => ({ id: m.id, title: m.title, category: m.category })));
