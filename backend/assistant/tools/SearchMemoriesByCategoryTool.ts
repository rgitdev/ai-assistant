// backend/services/assistant/tools/SearchMemoriesByCategoryTool.ts
import { Tool } from '../ToolRegistry';
import { IMemoryRepository } from '../../repository/memory/IMemoryRepository';
import { MemoryCategory, MemoryRecord, parseMemoryCategory } from '@backend/models/Memory';

export class SearchMemoriesByCategoryTool implements Tool {
  name = "search_memories_by_category";
  description = "Search memories within a specific category. Categories: user_profile, conversation, task, preference, context, knowledge, relationship, goal, assistant_persona, other";
  
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
        description: "Optional search query within the category"
      },
      limit: {
        type: "number",
        description: "Maximum number of results (default: 5)",
        default: 5
      }
    },
    required: ["category"]
  };

  constructor(private memoryRepository: IMemoryRepository) {}

  async execute(args: { category: string; query?: string; limit?: number }): Promise<any> {
    const { category, query, limit = 5 } = args;
    
    const memoryCategory = parseMemoryCategory(category);
    
    let memories;
    if (query) {
      // Search within category
      const allMemories = await this.memoryRepository.findMemoriesByText(query, limit * 2);
      memories = allMemories
        .filter((m: MemoryRecord) => m.category === memoryCategory)
        .slice(0, limit);
    } else {
      // Get all memories in category
      memories = await this.memoryRepository.findMemoriesByCategory(memoryCategory);
      memories = memories.slice(0, limit);
    }
    
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