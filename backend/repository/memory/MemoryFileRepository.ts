import * as fs from "fs";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";
import { IMemoryRepository, MemoryCreateInput, MemoryUpdateInput } from "./IMemoryRepository";
import { MemoryRecord, SourceReference, MemoryCategory } from "../../models/Memory";


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

  async findMemoriesByCategory(category: MemoryCategory): Promise<MemoryRecord[]> {
    const storage = await this.readStorage();
    return Object.values(storage)
      .filter(r => r.category === category);
  }

  async getAllMemories(): Promise<MemoryRecord[]> {
    const storage = await this.readStorage();
    return Object.values(storage);
  }

  async getRecentMemories(limit: number = 50): Promise<MemoryRecord[]> {
    const storage = await this.readStorage();
    const records = Object.values(storage);

    records.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return records.slice(0, limit);
  }

  async findMemoriesByText(text: string, limit: number = 10): Promise<MemoryRecord[]> {
    const storage = await this.readStorage();
    const records = Object.values(storage);

    const query = text.toLowerCase();
    const filtered = records.filter(r =>
      r.title.toLowerCase().includes(query) || r.content.toLowerCase().includes(query)
    );

    filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return filtered.slice(0, limit);
  }




}
