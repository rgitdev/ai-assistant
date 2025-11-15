export interface ImageMetadata {
  id: string;
  conversationId: string;
  messageId: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export interface IImageRepository {
  /**
   * Save an image file and return its metadata
   */
  saveImage(
    conversationId: string,
    messageId: string,
    imageData: Buffer,
    mimeType: string,
    originalFilename?: string
  ): Promise<ImageMetadata>;

  /**
   * Get image data by image ID
   */
  getImage(imageId: string): Promise<Buffer | null>;

  /**
   * Get all images for a conversation
   */
  getImagesByConversation(conversationId: string): Promise<ImageMetadata[]>;

  /**
   * Get all images for a specific message
   */
  getImagesByMessage(messageId: string): Promise<ImageMetadata[]>;

  /**
   * Delete an image by ID
   */
  deleteImage(imageId: string): Promise<void>;

  /**
   * Delete all images for a conversation
   */
  deleteImagesByConversation(conversationId: string): Promise<void>;
}
