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
