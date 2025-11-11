// backend/services/assistant/tools/SearchMemoriesByCategoryTool.ts
import { Tool } from '../ToolRegistry';
import { MemorySearchService } from '@backend/services/memory/MemorySearchService';
import { MemoryCategory, MemoryRecord, parseMemoryCategory } from '@backend/models/Memory';

export class SearchMemoriesByCategoryTool implements Tool {
  name = "search_memories_by_category";
  description = "Search memories within a specific category using semantic search. Categories: user_profile, conversation, task, preference, context, knowledge, relationship, goal, assistant_persona, other";

  parameters = {
    type: "object",
    properties: {
      category: {
        type: "string",
        description: "The memory category to search within",
        enum: Object.values(MemoryCategory)
      },
      query: {
        type: "string",
        description: "Search query within the category (required for semantic search)"
      },
      limit: {
        type: "number",
        description: "Maximum number of results (default: 5)",
        default: 5
      }
    },
    required: ["category", "query"]
  };

  constructor(private memorySearchService: MemorySearchService) {}

  async execute(args: { category: string; query: string; limit?: number }): Promise<any> {
    const { category, query, limit = 5 } = args;

    const memoryCategory = parseMemoryCategory(category);

    // Use semantic search within category
    const memories = await this.memorySearchService.searchMemoriesByCategory(
      memoryCategory,
      query,
      { topK: limit }
    );

    return {
      category: memoryCategory,
      count: memories.length,
      memories: memories.map((m: MemoryRecord) => ({
        id: m.id,
        title: m.title,
        content: m.content,
        importance: m.importance,
        createdAt: m.createdAt
      }))
    };
  }
}