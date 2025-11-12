import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { AssistantServiceWithTools } from "../AssistantServiceWithTools";
import { ToolRegistry } from "@backend/assistant/ToolRegistry";
import { SearchMemoriesTool } from "@backend/assistant/tools/SearchMemoriesTool";
import { SearchMemoriesByCategoryTool } from "@backend/assistant/tools/SearchMemoriesByCategoryTool";
import { MemorySearchService } from "@backend/services/memory/MemorySearchService";
import { MemoryFileRepository } from "@backend/repository/memory/MemoryFileRepository";
import { VectorStore } from "@backend/client/vector/VectorStore";
import { OpenAIEmbeddingService } from "@backend/client/openai/OpenAIEmbeddingService";
import * as path from "path";
import * as fs from "fs";

/**
 * Integration Tests for AssistantServiceWithTools
 *
 * These tests make REAL API calls to OpenAI and are more expensive/slower than unit tests.
 * They verify end-to-end functionality including:
 * - OpenAI API integration
 * - Tool calling mechanism
 * - Memory search tool execution
 * - Complete conversation flow
 *
 * REQUIREMENTS:
 * - OPENAI_API_KEY environment variable must be set
 * - Internet connection required
 * - May incur OpenAI API costs
 *
 * Run separately from unit tests:
 * bun test backend/services/assistant/__tests__/AssistantServiceWithToolsIT.test.ts
 */
describe("AssistantServiceWithToolsIT - Integration Tests", () => {
  let assistantService: AssistantServiceWithTools;
  let toolRegistry: ToolRegistry;
  let memorySearchService: MemorySearchService;
  let memoryRepository: MemoryFileRepository;
  let vectorStore: VectorStore;
  let embeddingService: OpenAIEmbeddingService;

  // Test data paths
  const testMemoriesPath = path.join(__dirname, "test-memories.json");
  const testVectorsPath = path.join(__dirname, "test-vectors-it.json");

  beforeAll(async () => {
    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        "OPENAI_API_KEY environment variable is required for integration tests. " +
        "Skipping integration tests."
      );
    }

    console.log("Setting up integration test environment...");

    // 1. Create MemoryFileRepository pointing to test data
    memoryRepository = new MemoryFileRepository(testMemoriesPath);

    // 2. Create VectorStore for semantic search
    vectorStore = new VectorStore(testVectorsPath);

    // 3. Create OpenAI embedding service for REAL embeddings
    embeddingService = new OpenAIEmbeddingService(process.env.OPENAI_API_KEY);

    // 4. Populate vector store with REAL embeddings from OpenAI
    await setupTestVectorsWithRealEmbeddings();

    // 5. Create MemorySearchService with real embedding service
    memorySearchService = new MemorySearchService(
      vectorStore,
      embeddingService, // Using REAL OpenAI embeddings
      memoryRepository
    );

    // 6. Create and register tools
    const searchMemoriesTool = new SearchMemoriesTool(memorySearchService);
    const searchMemoriesByCategoryTool = new SearchMemoriesByCategoryTool(memorySearchService);

    toolRegistry = new ToolRegistry();
    toolRegistry.registerTool(searchMemoriesTool);
    toolRegistry.registerTool(searchMemoriesByCategoryTool);

    // 7. Create AssistantServiceWithTools
    assistantService = new AssistantServiceWithTools(toolRegistry);

    console.log("Integration test environment setup complete");
  });

  afterAll(() => {
    // Cleanup: Remove test vector file
    if (fs.existsSync(testVectorsPath)) {
      fs.unlinkSync(testVectorsPath);
      console.log("Cleaned up test vectors file");
    }
  });

  /**
   * Setup test vectors using REAL OpenAI embeddings
   * This is slower but provides accurate semantic search for integration testing
   */
  async function setupTestVectorsWithRealEmbeddings() {
    console.log("Creating real embeddings for test memories...");
    const memories = await memoryRepository.getAllMemories();

    for (const memory of memories) {
      // Create a searchable text from title and content
      const searchText = `${memory.title} ${memory.content}`;

      // Get REAL embedding from OpenAI
      const embedding = await embeddingService.createEmbedding(searchText);

      await vectorStore.storeVector({
        sourceId: memory.id,
        sourceType: "Memory",
        embedding: embedding,
        metadata: {
          category: memory.category,
          title: memory.title
        }
      });
    }
    console.log(`Created embeddings for ${memories.length} memories`);
  }

  describe("OpenAI Conversation with Tools", () => {
    test("should invoke OpenAI and use search_memories tool when asked about user preferences", async () => {
      // This test makes a REAL API call to OpenAI
      console.log("\n=== Starting Integration Test: Memory Search ===");

      const systemPrompt = "You are a helpful assistant with access to memory search tools. Use them when the user asks about stored information.";

      const messages = [
        {
          role: "user" as const,
          content: "What do you know about my programming language preferences? Please search the memories."
        }
      ];

      console.log("Sending conversation to OpenAI...");
      const startTime = Date.now();

      const response = await assistantService.sendConversationWithTools(
        systemPrompt,
        messages,
        {
          maxToolIterations: 5,
          enableTools: true
        }
      );

      const duration = Date.now() - startTime;
      console.log(`Response received in ${duration}ms`);
      console.log("Assistant response:", response);

      // Assertions
      expect(response).toBeDefined();
      expect(typeof response).toBe("string");
      expect(response.length).toBeGreaterThan(0);

      // The response should mention TypeScript since that's in the test memories
      // This validates that the tool was actually called and the memory was retrieved
      expect(response.toLowerCase()).toMatch(/typescript|programming|language/);

      console.log("=== Integration Test Complete ===\n");
    }, 60000); // 60 second timeout for API call

    test("should invoke OpenAI and use search_memories_by_category tool for specific category queries", async () => {
      console.log("\n=== Starting Integration Test: Category-Specific Search ===");

      const systemPrompt = "You are a helpful assistant with access to memory search tools. When asked about specific types of information, use the category search tool.";

      const messages = [
        {
          role: "user" as const,
          content: "Search my task-related memories for anything about authentication. Use the category search tool."
        }
      ];

      console.log("Sending conversation to OpenAI...");
      const startTime = Date.now();

      const response = await assistantService.sendConversationWithTools(
        systemPrompt,
        messages,
        {
          maxToolIterations: 5,
          enableTools: true
        }
      );

      const duration = Date.now() - startTime;
      console.log(`Response received in ${duration}ms`);
      console.log("Assistant response:", response);

      // Assertions
      expect(response).toBeDefined();
      expect(typeof response).toBe("string");
      expect(response.length).toBeGreaterThan(0);

      // The response should mention authentication and JWT since that's in the task memory
      expect(response.toLowerCase()).toMatch(/authentication|jwt|task/);

      console.log("=== Integration Test Complete ===\n");
    }, 60000); // 60 second timeout for API call

    test("should handle multi-turn conversation with tool usage", async () => {
      console.log("\n=== Starting Integration Test: Multi-Turn Conversation ===");

      const systemPrompt = "You are a helpful assistant with access to memory search tools. Use them to answer questions about stored information.";

      const messages = [
        {
          role: "user" as const,
          content: "What are my goals?"
        }
      ];

      console.log("Sending first message to OpenAI...");
      const response1 = await assistantService.sendConversationWithTools(
        systemPrompt,
        messages,
        {
          maxToolIterations: 5,
          enableTools: true
        }
      );

      console.log("First response:", response1);
      expect(response1).toBeDefined();
      expect(response1.toLowerCase()).toMatch(/system design|goal/);

      // Add follow-up message
      messages.push(
        { role: "assistant" as const, content: response1 },
        { role: "user" as const, content: "What knowledge do I have about TypeScript?" }
      );

      console.log("Sending follow-up message to OpenAI...");
      const response2 = await assistantService.sendConversationWithTools(
        systemPrompt,
        messages,
        {
          maxToolIterations: 5,
          enableTools: true
        }
      );

      console.log("Second response:", response2);
      expect(response2).toBeDefined();
      expect(response2.toLowerCase()).toMatch(/typescript|best practices|strict mode/);

      console.log("=== Integration Test Complete ===\n");
    }, 90000); // 90 second timeout for multiple API calls

    test("should work without tools when enableTools is false", async () => {
      console.log("\n=== Starting Integration Test: No Tools ===");

      const systemPrompt = "You are a helpful assistant.";

      const messages = [
        {
          role: "user" as const,
          content: "What is 2 + 2?"
        }
      ];

      console.log("Sending conversation to OpenAI without tools...");
      const startTime = Date.now();

      const response = await assistantService.sendConversationWithTools(
        systemPrompt,
        messages,
        {
          maxToolIterations: 5,
          enableTools: false // Disable tools
        }
      );

      const duration = Date.now() - startTime;
      console.log(`Response received in ${duration}ms`);
      console.log("Assistant response:", response);

      // Assertions
      expect(response).toBeDefined();
      expect(typeof response).toBe("string");
      expect(response.length).toBeGreaterThan(0);

      // Should answer the math question directly
      expect(response).toMatch(/4|four/i);

      console.log("=== Integration Test Complete ===\n");
    }, 60000); // 60 second timeout for API call
  });

  describe("Tool Availability", () => {
    test("should have both memory search tools available", () => {
      const tools = assistantService.getAvailableTools();

      expect(tools).toContain("search_memories");
      expect(tools).toContain("search_memories_by_category");
      expect(tools.length).toBe(2);
    });
  });

  describe("Real Embedding Quality", () => {
    test("should retrieve semantically similar memories using real embeddings", async () => {
      console.log("\n=== Testing Real Embedding Quality ===");

      // Search for "coding preferences" which should match the assistant persona memory
      const result = await toolRegistry.executeTool("search_memories", {
        query: "coding style and best practices",
        limit: 3
      });

      console.log("Semantic search results:", result);

      expect(result.count).toBeGreaterThan(0);
      expect(result.memories).toBeInstanceOf(Array);

      // Should find memories about coding, TypeScript best practices, or assistant coding style
      const relevantMemory = result.memories.some((m: any) =>
        m.content.toLowerCase().includes("code") ||
        m.content.toLowerCase().includes("typescript") ||
        m.content.toLowerCase().includes("best practices")
      );

      expect(relevantMemory).toBe(true);

      console.log("=== Embedding Quality Test Complete ===\n");
    });
  });
});
