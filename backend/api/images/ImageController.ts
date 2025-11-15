import { ServiceContainer } from "@backend/di/ServiceContainer";
import { IImageRepository } from "@backend/repository/image/IImageRepository";

export class ImageController {
  private imageRepository: IImageRepository;

  constructor() {
    this.imageRepository = ServiceContainer.get<IImageRepository>('ImageRepository');
  }

  /**
   * GET /api/images/:imageId - Get image file
   * Returns the image file with proper content-type header
   */
  async getImage(imageId: string): Promise<{ data: Buffer; mimeType: string } | null> {
    // Get image metadata to determine content type
    const metadata = await this.imageRepository.getImageMetadata(imageId);

    if (!metadata) {
      return null;
    }

    // Get image data
    const imageData = await this.imageRepository.getImage(imageId);

    if (!imageData) {
      return null;
    }

    return {
      data: imageData,
      mimeType: metadata.mimeType
    };
  }

  /**
   * GET /api/images/:imageId/metadata - Get image metadata
   * Returns metadata (filename, size, etc.) without the actual image data
   */
  async getImageMetadata(imageId: string) {
    const metadata = await this.imageRepository.getImageMetadata(imageId);

    if (!metadata) {
      return null;
    }

    return metadata;
  }
}
