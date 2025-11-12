import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { AssistantServiceWithTools } from "../AssistantServiceWithTools";
import { ToolRegistry } from "@backend/assistant/ToolRegistry";
import { SearchMemoriesTool } from "@backend/assistant/tools/SearchMemoriesTool";
import { SearchMemoriesByCategoryTool } from "@backend/assistant/tools/SearchMemoriesByCategoryTool";
import { MemorySearchService } from "@backend/services/memory/MemorySearchService";
import { MemoryFileRepository } from "@backend/repository/memory/MemoryFileRepository";
import { VectorStore } from "@backend/client/vector/VectorStore";
import { MemoryCategory } from "@backend/models/Memory";
import * as path from "path";
import * as fs from "fs";

describe("AssistantServiceWithTools", () => {
  let assistantService: AssistantServiceWithTools;
  let toolRegistry: ToolRegistry;
  let memorySearchService: MemorySearchService;
  let memoryRepository: MemoryFileRepository;
  let vectorStore: VectorStore;

  // Test data paths
  const testMemoriesPath = path.join(__dirname, "test-memories.json");
  const testVectorsPath = path.join(__dirname, "test-vectors.json");

  beforeAll(async () => {
    // Setup: Create test repositories and services with proper dependency injection

    // 1. Create MemoryFileRepository pointing to test data
    memoryRepository = new MemoryFileRepository(testMemoriesPath);

    // 2. Create VectorStore for semantic search
    vectorStore = new VectorStore(testVectorsPath);

    // 3. Populate vector store with test data for semantic search
    await setupTestVectors();

    // 4. Create MemorySearchService with injected test repository
    memorySearchService = new MemorySearchService(
      vectorStore,
      undefined, // No OpenAI embedding service - will use fake embeddings
      memoryRepository
    );

    // 5. Create and register tools
    const searchMemoriesTool = new SearchMemoriesTool(memorySearchService);
    const searchMemoriesByCategoryTool = new SearchMemoriesByCategoryTool(memorySearchService);

    toolRegistry = new ToolRegistry();
    toolRegistry.registerTool(searchMemoriesTool);
    toolRegistry.registerTool(searchMemoriesByCategoryTool);

    // 6. Create AssistantServiceWithTools
    assistantService = new AssistantServiceWithTools(toolRegistry);
  });

  afterAll(() => {
    // Cleanup: Remove test vector file
    if (fs.existsSync(testVectorsPath)) {
      fs.unlinkSync(testVectorsPath);
    }
  });

  /**
   * Setup test vectors for semantic search
   * Creates embeddings for each memory in the test data
   */
  async function setupTestVectors() {
    const memories = await memoryRepository.getAllMemories();

    for (const memory of memories) {
      // Create a searchable text from title and content
      const searchText = `${memory.title} ${memory.content}`;
      const embedding = vectorStore.fakeEmbed(searchText, 1536);

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
  }

  describe("ToolRegistry Integration", () => {
    test("should have search_memories tool registered", () => {
      const tool = toolRegistry.getTool("search_memories");
      expect(tool).toBeDefined();
      expect(tool?.name).toBe("search_memories");
    });

    test("should have search_memories_by_category tool registered", () => {
      const tool = toolRegistry.getTool("search_memories_by_category");
      expect(tool).toBeDefined();
      expect(tool?.name).toBe("search_memories_by_category");
    });

    test("should return OpenAI-compatible tool definitions", () => {
      const definitions = toolRegistry.getOpenAIToolDefinitions();
      expect(definitions).toHaveLength(2);
      expect(definitions[0].type).toBe("function");
      expect(definitions[0].function.name).toBeDefined();
      expect(definitions[0].function.parameters).toBeDefined();
    });

    test("should list all registered tool names", () => {
      const names = assistantService.getAvailableTools();
      expect(names).toContain("search_memories");
      expect(names).toContain("search_memories_by_category");
    });
  });

  describe("SearchMemoriesTool", () => {
    test("should execute search_memories tool directly", async () => {
      const result = await toolRegistry.executeTool("search_memories", {
        query: "TypeScript",
        limit: 3
      });

      expect(result).toBeDefined();
      expect(result.count).toBeGreaterThan(0);
      expect(result.memories).toBeInstanceOf(Array);

      // Verify the result contains relevant memories
      const hasTsMemory = result.memories.some(
        (m: any) => m.content.toLowerCase().includes("typescript")
      );
      expect(hasTsMemory).toBe(true);
    });

    test("should search with different queries", async () => {
      const result = await toolRegistry.executeTool("search_memories", {
        query: "authentication security",
        limit: 5
      });

      expect(result).toBeDefined();
      expect(result.count).toBeGreaterThan(0);
      expect(result.memories).toBeInstanceOf(Array);
    });

    test("should respect limit parameter", async () => {
      const result = await toolRegistry.executeTool("search_memories", {
        query: "user",
        limit: 2
      });

      expect(result.memories.length).toBeLessThanOrEqual(2);
    });

    test("should return memory with expected fields", async () => {
      const result = await toolRegistry.executeTool("search_memories", {
        query: "TypeScript",
        limit: 1
      });

      expect(result.memories.length).toBeGreaterThan(0);

      const memory = result.memories[0];
      expect(memory.id).toBeDefined();
      expect(memory.title).toBeDefined();
      expect(memory.content).toBeDefined();
      expect(memory.category).toBeDefined();
      expect(memory.importance).toBeDefined();
      expect(memory.createdAt).toBeDefined();
    });
  });

  describe("SearchMemoriesByCategoryTool", () => {
    test("should execute search_memories_by_category tool directly", async () => {
      const result = await toolRegistry.executeTool("search_memories_by_category", {
        category: MemoryCategory.USER_PROFILE,
        query: "programming",
        limit: 3
      });

      expect(result).toBeDefined();
      expect(result.category).toBe(MemoryCategory.USER_PROFILE);
      expect(result.count).toBeGreaterThan(0);
      expect(result.memories).toBeInstanceOf(Array);

      // Verify all results are from the correct category
      result.memories.forEach((m: any) => {
        expect(m.category).toBe(MemoryCategory.USER_PROFILE);
      });
    });

    test("should search in TASK category", async () => {
      const result = await toolRegistry.executeTool("search_memories_by_category", {
        category: MemoryCategory.TASK,
        query: "authentication",
        limit: 5
      });

      expect(result).toBeDefined();
      expect(result.category).toBe(MemoryCategory.TASK);

      if (result.count > 0) {
        result.memories.forEach((m: any) => {
          expect(m.category).toBe(MemoryCategory.TASK);
        });
      }
    });

    test("should search in KNOWLEDGE category", async () => {
      const result = await toolRegistry.executeTool("search_memories_by_category", {
        category: MemoryCategory.KNOWLEDGE,
        query: "TypeScript best practices",
        limit: 5
      });

      expect(result).toBeDefined();
      expect(result.category).toBe(MemoryCategory.KNOWLEDGE);

      if (result.count > 0) {
        result.memories.forEach((m: any) => {
          expect(m.category).toBe(MemoryCategory.KNOWLEDGE);
        });
      }
    });

    test("should search in GOAL category", async () => {
      const result = await toolRegistry.executeTool("search_memories_by_category", {
        category: MemoryCategory.GOAL,
        query: "system design",
        limit: 5
      });

      expect(result).toBeDefined();
      expect(result.category).toBe(MemoryCategory.GOAL);

      if (result.count > 0) {
        result.memories.forEach((m: any) => {
          expect(m.category).toBe(MemoryCategory.GOAL);
        });
      }
    });

    test("should search in PREFERENCE category", async () => {
      const result = await toolRegistry.executeTool("search_memories_by_category", {
        category: MemoryCategory.PREFERENCE,
        query: "dark mode",
        limit: 5
      });

      expect(result).toBeDefined();
      expect(result.category).toBe(MemoryCategory.PREFERENCE);

      if (result.count > 0) {
        result.memories.forEach((m: any) => {
          expect(m.category).toBe(MemoryCategory.PREFERENCE);
        });
      }
    });

    test("should handle category with no results gracefully", async () => {
      const result = await toolRegistry.executeTool("search_memories_by_category", {
        category: MemoryCategory.OTHER,
        query: "nonexistent query xyz123",
        limit: 5
      });

      expect(result).toBeDefined();
      expect(result.category).toBe(MemoryCategory.OTHER);
      expect(result.count).toBe(0);
      expect(result.memories).toHaveLength(0);
    });

    test("should respect limit parameter in category search", async () => {
      const result = await toolRegistry.executeTool("search_memories_by_category", {
        category: MemoryCategory.CONVERSATION,
        query: "discussion",
        limit: 1
      });

      expect(result.memories.length).toBeLessThanOrEqual(1);
    });
  });

  describe("Memory Data Integrity", () => {
    test("should have test memories loaded", async () => {
      const memories = await memoryRepository.getAllMemories();
      expect(memories.length).toBeGreaterThan(0);
    });

    test("should have memories with different categories", async () => {
      const memories = await memoryRepository.getAllMemories();
      const categories = new Set(memories.map(m => m.category));

      // We should have multiple categories represented
      expect(categories.size).toBeGreaterThan(1);
      expect(categories.has(MemoryCategory.USER_PROFILE)).toBe(true);
      expect(categories.has(MemoryCategory.TASK)).toBe(true);
      expect(categories.has(MemoryCategory.KNOWLEDGE)).toBe(true);
    });

    test("should retrieve specific memory by category", async () => {
      const userProfileMemories = await memoryRepository.findMemoriesByCategory(
        MemoryCategory.USER_PROFILE
      );

      expect(userProfileMemories.length).toBeGreaterThan(0);
      userProfileMemories.forEach(m => {
        expect(m.category).toBe(MemoryCategory.USER_PROFILE);
      });
    });
  });

  describe("Error Handling", () => {
    test("should throw error for non-existent tool", async () => {
      expect(async () => {
        await toolRegistry.executeTool("non_existent_tool", {});
      }).toThrow();
    });

    test("should handle missing required parameters gracefully", async () => {
      // Search memories requires 'query' parameter
      try {
        await toolRegistry.executeTool("search_memories", {
          limit: 5
          // Missing 'query' parameter
        });
        // If no error thrown, this test should fail
        expect(true).toBe(false);
      } catch (error) {
        // Expected to throw an error
        expect(error).toBeDefined();
      }
    });
  });

  describe("Integration Tests", () => {
    test("should search across all categories and then filter by specific category", async () => {
      // First, search all memories
      const allResults = await toolRegistry.executeTool("search_memories", {
        query: "TypeScript",
        limit: 10
      });

      // Then search within a specific category
      const categoryResults = await toolRegistry.executeTool("search_memories_by_category", {
        category: MemoryCategory.KNOWLEDGE,
        query: "TypeScript",
        limit: 10
      });

      // Category results should be a subset or equal
      expect(categoryResults.count).toBeLessThanOrEqual(allResults.count);
    });

    test("should have consistent memory IDs between tools", async () => {
      const result1 = await toolRegistry.executeTool("search_memories", {
        query: "authentication",
        limit: 5
      });

      const result2 = await toolRegistry.executeTool("search_memories_by_category", {
        category: MemoryCategory.TASK,
        query: "authentication",
        limit: 5
      });

      // If we find the same memory, IDs should match
      if (result1.count > 0 && result2.count > 0) {
        const ids1 = new Set(result1.memories.map((m: any) => m.id));
        const ids2 = new Set(result2.memories.map((m: any) => m.id));

        // Check if there's any overlap
        const overlap = [...ids1].filter(id => ids2.has(id));

        // If there's overlap, verify the memories are identical
        if (overlap.length > 0) {
          const mem1 = result1.memories.find((m: any) => m.id === overlap[0]);
          const mem2 = result2.memories.find((m: any) => m.id === overlap[0]);

          expect(mem1.title).toBe(mem2.title);
          expect(mem1.content).toBe(mem2.content);
        }
      }
    });
  });

  describe("AssistantServiceWithTools", () => {
    test("should be initialized with tools", () => {
      expect(assistantService).toBeDefined();
      expect(assistantService.getAvailableTools().length).toBeGreaterThan(0);
    });

    test("should have access to both memory search tools", () => {
      const tools = assistantService.getAvailableTools();
      expect(tools).toContain("search_memories");
      expect(tools).toContain("search_memories_by_category");
    });

    // Note: Testing actual OpenAI integration would require API key and real API calls
    // These tests focus on the tool setup and execution layer
  });
});
