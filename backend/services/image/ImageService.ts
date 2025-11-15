import { IImageRepository, ImageMetadata } from "@backend/repository/image/IImageRepository";

/**
 * ImageService handles all image-related operations including:
 * - Saving and retrieving images
 * - Converting images for OpenAI API consumption
 * - Getting image metadata
 * - Managing image lifecycle
 *
 * This service follows the same pattern as ConversationService and AssistantService,
 * providing a clean abstraction over image operations.
 */
export class ImageService {
  private imageRepository: IImageRepository;

  constructor(imageRepository: IImageRepository) {
    this.imageRepository = imageRepository;
  }

  /**
   * Save images for a message and return their IDs.
   * This is called when a user sends a new message with images.
   *
   * @param conversationId - The conversation ID
   * @param messageId - The message ID
   * @param images - Array of File or Blob objects
   * @returns Array of image IDs
   */
  async saveImagesForMessage(
    conversationId: string,
    messageId: string,
    images: File[] | Blob[]
  ): Promise<string[]> {
    const imageIds: string[] = [];

    for (const image of images) {
      const arrayBuffer = await image.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const metadata = await this.imageRepository.saveImage(
        conversationId,
        messageId,
        buffer,
        image.type,
        'name' in image ? image.name : undefined
      );
      imageIds.push(metadata.id);
    }

    return imageIds;
  }

  /**
   * Convert File/Blob images to base64 format for OpenAI API.
   * Used when sending new images with the current message.
   *
   * @param images - Array of File or Blob objects
   * @returns Array of image content objects in OpenAI format
   */
  async convertImagesToBase64(images: File[] | Blob[]): Promise<Array<{
    type: "image_url";
    image_url: { url: string };
  }>> {
    return Promise.all(
      images.map(async (image) => {
        const arrayBuffer = await image.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const mimeType = image.type || 'image/jpeg';
        return {
          type: "image_url" as const,
          image_url: { url: `data:${mimeType};base64,${base64}` }
        };
      })
    );
  }

  /**
   * Get images by their IDs and convert to base64 for OpenAI.
   * CRITICAL for analyzing historical images - allows the LLM to see images
   * from previous messages in the conversation.
   *
   * @param imageIds - Array of image IDs
   * @returns Array of image content objects in OpenAI format
   * @throws Error if any image is not found
   */
  async getImagesAsBase64(imageIds: string[]): Promise<Array<{
    type: "image_url";
    image_url: { url: string };
  }>> {
    const imageContents = await Promise.all(
      imageIds.map(async (imageId) => {
        const buffer = await this.imageRepository.getImage(imageId);
        const metadata = await this.imageRepository.getImageMetadata(imageId);

        if (!buffer || !metadata) {
          throw new Error(`Image not found: ${imageId}`);
        }

        const base64 = buffer.toString('base64');
        return {
          type: "image_url" as const,
          image_url: { url: `data:${metadata.mimeType};base64,${base64}` }
        };
      })
    );
    return imageContents;
  }

  /**
   * Get image metadata for a specific image.
   * Useful for displaying image information without loading the full image.
   *
   * @param imageId - The image ID
   * @returns Image metadata or null if not found
   */
  async getImageMetadata(imageId: string): Promise<ImageMetadata | null> {
    return await this.imageRepository.getImageMetadata(imageId);
  }

  /**
   * Get all images for a conversation.
   *
   * @param conversationId - The conversation ID
   * @returns Array of image metadata
   */
  async getImagesByConversation(conversationId: string): Promise<ImageMetadata[]> {
    return await this.imageRepository.getImagesByConversation(conversationId);
  }

  /**
   * Get all images for a specific message.
   *
   * @param messageId - The message ID
   * @returns Array of image metadata
   */
  async getImagesByMessage(messageId: string): Promise<ImageMetadata[]> {
    return await this.imageRepository.getImagesByMessage(messageId);
  }

  /**
   * Delete an image by ID.
   *
   * @param imageId - The image ID
   */
  async deleteImage(imageId: string): Promise<void> {
    await this.imageRepository.deleteImage(imageId);
  }

  /**
   * Clean up all images for a conversation.
   * Should be called when a conversation is deleted.
   *
   * @param conversationId - The conversation ID
   */
  async deleteImagesByConversation(conversationId: string): Promise<void> {
    await this.imageRepository.deleteImagesByConversation(conversationId);
  }
}
