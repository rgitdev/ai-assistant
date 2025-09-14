import * as fs from "fs";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";
import { IMemoryRepository, MemoryCreateInput, MemoryListFilters, MemorySearchOptions, MemoryUpdateInput } from "./IMemoryRepository";
import { MemoryRecord, SourceReference } from "../../models/Memory";


interface MemoryStorage {
  [id: string]: MemoryRecord;
}

export class MemoryFileRepository implements IMemoryRepository {
  private filePath: string;

  constructor(filePath: string = "backend/data/memories.json") {
    this.filePath = filePath;
    this.ensureFileExists();
  }

  private ensureFileExists(): void {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify({}));
    }
  }

  private async readStorage(): Promise<MemoryStorage> {
    try {
      const data = fs.readFileSync(this.filePath, "utf8");
      return JSON.parse(data);
    } catch (error) {
      return {};
    }
  }

  private async writeStorage(storage: MemoryStorage): Promise<void> {
    fs.writeFileSync(this.filePath, JSON.stringify(storage, null, 2));
  }

  async createMemory(memoryData: MemoryCreateInput): Promise<MemoryRecord> {
    const storage = await this.readStorage();
    const id = uuidv4();
    const now = new Date();

    const record: MemoryRecord = {
      id,
      title: memoryData.title,
      content: memoryData.content,
      createdAt: now,
      updatedAt: now,
      tags: memoryData.tags || [],
      importance: memoryData.importance ?? 3,
      sources: memoryData.sources || [],
      embedding: memoryData.embedding,
      embeddingModel: memoryData.embeddingModel,
      metadata: memoryData.metadata,
    };

    storage[id] = record;
    await this.writeStorage(storage);
    return record;
  }

  async getMemory(id: string): Promise<MemoryRecord | null> {
    const storage = await this.readStorage();
    return storage[id] || null;
  }

  async updateMemory(id: string, updates: MemoryUpdateInput): Promise<MemoryRecord> {
    const storage = await this.readStorage();
    const existing = storage[id];
    if (!existing) {
      throw new Error("Memory not found");
    }

    const updated: MemoryRecord = {
      ...existing,
      ...updates,
      tags: updates.tags ?? existing.tags,
      importance: updates.importance ?? existing.importance,
      sources: updates.sources ?? existing.sources,
      embedding: updates.embedding ?? existing.embedding,
      embeddingModel: updates.embeddingModel ?? existing.embeddingModel,
      metadata: updates.metadata ?? existing.metadata,
      updatedAt: new Date(),
    };

    storage[id] = updated;
    await this.writeStorage(storage);
    return updated;
  }

  async deleteMemory(id: string): Promise<void> {
    const storage = await this.readStorage();
    if (storage[id]) {
      delete storage[id];
      await this.writeStorage(storage);
    }
  }

  async findMemoriesByMetadata(metadata: Record<string, any>): Promise<MemoryRecord[]> {
    const storage = await this.readStorage();
    return Object.values(storage)
    .filter( r=> r.sources.some(s => s.type === "chat"))
    .filter(r => r.metadata?.systemPrompt === metadata.systemPrompt);
  }

  async findMemoryBySource(source: SourceReference): Promise<MemoryRecord[]> {
    const storage = await this.readStorage();
    return Object.values(storage)
    .filter(r => r.sources.some(
      s => s.reference === source.reference && s.type === source.type));
  }

  async listMemories(filters?: MemoryListFilters, pagination?: { offset?: number; limit?: number; sortBy?: "createdAt" | "updatedAt" | "importance"; sortOrder?: "asc" | "desc"; }): Promise<MemoryRecord[]> {
    const storage = await this.readStorage();
    let records = Object.values(storage);

    // Filtering
    if (filters) {
      const { tagsAny, tagsAll, importanceMin, importanceMax, text, createdAfter, createdBefore } = filters;

      if (tagsAny && tagsAny.length > 0) {
        records = records.filter(r => r.tags?.some(t => tagsAny.includes(t)));
      }
      if (tagsAll && tagsAll.length > 0) {
        records = records.filter(r => tagsAll.every(t => r.tags?.includes(t)));
      }
      if (importanceMin) {
        records = records.filter(r => r.importance >= importanceMin);
      }
      if (importanceMax) {
        records = records.filter(r => r.importance <= importanceMax);
      }
      if (text && text.trim().length > 0) {
        const q = text.toLowerCase();
        records = records.filter(r =>
          r.title.toLowerCase().includes(q) || r.content.toLowerCase().includes(q)
        );
      }
      if (createdAfter) {
        records = records.filter(r => new Date(r.createdAt) >= createdAfter);
      }
      if (createdBefore) {
        records = records.filter(r => new Date(r.createdAt) <= createdBefore);
      }
    }

    // Sorting
    const { sortBy = "updatedAt", sortOrder = "desc", offset = 0, limit = 50 } = pagination || {};
    records.sort((a, b) => {
      let av: number;
      let bv: number;
      if (sortBy === "importance") {
        av = a.importance;
        bv = b.importance;
      } else {
        const ad = new Date(a[sortBy] as Date);
        const bd = new Date(b[sortBy] as Date);
        av = ad.getTime();
        bv = bd.getTime();
      }
      return sortOrder === "asc" ? av - bv : bv - av;
    });

    // Pagination
    return records.slice(offset, offset + limit);
  }

  async searchMemories(query: string, options?: MemorySearchOptions): Promise<MemoryRecord[]> {
    const storage = await this.readStorage();
    const records = Object.values(storage);

    const topK = options?.topK ?? 10;
    const minScore = options?.minScore ?? 0;

    // Simple semantic-ish scoring using cosine similarity if embeddings exist; otherwise fallback to text match score
    const scored = records.map(r => {
      let score = 0;
      if (r.embedding && Array.isArray(r.embedding) && r.embedding.length > 0) {
        // naive: embed query by averaging char codes (fallback). Real embedding handled outside and saved.
        const qVec = this.fakeEmbed(query, r.embedding.length);
        score = this.cosineSimilarity(qVec, r.embedding);
      } else {
        // Fallback to keyword overlap
        const q = query.toLowerCase();
        const titleHits = (r.title.toLowerCase().match(new RegExp(this.escapeRegex(q), "g")) || []).length;
        const contentHits = (r.content.toLowerCase().match(new RegExp(this.escapeRegex(q), "g")) || []).length;
        score = Math.min(1, (titleHits * 2 + contentHits) / 10);
      }
      return { record: r, score };
    });

    return scored
      .filter(s => s.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(s => s.record);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const len = Math.min(a.length, b.length);
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < len; i++) {
      dot += a[i] * b[i];
      na += a[i] * a[i];
      nb += b[i] * b[i];
    }
    if (na === 0 || nb === 0) return 0;
    return dot / (Math.sqrt(na) * Math.sqrt(nb));
  }

  private fakeEmbed(text: string, dims: number): number[] {
    // Deterministic pseudo-embedding to allow basic similarity if embeddings are missing
    const vec = new Array(dims).fill(0);
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      vec[i % dims] += code / 255;
    }
    // Normalize
    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
    return vec.map(v => v / norm);
  }

  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
