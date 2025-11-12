import { IMemoryRepository } from "../../repository/memory/IMemoryRepository";
import { MemoryRecord, MemoryCategory } from "../../models/Memory";
import { VectorStore } from "../../client/vector/VectorStore";
import { OpenAIEmbeddingService } from "../../client/openai/OpenAIEmbeddingService";
import { MemoryRepositoryFactory } from "@backend/repository/memory/MemoryRepositoryFactory";
import { memorySearchLogger } from "./MemorySearchServiceLogger";

export interface MemorySearchOptions {
  topK?: number;
  minScore?: number;
}

export class MemorySearchService {
  private memoryRepository: IMemoryRepository;
  private vectorStore: VectorStore;
  private embeddingService?: OpenAIEmbeddingService;

  constructor(
    vectorStore: VectorStore,
    embeddingService?: OpenAIEmbeddingService,
    memoryRepository?: IMemoryRepository
  ) {
    // Allow dependency injection of memoryRepository for testing
    if (memoryRepository) {
      this.memoryRepository = memoryRepository;
    } else {
      const memoryRepoFactory = new MemoryRepositoryFactory();
      this.memoryRepository = memoryRepoFactory.build();
    }

    this.vectorStore = vectorStore;
    this.embeddingService = embeddingService;
  }

  async searchMemories(query: string, options?: MemorySearchOptions): Promise<MemoryRecord[]> {
    const topK = options?.topK ?? 10;
    const minScore = options?.minScore ?? 0;

    // Log search query
    memorySearchLogger.logSearchQuery(query, { topK, minScore });

    // Try vector search first
    const embedding = await this.createEmbedding(query);
    const vectorResults = await this.vectorStore.searchSimilar(embedding, { limit: topK, minScore, sourceType: "Memory" });

    memorySearchLogger.logVectorSearchResults(query, vectorResults.length, 'vector');

    if (vectorResults.length > 0) {
      // Get memory IDs from vector results
      const memoryIds = vectorResults
        .filter(result => result.record.sourceType === "Memory")
        .map(result => result.record.sourceId);

      // Fetch actual memory records by IDs
      const memories: MemoryRecord[] = [];
      for (const id of memoryIds) {
        const memory = await this.memoryRepository.getMemory(id);
        if (memory) {
          memories.push(memory);
        }
      }

      memorySearchLogger.logSearchResults(query, memories);
      return memories;
    }

    // Fallback to text-based search
    memorySearchLogger.logFallbackToTextSearch('No vector results found');
    const textResults = await this.memoryRepository.findMemoriesByText(query, topK);
    memorySearchLogger.logSearchResults(query, textResults);

    return textResults;
  }

  async searchMemoriesByCategory(
    category: MemoryCategory,
    query: string,
    options?: MemorySearchOptions
  ): Promise<MemoryRecord[]> {
    // Log category search query
    memorySearchLogger.logCategorySearchQuery(category, query, options);

    // Get more results to account for category filtering
    const searchOptions = {
      ...options,
      topK: (options?.topK ?? 10) * 3 // Get 3x more results to ensure we have enough after filtering
    };

    const allMemories = await this.searchMemories(query, searchOptions);

    // Filter by category and limit to requested topK
    const filteredMemories = allMemories
      .filter(memory => memory.category === category)
      .slice(0, options?.topK ?? 10);

    memorySearchLogger.logCategorySearchResults(category, query, filteredMemories);

    return filteredMemories;
  }

  private async createEmbedding(text: string): Promise<number[]> {
    if (this.embeddingService) {
      try {
        memorySearchLogger.logEmbeddingCreation(text, 'openai');
        return await this.embeddingService.createEmbedding(text);
      } catch (error) {
        memorySearchLogger.logEmbeddingError(error);
      }
    }

    // Fallback to fake embedding
    memorySearchLogger.logEmbeddingCreation(text, 'fake');
    return this.vectorStore.fakeEmbed(text, 1536);
  }

}