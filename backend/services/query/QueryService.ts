import { ConversationMessage, OpenAIService } from "@backend/client/openai/OpenAIService";
import { OpenAIServiceFactory } from "@backend/client/openai/OpenAIServiceFactory";
import { ChatMessage } from "@backend/models/ChatMessage";
import { queryExtractionSystemPrompt } from "./prompts/queryExtractionSystemPrompt";

/**
 * Represents a domain-agnostic query extracted from conversation.
 */
export interface Query {
  category: string;
  query: string;
}

/**
 * Domain-agnostic service for extracting queries from conversations.
 * Does not know about memory-specific concepts - just generates categorized queries.
 */
export class QueryService {
  private readonly openAIService: OpenAIService;

  constructor() {
    const openAIFactory = new OpenAIServiceFactory();
    this.openAIService = openAIFactory.build();
  }

  /**
   * Extract categorized queries from conversation messages.
   * Returns domain-agnostic queries that can be used by any resolver.
   *
   * @param messages - Conversation messages to analyze
   * @param categoryDescriptions - Category descriptions for the LLM (domain-specific)
   * @returns Array of categorized queries
   */
  async extractQueries(
    messages: ChatMessage[],
    categoryDescriptions: Record<string, string>
  ): Promise<Query[]> {
    try {
      const openAIMessages: ConversationMessage[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const systemPrompt = queryExtractionSystemPrompt(categoryDescriptions);
      const thinking = await this.openAIService.sendMessages(systemPrompt, openAIMessages);
      const result = JSON.parse(thinking) as { queries: string[] };

      // Convert string queries to typed Query objects
      return result.queries.map(q => this.parseQueryString(q));
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Parse a query string in format "category: query" into a Query object.
   */
  private parseQueryString(queryString: string): Query {
    const colonIndex = queryString.indexOf(':');
    if (colonIndex === -1) {
      return { category: '', query: queryString.trim() };
    }
    return {
      category: queryString.substring(0, colonIndex).trim(),
      query: queryString.substring(colonIndex + 1).trim()
    };
  }
}
