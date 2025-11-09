/**
 * Builds the system prompt for query extraction.
 * This is domain-agnostic - it generates queries based on provided categories.
 */
export function queryExtractionSystemPrompt(categoryDescriptions: Record<string, string>): string {
  const categoriesText = Object.entries(categoryDescriptions)
    .map(([category, description]) => `- ${category}: ${description}`)
    .join('\n');

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
