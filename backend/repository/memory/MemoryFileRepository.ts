import * as fs from "fs";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";
import { IMemoryRepository, MemoryCreateInput, MemoryListFilters, MemorySearchOptions, MemoryUpdateInput } from "./IMemoryRepository";
import { MemoryRecord, SourceReference, MemoryCategory } from "../../models/Memory";
import { VectorStore } from "../../client/vector/VectorStore";


interface MemoryStorage {
  [id: string]: MemoryRecord;
}

export class MemoryFileRepository implements IMemoryRepository {
  private filePath: string;
  private vectorStore: VectorStore;

  constructor(filePath: string = "backend/data/memories.json", vectorStore?: VectorStore) {
    this.filePath = filePath;
    this.vectorStore = vectorStore || new VectorStore();
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
      category: memoryData.category,
      sources: memoryData.sources || [],
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

    // Try vector search first by checking if any vectors exist for memory records
    const vectorResults = await this.vectorStore.searchSimilar(
      this.vectorStore.fakeEmbed(query, 1536), // Use standard embedding dimension
      topK,
      minScore
    );

    if (vectorResults.length > 0) {
      // Return memories that have corresponding vectors
      const memoryIds = vectorResults
        .filter(result => result.record.sourceType === "Memory")
        .map(result => result.record.sourceId);

      return records.filter(record => memoryIds.includes(record.id));
    }

    // Fallback to text-based search if no vectors found
    const scored = records.map(r => {
      const score = this.calculateTextMatchScore(query, r.title, r.content);
      return { record: r, score };
    });

    return scored
      .filter(s => s.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(s => s.record);
  }


  async searchMemoriesByCategory(category: MemoryCategory, query: string, options?: MemorySearchOptions): Promise<MemoryRecord[]> {
    const storage = await this.readStorage();
    const records = Object.values(storage);

    // First filter by category
    const categoryRecords = records.filter(r => r.category === category);

    const topK = options?.topK ?? 10;
    const minScore = options?.minScore ?? 0;

    // Try vector search first
    const vectorResults = await this.vectorStore.searchSimilar(
      this.vectorStore.fakeEmbed(query, 1536),
      topK,
      minScore
    );

    if (vectorResults.length > 0) {
      const memoryIds = vectorResults
        .filter(result => result.record.sourceType === "Memory")
        .map(result => result.record.sourceId);

      return categoryRecords.filter(record => memoryIds.includes(record.id));
    }

    // Fallback to text-based scoring
    const scored = categoryRecords.map(r => {
      const score = this.calculateTextMatchScore(query, r.title, r.content);
      return { record: r, score };
    });

    return scored
      .filter(s => s.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(s => s.record);
  }

  private calculateTextMatchScore(query: string, title: string, content: string): number {
    const q = query.toLowerCase();
    const titleLower = title.toLowerCase();
    const contentLower = content.toLowerCase();

    // Calculate keyword overlap scores
    const titleHits = this.countKeywordMatches(q, titleLower);
    const contentHits = this.countKeywordMatches(q, contentLower);

    // Weight title matches more heavily than content matches
    const titleScore = Math.min(1, titleHits * 3 / 10);
    const contentScore = Math.min(1, contentHits / 10);

    // Combine scores with title having higher weight
    return Math.min(1, titleScore + contentScore * 0.7);
  }

  private countKeywordMatches(query: string, text: string): number {
    const queryWords = query.split(/\s+/).filter(w => w.length > 0);
    let totalMatches = 0;

    for (const word of queryWords) {
      const escapedWord = this.escapeRegex(word);
      const matches = (text.match(new RegExp(escapedWord, "g")) || []).length;
      totalMatches += matches;
    }

    return totalMatches;
  }

  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
