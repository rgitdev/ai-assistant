// Types for the image API
export interface ImageMetadata {
  id: string;
  conversationId: string;
  messageId: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export class ImageClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }

  /**
   * Get an image file by ID
   * Returns the image data and content type for proxying to the browser
   */
  async getImage(imageId: string): Promise<Response> {
    const response = await fetch(`${this.baseUrl}/api/images/${imageId}`);
    return response;
  }

  /**
   * Get image metadata by ID
   * Returns metadata (filename, size, etc.) without the actual image data
   */
  async getImageMetadata(imageId: string): Promise<ImageMetadata> {
    const response = await fetch(`${this.baseUrl}/api/images/${imageId}/metadata`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Failed to get image metadata: ${error.error || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Test the connection to the image API
   */
  async testConnection(): Promise<boolean> {
    try {
      // Try to get metadata for a dummy image (will 404 but confirms API is running)
      const response = await fetch(`${this.baseUrl}/api/images/test/metadata`, {
        method: 'GET',
      });

      // Any response (even 404) means the API is running
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Export a default instance
export const imageClient = new ImageClient();
