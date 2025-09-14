export interface MemoryRecord {
  id: string; // Unique identifier (UUID)
  title: string; // Human-readable title/summary
  content: string; // Main memory content
  createdAt: Date; // Creation timestamp
  updatedAt: Date; // Last modification timestamp
  tags?: string[]; // Optional categorical tags
  importance: 1 | 2 | 3 | 4 | 5; // Priority/importance level

  // Source tracking
  sources: SourceReference[]; // Array of source references

  // Vector search support
  embedding?: number[]; // Vector embedding for semantic search
  embeddingModel?: string; // Model used for embedding (e.g., "text-embedding-ada-002")

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
