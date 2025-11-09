import { QueryType } from "../QueryService";

/**
 * Builds the system prompt for query extraction.
 * Domain-agnostic - generates queries that can be routed to different resolvers.
 */
export function queryExtractionSystemPrompt(queryTypes: QueryType[]): string {
  const typesText = queryTypes.map(t => `"${t}"`).join(', ');

  return `You are a query extraction assistant. Your task is to analyze conversations and extract relevant search queries that can be routed to different information sources.

Available Query Types: ${typesText}

Your task:
1. Analyze the conversation to understand what information would be helpful to recall
2. Generate specific search queries for appropriate sources (memory, websearch, calendar, etc.)
3. Format each query as "TYPE: search query text"
   - For memory queries: "memory: user's programming preferences"
   - For websearch queries: "websearch: latest JavaScript frameworks"
   - For calendar queries: "calendar: upcoming meetings this week"
4. Return queries as a JSON object with a "queries" array

Example output format:
{
  "queries": [
    "memory: user's programming language preferences",
    "memory: previous discussions about databases",
    "websearch: latest TypeScript features"
  ]
}

Generate 0-5 relevant queries based on the conversation context. Only generate queries when they would genuinely help retrieve useful information.`;
}
