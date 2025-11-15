import { IImageRepository } from "./IImageRepository";
import { ImageFileRepository } from "./ImageFileRepository";

export type ImageRepositoryType = "file"; // Future: | "database"

export class ImageRepositoryFactory {
  public static readonly FILE: ImageRepositoryType = "file";
  public static readonly DEFAULT_TYPE: ImageRepositoryType = "file";

  private repositoryType: ImageRepositoryType = ImageRepositoryFactory.DEFAULT_TYPE;
  private imageDirParam?: string;
  private metadataPathParam?: string;

  type(type: ImageRepositoryType): ImageRepositoryFactory {
    this.repositoryType = type;
    return this;
  }

  imageDir(imageDir: string): ImageRepositoryFactory {
    this.imageDirParam = imageDir;
    return this;
  }

  metadataPath(metadataPath: string): ImageRepositoryFactory {
    this.metadataPathParam = metadataPath;
    return this;
  }

  build(): IImageRepository {
    switch (this.repositoryType) {
      case "file":
        const defaultImageDir = this.imageDirParam || "backend/data/images";
        const defaultMetadataPath = this.metadataPathParam || "backend/data/images/metadata.json";
        const testImageDir = process.env.IMAGE_TEST_DIR || defaultImageDir;
        const testMetadataPath = process.env.IMAGE_TEST_METADATA || defaultMetadataPath;
        return new ImageFileRepository(testImageDir, testMetadataPath);
      default:
        throw new Error(`Unknown repository type: ${this.repositoryType}`);
    }
  }
}
