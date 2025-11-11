import { MemorySearchService } from "../../services/memory/MemorySearchService";

export const searchMemoriesDefinition = {
  name: "search_memories",
  description: "Search through memories using semantic search. Returns relevant memory records.",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "The search query to find relevant memories",
      },
      topK: {
        type: "number",
        description: "Maximum number of results to return (default: 10)",
      },
    },
    required: ["query"],
  },
};

export interface SearchMemoriesServices {
  memorySearchService: MemorySearchService;
}

export async function searchMemoriesHandler(
  args: any,
  services: SearchMemoriesServices
) {
  const { query, topK = 10 } = args as { query: string; topK?: number };
  const memories = await services.memorySearchService.searchMemories(query, { topK });

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(memories, null, 2),
      },
    ],
  };
}
