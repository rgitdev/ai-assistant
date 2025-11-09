import { MemoryRecord, MemoryCategory, parseMemoryCategory } from "@backend/models/Memory";
import { Query } from "@backend/services/query/QueryService";
import { MemorySearchService, MemorySearchOptions } from "./MemorySearchService";
import { VectorStore } from "@backend/client/vector/VectorStore";
import { OpenAIEmbeddingService } from "@backend/client/openai/OpenAIEmbeddingService";

export interface QueryResult {
  query: Query;
  memory: MemoryRecord;
}

/**
 * Memory-specific query resolver.
 * Resolves domain-agnostic queries into memory records without generating queries.
 * Single responsibility: Query resolution only.
 */
export class MemoryQueryResolver {
  private readonly memorySearchService: MemorySearchService;

  constructor(
    vectorStore: VectorStore,
    embeddingService?: OpenAIEmbeddingService
  ) {
    this.memorySearchService = new MemorySearchService(vectorStore, embeddingService);
  }

  /**
   * Resolves queries into matching memory records.
   * Only processes queries with type="memory", ignoring others.
   *
   * @param queries - Array of pre-generated Query objects
   * @returns Array of QueryResult objects with resolved memories
   */
  async resolveQueries(queries: Query[]): Promise<QueryResult[]> {
    if (!queries || queries.length === 0) {
      return [];
    }

    // Filter to only memory queries
    const memoryQueries = queries.filter(q => q.type === "memory");

    const queryResults: QueryResult[] = [];

    // Process each memory query individually
    for (const query of memoryQueries) {
      try {
        const memory = await this.resolveSingleQuery(query);
        if (memory) {
          queryResults.push({
            query,
            memory
          });
        }
      } catch (error) {
        console.error(`Error resolving query "${query.type}: ${query.text}":`, error);
        // Continue with other queries even if one fails
      }
    }

    // Remove duplicates based on MemoryRecord.id
    return this.removeDuplicateQueryResults(queryResults);
  }

  /**
   * Resolves a single memory query to the best matching memory.
   *
   * @param query - Query object with type="memory" and optional category in metadata
   * @returns The best matching MemoryRecord or undefined if none found
   */
  private async resolveSingleQuery(query: Query): Promise<MemoryRecord | undefined> {
    // Extract category from metadata if available
    const category = query.metadata?.category;

    // Search for memories using category-based search if category provided
    const searchOptions: MemorySearchOptions = {
      topK: 1, // Get only the best match
      minScore: 0.3, // Lower threshold for category-based search
    };

    if (category) {
      const memoryCategory = parseMemoryCategory(category);
      const memories = await this.memorySearchService.searchMemoriesByCategory(
        memoryCategory,
        query.text,
        searchOptions
      );
      return memories.length > 0 ? memories[0] : undefined;
    } else {
      // No category specified, search all memories
      const memories = await this.memorySearchService.searchMemories(query.text, searchOptions);
      return memories.length > 0 ? memories[0] : undefined;
    }
  }

  /**
   * Removes duplicate query results based on MemoryRecord.id.
   *
   * @param queryResults - Array of QueryResult objects
   * @returns Array of unique QueryResult objects
   */
  private removeDuplicateQueryResults(queryResults: QueryResult[]): QueryResult[] {
    return Array.from(
      queryResults
        .reduce((acc, result) => {
          const key = result.memory.id;
          return acc.has(key) ? acc : acc.set(key, result);
        }, new Map<string, QueryResult>())
        .values()
    );
  }
}
