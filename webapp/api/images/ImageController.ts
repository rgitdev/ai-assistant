/**
 * ImageController - Handles image retrieval by proxying requests to backend
 *
 * The webapp doesn't store images directly - it proxies all image requests
 * to the backend server which has access to the file system.
 */
export class ImageController {
  private backendUrl: string;

  constructor(backendUrl: string = 'http://localhost:3001') {
    this.backendUrl = backendUrl;
  }

  /**
   * GET /api/images/:imageId - Proxy image request to backend
   * Fetches the image from backend and forwards it to the browser
   */
  async getImage(imageId: string): Promise<Response> {
    const backendImageUrl = `${this.backendUrl}/api/images/${imageId}`;

    try {
      const response = await fetch(backendImageUrl);

      if (!response.ok) {
        return Response.json(
          { error: 'Image not found' },
          { status: response.status }
        );
      }

      // Forward the image with the same content-type
      const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
      const imageData = await response.arrayBuffer();

      return new Response(imageData, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable'
        }
      });
    } catch (error) {
      console.error('Error proxying image:', error);
      return Response.json(
        { error: 'Failed to fetch image' },
        { status: 500 }
      );
    }
  }

  /**
   * GET /api/images/:imageId/metadata - Proxy image metadata request to backend
   */
  async getImageMetadata(imageId: string): Promise<Response> {
    const backendMetadataUrl = `${this.backendUrl}/api/images/${imageId}/metadata`;

    try {
      const response = await fetch(backendMetadataUrl);

      if (!response.ok) {
        return Response.json(
          { error: 'Image metadata not found' },
          { status: response.status }
        );
      }

      const metadata = await response.json();
      return Response.json(metadata);
    } catch (error) {
      console.error('Error proxying image metadata:', error);
      return Response.json(
        { error: 'Failed to fetch image metadata' },
        { status: 500 }
      );
    }
  }
}
