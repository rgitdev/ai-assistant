import { ConversationMessage, OpenAIService } from "@backend/client/openai/OpenAIService";
import { OpenAIServiceFactory } from "@backend/client/openai/OpenAIServiceFactory";
import { ChatMessage } from "@backend/models/ChatMessage";
import { queryExtractionSystemPrompt } from "./prompts/queryExtractionSystemPrompt";

/**
 * Query types for routing to different resolvers.
 */
export type QueryType = "memory" | "websearch" | "calendar" | "other";

/**
 * Domain-agnostic query that can be routed to different resolvers.
 */
export interface Query {
  type: QueryType;
  text: string;  // What to search for (natural language)
  metadata?: Record<string, any>;  // Optional routing hints (e.g., memory category)
}

/**
 * Domain-agnostic service for extracting queries from conversations.
 * Generates queries that can be routed to different resolvers (memory, websearch, etc.).
 */
export class QueryService {
  private readonly openAIService: OpenAIService;

  constructor() {
    const openAIFactory = new OpenAIServiceFactory();
    this.openAIService = openAIFactory.build();
  }

  /**
   * Extract queries from conversation messages.
   * Returns domain-agnostic queries that can be routed to appropriate resolvers.
   *
   * @param messages - Conversation messages to analyze
   * @param queryTypes - Allowed query types for routing
   * @param categoryHints - Optional category hints for metadata (domain-specific)
   * @returns Array of queries with type and routing metadata
   */
  async extractQueries(
    messages: ChatMessage[],
    queryTypes: QueryType[] = ["memory"],
    categoryHints?: Record<string, string>
  ): Promise<Query[]> {
    try {
      const openAIMessages: ConversationMessage[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const systemPrompt = queryExtractionSystemPrompt(queryTypes, categoryHints);
      const thinking = await this.openAIService.sendMessages(systemPrompt, openAIMessages);
      const result = JSON.parse(thinking) as { queries: string[] };

      // Convert string queries to typed Query objects
      return result.queries.map(q => this.parseQueryString(q));
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Parse a query string in format "type|category: query text" into a Query object.
   * Format: "memory|user_profile: user's programming preferences"
   */
  private parseQueryString(queryString: string): Query {
    const colonIndex = queryString.indexOf(':');
    if (colonIndex === -1) {
      return { type: "other", text: queryString.trim() };
    }

    const typeAndCategory = queryString.substring(0, colonIndex).trim();
    const text = queryString.substring(colonIndex + 1).trim();

    // Parse "type|category" format
    const pipeIndex = typeAndCategory.indexOf('|');
    if (pipeIndex === -1) {
      // No category, just type
      return {
        type: typeAndCategory as QueryType,
        text
      };
    }

    // Has both type and category
    const type = typeAndCategory.substring(0, pipeIndex).trim() as QueryType;
    const category = typeAndCategory.substring(pipeIndex + 1).trim();

    return {
      type,
      text,
      metadata: { category }
    };
  }
}
