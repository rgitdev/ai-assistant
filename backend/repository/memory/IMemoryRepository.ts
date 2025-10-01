import { MemoryRecord, SourceReference, MemoryCategory } from "../../models/Memory";

export interface MemoryCreateInput {
  title: string;
  content: string;
  tags?: string[];
  importance?: 1 | 2 | 3 | 4 | 5;
  category?: MemoryCategory;
  sources?: SourceReference[];
  metadata?: Record<string, any>;
}

export interface MemoryUpdateInput {
  title?: string;
  content?: string;
  tags?: string[];
  importance?: 1 | 2 | 3 | 4 | 5;
  category?: MemoryCategory;
  sources?: SourceReference[];
  metadata?: Record<string, any>;
}



export interface IMemoryRepository {
  createMemory(memoryData: MemoryCreateInput): Promise<MemoryRecord>;
  getMemory(id: string): Promise<MemoryRecord | null>;
  updateMemory(id: string, updates: MemoryUpdateInput): Promise<MemoryRecord>;
  deleteMemory(id: string): Promise<void>;
  findMemoriesByMetadata(metadata: Record<string, any>): Promise<MemoryRecord[]>;
  findMemoryBySource(source: SourceReference): Promise<MemoryRecord[]>;
  findMemoriesByCategory(category: MemoryCategory): Promise<MemoryRecord[]>;
  getAllMemories(): Promise<MemoryRecord[]>;
  getRecentMemories(limit?: number): Promise<MemoryRecord[]>;
  findMemoriesByText(text: string, limit?: number): Promise<MemoryRecord[]>;
}
