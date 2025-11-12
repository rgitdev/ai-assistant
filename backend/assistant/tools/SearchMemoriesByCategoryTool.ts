// backend/services/assistant/tools/SearchMemoriesByCategoryTool.ts
import { Tool } from '../ToolRegistry';
import { MemorySearchService } from '@backend/services/memory/MemorySearchService';
import { MemoryCategory, MemoryRecord, parseMemoryCategory, MEMORY_CATEGORY_DESCRIPTIONS } from '@backend/models/Memory';

export class SearchMemoriesByCategoryTool implements Tool {
  name = "search_memories_by_category";
  description = `Search memories within a specific category using semantic search. Choose the most relevant category based on what you're looking for:

- user_profile: ${MEMORY_CATEGORY_DESCRIPTIONS[MemoryCategory.USER_PROFILE]}
- conversation: ${MEMORY_CATEGORY_DESCRIPTIONS[MemoryCategory.CONVERSATION]}
- task: ${MEMORY_CATEGORY_DESCRIPTIONS[MemoryCategory.TASK]}
- preference: ${MEMORY_CATEGORY_DESCRIPTIONS[MemoryCategory.PREFERENCE]}
- context: ${MEMORY_CATEGORY_DESCRIPTIONS[MemoryCategory.CONTEXT]}
- knowledge: ${MEMORY_CATEGORY_DESCRIPTIONS[MemoryCategory.KNOWLEDGE]}
- relationship: ${MEMORY_CATEGORY_DESCRIPTIONS[MemoryCategory.RELATIONSHIP]}
- goal: ${MEMORY_CATEGORY_DESCRIPTIONS[MemoryCategory.GOAL]}
- assistant_persona: ${MEMORY_CATEGORY_DESCRIPTIONS[MemoryCategory.ASSISTANT_PERSONA]}
- other: ${MEMORY_CATEGORY_DESCRIPTIONS[MemoryCategory.OTHER]}

Note: Programming languages, technical skills, and similar traits are part of user_profile. User preferences like communication style or settings are in preference.`;

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
        category: m.category,
        importance: m.importance,
        createdAt: m.createdAt
      }))
    };
  }
}