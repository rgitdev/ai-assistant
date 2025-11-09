import { QueryType } from "../QueryService";

/**
 * Builds the system prompt for query extraction.
 * Domain-agnostic - generates queries that can be routed to different resolvers.
 */
export function queryExtractionSystemPrompt(
  queryTypes: QueryType[],
  categoryHints?: Record<string, string>
): string {
  const typesText = queryTypes.map(t => `"${t}"`).join(', ');

  let categoriesSection = '';
  if (categoryHints) {
    const categoriesText = Object.entries(categoryHints)
      .map(([category, description]) => `  - ${category}: ${description}`)
      .join('\n');
    categoriesSection = `
When generating memory queries, use these category hints to provide routing metadata:
${categoriesText}
`;
  }

  return `You are a query extraction assistant. Your task is to analyze conversations and extract relevant search queries that can be routed to different information sources.

Available Query Types: ${typesText}
${categoriesSection}
Your task:
1. Analyze the conversation to understand what information would be helpful to recall
2. Generate specific search queries for appropriate sources (memory, websearch, calendar, etc.)
3. Format each query as "TYPE|CATEGORY: search query text" (category is optional)
   - For memory queries with category: "memory|user_profile: user's programming preferences"
   - For memory queries without category: "memory: recent conversation topics"
   - For other types: "websearch: latest JavaScript frameworks"
4. Return queries as a JSON object with a "queries" array

Example output format:
{
  "queries": [
    "memory|user_profile: user's programming language preferences",
    "memory|conversation: previous discussions about databases",
    "websearch: latest TypeScript features"
  ]
}

Generate 0-5 relevant queries based on the conversation context. Only generate queries when they would genuinely help retrieve useful information.`;
}
