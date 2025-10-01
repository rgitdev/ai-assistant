import { IMemoryRepository } from "./IMemoryRepository";
import { MemoryFileRepository } from "./MemoryFileRepository";

export type MemoryRepositoryType = "file"; // Future: | "database"

export class MemoryRepositoryFactory {
  public static readonly FILE: MemoryRepositoryType = "file";
  public static readonly DEFAULT_TYPE: MemoryRepositoryType = "file";

  private repositoryType: MemoryRepositoryType = MemoryRepositoryFactory.DEFAULT_TYPE;
  private filePathParam?: string;

  type(type: MemoryRepositoryType): MemoryRepositoryFactory {
    this.repositoryType = type;
    return this;
  }

  filePath(filePath: string): MemoryRepositoryFactory {
    this.filePathParam = filePath;
    return this;
  }

  build(): IMemoryRepository {
    switch (this.repositoryType) {
      case "file":
        // Use environment variable for test file path, fallback to default
        const defaultPath = this.filePathParam || "backend/data/memories.json";
        const testPath = process.env.MEMORY_TEST_FILE || defaultPath;
        return new MemoryFileRepository(testPath);
      default:
        throw new Error(`Unknown repository type: ${this.repositoryType}`);
    }
  }
}
