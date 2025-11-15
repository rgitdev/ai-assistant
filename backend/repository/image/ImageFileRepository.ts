import { IImageRepository, ImageMetadata } from "./IImageRepository";
import * as fs from "fs";
import * as path from "path";
import { v4 as uuidv4 } from 'uuid';

interface ImageStorage {
  [imageId: string]: ImageMetadata;
}

export class ImageFileRepository implements IImageRepository {
  private imageDir: string;
  private metadataPath: string;

  constructor(
    imageDir: string = "backend/data/images",
    metadataPath: string = "backend/data/images/metadata.json"
  ) {
    this.imageDir = imageDir;
    this.metadataPath = metadataPath;
    this.ensureDirectoryExists();
  }

  private ensureDirectoryExists(): void {
    if (!fs.existsSync(this.imageDir)) {
      fs.mkdirSync(this.imageDir, { recursive: true });
    }
    if (!fs.existsSync(this.metadataPath)) {
      fs.writeFileSync(this.metadataPath, JSON.stringify({}));
    }
  }

  private async readMetadata(): Promise<ImageStorage> {
    try {
      const data = fs.readFileSync(this.metadataPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return {};
    }
  }

  private async writeMetadata(storage: ImageStorage): Promise<void> {
    fs.writeFileSync(this.metadataPath, JSON.stringify(storage, null, 2));
  }

  private getImagePath(imageId: string): string {
    return path.join(this.imageDir, imageId);
  }

  async saveImage(
    conversationId: string,
    messageId: string,
    imageData: Buffer,
    mimeType: string,
    originalFilename?: string
  ): Promise<ImageMetadata> {
    const imageId = uuidv4();
    const imagePath = this.getImagePath(imageId);

    // Save image file
    fs.writeFileSync(imagePath, imageData);

    // Create metadata
    const metadata: ImageMetadata = {
      id: imageId,
      conversationId,
      messageId,
      filename: originalFilename || `image-${imageId}`,
      mimeType,
      size: imageData.length,
      createdAt: new Date().toISOString()
    };

    // Save metadata
    const storage = await this.readMetadata();
    storage[imageId] = metadata;
    await this.writeMetadata(storage);

    return metadata;
  }

  async getImage(imageId: string): Promise<Buffer | null> {
    const imagePath = this.getImagePath(imageId);

    if (!fs.existsSync(imagePath)) {
      return null;
    }

    return fs.readFileSync(imagePath);
  }

  async getImageMetadata(imageId: string): Promise<ImageMetadata | null> {
    const storage = await this.readMetadata();
    return storage[imageId] || null;
  }

  async getImagesByConversation(conversationId: string): Promise<ImageMetadata[]> {
    const storage = await this.readMetadata();
    return Object.values(storage).filter(
      metadata => metadata.conversationId === conversationId
    );
  }

  async getImagesByMessage(messageId: string): Promise<ImageMetadata[]> {
    const storage = await this.readMetadata();
    return Object.values(storage).filter(
      metadata => metadata.messageId === messageId
    );
  }

  async deleteImage(imageId: string): Promise<void> {
    const imagePath = this.getImagePath(imageId);

    // Delete image file
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    // Delete metadata
    const storage = await this.readMetadata();
    delete storage[imageId];
    await this.writeMetadata(storage);
  }

  async deleteImagesByConversation(conversationId: string): Promise<void> {
    const images = await this.getImagesByConversation(conversationId);

    for (const image of images) {
      await this.deleteImage(image.id);
    }
  }
}
