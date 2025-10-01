import { MemoryRecord, MemoryCategory, parseMemoryCategory } from "@backend/models/Memory";
import { IMemoryRepository, MemorySearchOptions } from "@backend/repository/memory/IMemoryRepository";
import { MemoryRepositoryFactory } from "@backend/repository/memory/MemoryRepositoryFactory";

export interface QueryResult {
  query: string;
  category: string;
  searchQuery: string;
  memory: MemoryRecord;
}

/**
 * Service responsible for finding memories based on search queries.
 * Takes queries in format "category: query" and returns the best matching memory for each.
 */
export class MemoryAnswerQueryService {
  private readonly memoryRepository: IMemoryRepository;

  constructor() {
    const memoryRepoFactory = new MemoryRepositoryFactory();
    this.memoryRepository = memoryRepoFactory.build();
  }

  /**
   * Processes multiple queries and returns the best matching memory for each.
   * Removes duplicates based on MemoryRecord.id.
   * 
   * @param queries Array of queries in format "category: query"
   * @returns Array of QueryResult objects with detailed information
   */
  public async findMemoriesForQueries(queries: string[]): Promise<QueryResult[]> {
    if (!queries || queries.length === 0) {
      return [];
    }

    const queryResults: QueryResult[] = [];
    
    // Process each query individually
    for (const query of queries) {
      const { category, searchQuery } = this.parseQuery(query);
      
      try {
        const memory = await this.findMemoryForSingleQuery(category, searchQuery);
        if (memory) {
          queryResults.push({
            query,
            category,
            searchQuery,
            memory
          });
        }
      } catch (error) {
        console.error(`Error processing query "${query}":`, error);
        // Continue with other queries even if one fails - don't add undefined memory
      }
    }

    // Remove duplicates based on MemoryRecord.id
    return this.removeDuplicateQueryResults(queryResults);
  }

  /**
   * Processes a single query and returns the best matching memory.
   * 
   * @param category The memory category
   * @param searchQuery The search query string
   * @returns The best matching MemoryRecord or undefined if none found
   */
  private async findMemoryForSingleQuery(category: string, searchQuery: string): Promise<MemoryRecord | undefined> {
    // Convert category string to MemoryCategory enum
    const memoryCategory = parseMemoryCategory(category);
    
    // Search for memories using category-based search
    const searchOptions: MemorySearchOptions = {
      topK: 1, // Get only the best match
      minScore: 0.3, // Lower threshold for category-based search
      useEmbeddings: false, // Use simple text matching for now
    };

    const memories = await this.memoryRepository.searchMemoriesByCategory(memoryCategory, searchQuery, searchOptions);
    return memories.length > 0 ? memories[0] : undefined;
  }

  /**
   * Extracts category and search query from a query in format "category: query".
   * 
   * @param query Query string
   * @returns Object with category and searchQuery properties
   */
  private parseQuery(query: string): { category: string, searchQuery: string } {
    const colonIndex = query.indexOf(':');
    if (colonIndex === -1) {
      return { category: '', searchQuery: query.trim() };
    }
    return {
      category: query.substring(0, colonIndex).trim(),
      searchQuery: query.substring(colonIndex + 1).trim()
    };
  }

  /**
   * Removes duplicate query results based on MemoryRecord.id.
   * 
   * @param queryResults Array of QueryResult objects
   * @returns Array of unique QueryResult objects
   */
  private removeDuplicateQueryResults(queryResults: QueryResult[]): QueryResult[] {
    // Remove duplicates by memory.id
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
