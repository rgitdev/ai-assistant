import { IConversationRepository } from "./IConversationRepository";
import { ConversationFileRepository } from "./ConversationFileRepository";
import { ConversationDatabaseRepository } from "./ConversationDatabaseRepository";

export type RepositoryType = "file" | "database";

export class ConversationRepositoryFactory {
  public static readonly FILE = "file";
  public static readonly DATABASE = "database";
  public static readonly DEFAULT_TYPE: RepositoryType = "file";

  private repositoryType: RepositoryType = ConversationRepositoryFactory.DEFAULT_TYPE;
  private filePathParam?: string;
  private dbPathParam?: string;

  /**
   * Sets the repository type to use
   * @param type The repository type ("file" or "database")
   * @returns The factory instance for method chaining
   */
  type(type: RepositoryType): ConversationRepositoryFactory {
    this.repositoryType = type;
    return this;
  }

  /**
   * Sets the file path for file-based repository
   * @param filePath Path to the JSON file for conversation storage
   * @returns The factory instance for method chaining
   */
  filePath(filePath: string): ConversationRepositoryFactory {
    this.filePathParam = filePath;
    return this;
  }

  /**
   * Sets the database path for SQLite database repository
   * @param dbPath Path to the SQLite database file
   * @returns The factory instance for method chaining
   */
  dbPath(dbPath: string): ConversationRepositoryFactory {
    this.dbPathParam = dbPath;
    return this;
  }

  /**
   * Builds and returns the configured repository instance
   * @returns An instance of IConversationRepository
   */
  build(): IConversationRepository {
    switch (this.repositoryType) {
      case "file":
        return new ConversationFileRepository(this.filePathParam);
      case "database":
        return new ConversationDatabaseRepository(this.dbPathParam);
      default:
        throw new Error(`Unknown repository type: ${this.repositoryType}`);
    }
  }
}