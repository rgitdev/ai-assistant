export enum MemoryCategory {
  ASSISTANT_PERSONA = 'assistant_persona',
  USER_PROFILE = 'user_profile',
  CONVERSATION = 'conversation',
  TASK = 'task',
  PREFERENCE = 'preference',
  CONTEXT = 'context',
  KNOWLEDGE = 'knowledge',
  RELATIONSHIP = 'relationship',
  GOAL = 'goal',
  OTHER = 'other'
}

/**
 * Descriptions for each memory category, used for query generation and documentation.
 * Kept together with MemoryCategory enum following "Keep related data together" principle.
 */
export const MEMORY_CATEGORY_DESCRIPTIONS: Record<MemoryCategory, string> = {
  [MemoryCategory.ASSISTANT_PERSONA]: 'Personal information, characteristics, preferences, and biographical details about the assistant',
  [MemoryCategory.USER_PROFILE]: 'Personal information, characteristics, preferences, and biographical details about the user',
  [MemoryCategory.CONVERSATION]: 'Past discussions, dialogue history, and conversational context between user and assistant',
  [MemoryCategory.TASK]: 'Work items, projects, assignments, and task-related information including progress and outcomes',
  [MemoryCategory.PREFERENCE]: 'User choices, settings, likes/dislikes, and behavioral preferences across different contexts',
  [MemoryCategory.CONTEXT]: 'Environmental information, situational details, and contextual background for interactions',
  [MemoryCategory.KNOWLEDGE]: 'Facts, learned information, domain expertise, and educational content shared or discussed',
  [MemoryCategory.RELATIONSHIP]: 'Connections between people, entities, or concepts; interpersonal dynamics and associations',
  [MemoryCategory.GOAL]: 'Objectives, targets, aspirations, and desired outcomes expressed by the user',
  [MemoryCategory.OTHER]: 'Miscellaneous information that doesn\'t fit into other specific categories'
};

/**
 * Parses a string to MemoryCategory enum with case-insensitive lookup
 * @param categoryString The category string to parse
 * @returns The corresponding MemoryCategory enum value or OTHER if not found
 */
export function parseMemoryCategory(categoryString: string): MemoryCategory {
  const categoryMap = new Map<string, MemoryCategory>();
  Object.values(MemoryCategory).forEach(category => {
    categoryMap.set(category.toLowerCase(), category);
  });

  return categoryMap.get(categoryString.toLowerCase()) || MemoryCategory.OTHER;
}

export interface MemoryRecord {
  id: string; // Unique identifier (UUID)
  title: string; // Human-readable title/summary
  content: string; // Main memory content
  createdAt: Date; // Creation timestamp
  updatedAt: Date; // Last modification timestamp
  tags?: string[]; // Optional categorical tags
  importance: 1 | 2 | 3 | 4 | 5; // Priority/importance level
  category?: MemoryCategory; // Optional category classification

  // Source tracking
  sources: SourceReference[]; // Array of source references

  // Metadata
  metadata?: Record<string, any>; // Flexible metadata storage
}

export interface SourceReference {
  type: 'chat' | 'document' | 'url' | 'file' | 'api' | 'user_input' | 'other';
  reference: string; // URL, file path, chat ID, etc.
  title?: string; // Display name for the source
  excerpt?: string; // Relevant excerpt from source
  timestamp?: Date; // When this source was referenced
  confidence?: number; // Confidence in source reliability (0-1)
}
