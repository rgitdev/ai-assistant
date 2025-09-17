import { MemoryRecord, SourceReference, MemoryCategory } from "../../models/Memory";

export interface MemoryCreateInput {
  title: string;
  content: string;
  tags?: string[];
  importance?: 1 | 2 | 3 | 4 | 5;
  category?: MemoryCategory;
  sources?: SourceReference[];
  embedding?: number[];
  embeddingModel?: string;
  metadata?: Record<string, any>;
}

export interface MemoryUpdateInput {
  title?: string;
  content?: string;
  tags?: string[];
  importance?: 1 | 2 | 3 | 4 | 5;
  category?: MemoryCategory;
  sources?: SourceReference[];
  embedding?: number[];
  embeddingModel?: string;
  metadata?: Record<string, any>;
}

export interface MemoryListFilters {
  tagsAny?: string[];
  tagsAll?: string[];
  importanceMin?: 1 | 2 | 3 | 4 | 5;
  importanceMax?: 1 | 2 | 3 | 4 | 5;
  text?: string; // substring match in title/content
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface PaginationOptions {
  offset?: number; // default 0
  limit?: number;  // default 50
  sortBy?: "createdAt" | "updatedAt" | "importance";
  sortOrder?: "asc" | "desc";
}

export interface MemorySearchOptions {
  topK?: number; // default 10
  minScore?: number; // default 0
  useEmbeddings?: boolean; // default true if provider available
  filters?: MemoryListFilters;
}

export interface EmbeddingProvider {
  createEmbedding(text: string): Promise<number[]>;
  getModel(): string;
}

export interface IMemoryRepository {
  createMemory(memoryData: MemoryCreateInput): Promise<MemoryRecord>;
  getMemory(id: string): Promise<MemoryRecord | null>;
  updateMemory(id: string, updates: MemoryUpdateInput): Promise<MemoryRecord>;
  deleteMemory(id: string): Promise<void>;
  findMemoriesByMetadata(metadata: Record<string, any>): Promise<MemoryRecord[]>;
  findMemoryBySource(source: SourceReference): Promise<MemoryRecord[]>;
  listMemories(filters?: MemoryListFilters, pagination?: PaginationOptions): Promise<MemoryRecord[]>;
  searchMemories(query: string, options?: MemorySearchOptions): Promise<MemoryRecord[]>;
  searchMemoriesByCategory(category: MemoryCategory, query: string, options?: MemorySearchOptions): Promise<MemoryRecord[]>;
}
