export interface VectorRecord {
  id: string;
  embedding: number[];
  embeddingModel: string;
  sourceId: string;
  sourceType: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface VectorSearchResult {
  record: VectorRecord;
  score: number;
}

export interface VectorSearchOptions {
  limit?: number;
  minScore?: number;
}