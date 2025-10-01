import { VectorStore } from "../../client/vector/VectorStore";
import { OpenAIEmbeddingService } from "../../client/openai/OpenAIEmbeddingService";
import { VectorSearchResult } from "../../models/VectorRecord";
import * as path from "path";

// Test data - 5 sample texts about different topics
const sampleTexts = [
  {
    text: "Artificial intelligence is revolutionizing healthcare by enabling early disease detection and personalized treatment plans.",
    sourceId: "healthcare-ai",
    sourceType: "article",
    metadata: { topic: "healthcare", category: "technology" }
  },
  {
    text: "Machine learning algorithms can analyze vast amounts of medical data to identify patterns that human doctors might miss.",
    sourceId: "ml-medical",
    sourceType: "research",
    metadata: { topic: "machine learning", category: "medical" }
  },
  {
    text: "Climate change is causing unprecedented weather patterns and rising sea levels across the globe.",
    sourceId: "climate-change",
    sourceType: "report",
    metadata: { topic: "environment", category: "science" }
  },
  {
    text: "Renewable energy sources like solar and wind power are becoming more cost-effective than fossil fuels.",
    sourceId: "renewable-energy",
    sourceType: "study",
    metadata: { topic: "energy", category: "sustainability" }
  },
  {
    text: "Quantum computing promises to solve complex problems that are impossible for classical computers to handle efficiently.",
    sourceId: "quantum-computing",
    sourceType: "article",
    metadata: { topic: "computing", category: "technology" }
  }
];

async function testVectorStore() {
  console.log("🧪 Starting VectorStore Test with OpenAI Embeddings\n");

  try {
    // Initialize services
    const embeddingService = new OpenAIEmbeddingService();
    const testVectorPath = path.join(process.cwd(), "backend/data/test-vectors.json");
    const vectorStore = new VectorStore(testVectorPath);

    console.log("📊 Vector Store Configuration:");
    console.log(`- Test file path: ${testVectorPath}`);
    console.log(`- Embedding model: ${OpenAIEmbeddingService.EMBEDDING_MODEL}`);
    console.log(`- Vector dimensions: ${embeddingService.getVectorSize()}\n`);

    // Step 1: Create embeddings for all sample texts
    console.log("🔄 Creating embeddings for sample texts...");
    const embeddingPromises = sampleTexts.map(async (sample, index) => {
      console.log(`  ${index + 1}. Processing: "${sample.text.substring(0, 50)}..."`);
      const embedding = await embeddingService.createEmbedding(sample.text);
      return {
        ...sample,
        embedding,
        embeddingModel: OpenAIEmbeddingService.EMBEDDING_MODEL
      };
    });

    const embeddedTexts = await Promise.all(embeddingPromises);
    console.log(`✅ Created ${embeddedTexts.length} embeddings successfully\n`);

    // Step 2: Store all embeddings in VectorStore
    console.log("💾 Storing embeddings in VectorStore...");
    const storedRecords = [];
    for (let i = 0; i < embeddedTexts.length; i++) {
      const record = await vectorStore.storeVector(embeddedTexts[i]);
      storedRecords.push(record);
      console.log(`  ${i + 1}. Stored: ${record.id} (${record.sourceId})`);
    }
    console.log(`✅ Stored ${storedRecords.length} records successfully\n`);

    // Step 3: Perform searches with different queries
    const searchQueries = [
      "AI and machine learning in medicine",
      "Environmental issues and climate",
      "Clean energy and sustainability",
      "Advanced computing technologies",
      "Healthcare technology innovations"
    ];

    console.log("🔍 Performing similarity searches...\n");

    for (let i = 0; i < searchQueries.length; i++) {
      const query = searchQueries[i];
      console.log(`📝 Search Query ${i + 1}: "${query}"`);
      
      // Create embedding for search query
      const queryEmbedding = await embeddingService.createEmbedding(query);
      
      // Search for similar vectors
      const results = await vectorStore.searchSimilar(queryEmbedding, { limit: 5, minScore: 0.1 });
      
      // Display results in table format
      console.log("┌─────────────────────────────────────────────────────────────────────────────────┐");
      console.log("│ Search Results Table                                                           │");
      console.log("├─────────────────────────────────────────────────────────────────────────────────┤");
      console.log("│ Rank │ Score  │ Source ID        │ Source Type │ Topic        │ Text Preview   │");
      console.log("├─────────────────────────────────────────────────────────────────────────────────┤");
      
      results.forEach((result, index) => {
        const { record, score } = result;
        const textPreview = record.metadata?.text || sampleTexts.find(s => s.sourceId === record.sourceId)?.text || "N/A";
        const shortPreview = textPreview.length > 30 ? textPreview.substring(0, 30) + "..." : textPreview;
        const topic = record.metadata?.topic || "N/A";
        
        console.log(`│ ${String(index + 1).padStart(4)} │ ${score.toFixed(3)} │ ${record.sourceId.padEnd(15)} │ ${record.sourceType.padEnd(11)} │ ${topic.padEnd(12)} │ ${shortPreview.padEnd(14)} │`);
      });
      
      console.log("└─────────────────────────────────────────────────────────────────────────────────┘\n");
    }

    // Step 4: Test specific vector operations
    console.log("🔧 Testing additional VectorStore operations...");
    
    // Test getting vectors by source
    const healthcareVectors = await vectorStore.getVectorsBySource("healthcare-ai", "article");
    console.log(`📋 Found ${healthcareVectors.length} vectors for source "healthcare-ai"`);
    
    // Test updating a vector
    if (storedRecords.length > 0) {
      const firstRecord = storedRecords[0];
      const updatedRecord = await vectorStore.updateVector(firstRecord.id, {
        metadata: { ...firstRecord.metadata, updated: true, testRun: new Date().toISOString() }
      });
      console.log(`🔄 Updated vector ${firstRecord.id} with new metadata`);
    }

    console.log("\n✅ VectorStore test completed successfully!");
    console.log(`📁 Test data stored in: ${testVectorPath}`);
    console.log("💡 You can inspect the test-vectors.json file to see the stored data structure.");

  } catch (error) {
    console.error("❌ Test failed:", error);
    throw error;
  }
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
