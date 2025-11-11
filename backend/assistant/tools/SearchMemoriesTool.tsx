// backend/services/assistant/tools/SearchMemoriesTool.ts
import { Tool } from '../ToolRegistry';
import { MemorySearchService } from '@backend/services/memory/MemorySearchService';

export class SearchMemoriesTool implements Tool {
  name = "search_memories";
  description = "Search through stored memories using semantic search. Returns relevant memories matching the query.";

  parameters = {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "The search query to find relevant memories"
      },
      limit: {
        type: "number",
        description: "Maximum number of results to return (default: 5)",
        default: 5
      }
    },
    required: ["query"]
  };

  constructor(private memorySearchService: MemorySearchService) {}

  async execute(args: { query: string; limit?: number }): Promise<any> {
    const { query, limit = 5 } = args;

    const memories = await this.memorySearchService.searchMemories(query, { topK: limit });

    return {
      count: memories.length,
      memories: memories.map(m => ({
        id: m.id,
        title: m.title,
        content: m.content,
        category: m.category,
        importance: m.importance,
        createdAt: m.createdAt
      }))
    };
  }
}
