import { VectorStore } from "../../client/vector/VectorStore";
import { OpenAIEmbeddingService } from "../../client/openai/OpenAIEmbeddingService";

async function testVectorStore() {
  const vectorStore = new VectorStore();
  const embeddingService = new OpenAIEmbeddingService();
  const searchQueries = [
    "conversation: Italian lesson progress and topics covered",
  ];

  const embedding = await embeddingService.createEmbedding(searchQueries[0]);
  const results = await vectorStore.searchSimilar(embedding, { sourceType: "Conversation" });
  console.log(results);

  results.forEach(result => {
    console.log(result.record.sourceId + " " + result.score);
  });
}

// Run the test
if (require.main === module) {
  testVectorStore()
    .then(() => {
      console.log("\n🎉 All tests passed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Test failed:", error);
      process.exit(1);
    });
}

export { testVectorStore };
