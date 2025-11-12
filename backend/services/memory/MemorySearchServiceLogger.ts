/**
 * MemorySearchServiceLogger - Domain-specific logger for memory search operations
 * Provides clean, readable logging for memory search queries and results
 */

import { Logger } from "@backend/utils/Logger";
import { MemoryRecord, MemoryCategory } from "@backend/models/Memory";

export class MemorySearchServiceLogger {
  private logger: Logger;

  constructor() {
    this.logger = new Logger(
      'MemorySearchService',
      '🧠', // Brain icon for memory operations
      process.env.MEMORY_SEARCH_LOGGING_ENABLED?.toLowerCase() === 'true'
    );
  }

  /**
   * Enable or disable logging at runtime
   */
  setEnabled(enabled: boolean): void {
    this.logger.setEnabled(enabled);
  }

  /**
   * Check if logging is enabled
   */
  isEnabled(): boolean {
    return this.logger.isEnabled();
  }

  /**
   * Log a semantic memory search query
   */
  logSearchQuery(query: string, options?: { topK?: number; minScore?: number }): void {
    const topK = options?.topK ?? 10;
    const minScore = options?.minScore ?? 0;
    this.logger.log(`Searching memories: "${query}" (limit: ${topK}, minScore: ${minScore})`);
  }

  /**
   * Log search results from vector search
   */
  logVectorSearchResults(query: string, resultCount: number, source: 'vector' | 'text'): void {
    if (resultCount === 0) {
      this.logger.log(`No memories found via ${source} search for: "${query}"`);
    } else {
      this.logger.log(`Found ${resultCount} ${resultCount === 1 ? 'memory' : 'memories'} via ${source} search`);
    }
  }

  /**
   * Log detailed search results with memory preview
   */
  logSearchResults(query: string, memories: MemoryRecord[]): void {
    if (memories.length === 0) {
      this.logger.log(`Search completed: No memories found for "${query}"`);
      return;
    }

    const resultSummary = memories
      .slice(0, 5) // Show first 5 results
      .map((m, i) => {
        const category = m.category ? `[${m.category}]` : '[no-category]';
        const title = m.title.substring(0, 40);
        const importance = '★'.repeat(m.importance);
        return `  ${i + 1}. ${category} ${importance} "${title}"`;
      })
      .join('\n');

    const moreResults = memories.length > 5 ? `\n  ... and ${memories.length - 5} more` : '';
    this.logger.log(`Search completed: Found ${memories.length} ${memories.length === 1 ? 'memory' : 'memories'}\n${resultSummary}${moreResults}`);
  }

  /**
   * Log category-specific search query
   */
  logCategorySearchQuery(category: MemoryCategory, query: string, options?: { topK?: number }): void {
    const topK = options?.topK ?? 10;
    this.logger.log(`Searching [${category}] memories: "${query}" (limit: ${topK})`);
  }

  /**
   * Log category search results
   */
  logCategorySearchResults(category: MemoryCategory, query: string, memories: MemoryRecord[]): void {
    if (memories.length === 0) {
      this.logger.log(`Category search [${category}]: No memories found for "${query}"`);
      return;
    }

    const resultSummary = memories
      .slice(0, 3) // Show first 3 results for category searches
      .map((m, i) => {
        const title = m.title.substring(0, 50);
        const importance = '★'.repeat(m.importance);
        return `  ${i + 1}. ${importance} "${title}"`;
      })
      .join('\n');

    const moreResults = memories.length > 3 ? `\n  ... and ${memories.length - 3} more` : '';
    this.logger.log(`Category search [${category}]: Found ${memories.length} ${memories.length === 1 ? 'memory' : 'memories'}\n${resultSummary}${moreResults}`);
  }

  /**
   * Log embedding creation (real or fake)
   */
  logEmbeddingCreation(text: string, method: 'openai' | 'fake'): void {
    const preview = text.length > 50 ? text.substring(0, 50).replace(/\n/g, ' ') + '...' : text;
    this.logger.log(`Creating ${method} embedding for: "${preview}"`);
  }

  /**
   * Log fallback to text-based search
   */
  logFallbackToTextSearch(reason: string): void {
    this.logger.warn(`Falling back to text search: ${reason}`);
  }

  /**
   * Log when embedding service fails
   */
  logEmbeddingError(error: any): void {
    this.logger.error(`Embedding creation failed: ${error.message || error}`);
  }

  /**
   * Log search method being used
   */
  logSearchMethod(method: 'vector' | 'text', reason?: string): void {
    const reasonText = reason ? ` (${reason})` : '';
    this.logger.log(`Using ${method} search${reasonText}`);
  }
}

// Export singleton instance
export const memorySearchLogger = new MemorySearchServiceLogger();
