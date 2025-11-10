import * as fs from "fs";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";
import { VectorRecord, VectorSearchResult, VectorSearchOptions } from "../../models/VectorRecord";

interface VectorStorage {
  [id: string]: VectorRecord;
}

export class VectorStore {
  private filePath: string;

  constructor(filePath: string = "backend/data/vectors.json") {
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

  private async readStorage(): Promise<VectorStorage> {
    try {
      const data = fs.readFileSync(this.filePath, "utf8");
      return JSON.parse(data);
    } catch (error) {
      return {};
    }
  }

  private async writeStorage(storage: VectorStorage): Promise<void> {
    fs.writeFileSync(this.filePath, JSON.stringify(storage, null, 2));
  }

  async storeVector(record: Omit<VectorRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<VectorRecord> {
    const storage = await this.readStorage();
    const id = uuidv4();
    const now = new Date();

    const vectorRecord: VectorRecord = {
      ...record,
      id,
      createdAt: now,
      updatedAt: now,
    };

    storage[id] = vectorRecord;
    await this.writeStorage(storage);
    return vectorRecord;
  }

  async searchSimilar(queryVector: number[], options: VectorSearchOptions = {}): Promise<VectorSearchResult[]> {
    const { limit = 15, minScore = 0, sourceType } = options;
    const storage = await this.readStorage();
    let records = Object.values(storage);

    // Filter by sourceType if specified
    if (sourceType) {
      records = records.filter(record => record.sourceType === sourceType);
    }

    const scored = records.map(record => {
      const score = this.cosineSimilarity(queryVector, record.embedding);
      return { record, score };
    });

    return scored
      .filter(result => result.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async deleteVector(id: string): Promise<void> {
    const storage = await this.readStorage();
    if (storage[id]) {
      delete storage[id];
      await this.writeStorage(storage);
    }
  }

  async getVectorsBySource(sourceId: string, sourceType: string): Promise<VectorRecord[]> {
    const storage = await this.readStorage();
    return Object.values(storage).filter(
      record => record.sourceId === sourceId && record.sourceType === sourceType
    );
  }

  async getVectorsBySources(sourceIds: string[], sourceType: string): Promise<VectorRecord[]> {
    const storage = await this.readStorage();
    return Object.values(storage).filter(
      record => sourceIds.includes(record.sourceId) && record.sourceType === sourceType
    );
  }

  async updateVector(id: string, updates: Partial<Omit<VectorRecord, 'id' | 'createdAt' | 'updatedAt'>>): Promise<VectorRecord> {
    const storage = await this.readStorage();
    const existing = storage[id];
    if (!existing) {
      throw new Error("Vector not found");
    }

    const updated: VectorRecord = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };

    storage[id] = updated;
    await this.writeStorage(storage);
    return updated;
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

  fakeEmbed(text: string, dims: number): number[] {
    const vec = new Array(dims).fill(0);
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      vec[i % dims] += code / 255;
    }
    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
    return vec.map(v => v / norm);
  }
}