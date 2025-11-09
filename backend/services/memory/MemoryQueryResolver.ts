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
   * Does NOT generate queries - accepts pre-generated Query objects.
   *
   * @param queries - Array of pre-generated Query objects
   * @returns Array of QueryResult objects with resolved memories
   */
  async resolveQueries(queries: Query[]): Promise<QueryResult[]> {
    if (!queries || queries.length === 0) {
      return [];
    }

    const queryResults: QueryResult[] = [];

    // Process each query individually
    for (const query of queries) {
      try {
        const memory = await this.resolveSingleQuery(query);
        if (memory) {
          queryResults.push({
            query,
            memory
          });
        }
      } catch (error) {
        console.error(`Error resolving query "${query.category}: ${query.query}":`, error);
        // Continue with other queries even if one fails
      }
    }

    // Remove duplicates based on MemoryRecord.id
    return this.removeDuplicateQueryResults(queryResults);
  }

  /**
   * Resolves a single query to the best matching memory.
   *
   * @param query - Query object with category and query text
   * @returns The best matching MemoryRecord or undefined if none found
   */
  private async resolveSingleQuery(query: Query): Promise<MemoryRecord | undefined> {
    // Convert category string to MemoryCategory enum
    const memoryCategory = parseMemoryCategory(query.category);

    // Search for memories using category-based search
    const searchOptions: MemorySearchOptions = {
      topK: 1, // Get only the best match
      minScore: 0.3, // Lower threshold for category-based search
    };

    const memories = await this.memorySearchService.searchMemoriesByCategory(
      memoryCategory,
      query.query,
      searchOptions
    );

    return memories.length > 0 ? memories[0] : undefined;
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
