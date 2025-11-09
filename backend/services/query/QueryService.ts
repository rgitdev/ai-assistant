import { ConversationMessage, OpenAIService } from "@backend/client/openai/OpenAIService";
import { OpenAIServiceFactory } from "@backend/client/openai/OpenAIServiceFactory";
import { ChatMessage } from "@backend/models/ChatMessage";

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

      const systemPrompt = this.buildQuerySystemPrompt(categoryDescriptions);
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

  /**
   * Build system prompt for query generation.
   * Accepts category descriptions from the caller (domain-specific).
   */
  private buildQuerySystemPrompt(categoryDescriptions: Record<string, string>): string {
    const categoriesText = Object.entries(categoryDescriptions)
      .map(([category, description]) => `- ${category}: ${description}`)
      .join('\n');

    return this.createQueryPromptTemplate(categoriesText);
  }

  /**
   * Query generation prompt template.
   * This is domain-agnostic - it generates queries based on provided categories.
   */
  private createQueryPromptTemplate(categoriesText: string): string {
    return `You are a query extraction assistant. Your task is to analyze conversations and extract relevant search queries categorized by the provided categories.

Available Categories:
${categoriesText}

Your task:
1. Analyze the conversation to understand what information would be helpful to recall
2. Generate specific search queries that would help retrieve relevant information
3. Format each query as "CATEGORY: search query text"
4. Return queries as a JSON object with a "queries" array

Example output format:
{
  "queries": [
    "USER_PROFILE: user's programming language preferences",
    "CONVERSATION: previous discussions about databases"
  ]
}

Generate 0-5 relevant queries based on the conversation context. Only generate queries when they would genuinely help retrieve useful information.`;
  }
}
