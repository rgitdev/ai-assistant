// backend/services/assistant/tools/image/GetImagesForAnalysisTool.ts
import { Tool } from '../../ToolRegistry';
import { ImageService } from '@backend/services/image/ImageService';

/**
 * Tool for retrieving and analyzing images from conversation history.
 * Allows the LLM to access historical images by image IDs or message ID.
 */
export class GetImagesForAnalysisTool implements Tool {
  name = "get_images_for_analysis";
  description = "Retrieve and analyze images from previous messages in the conversation. " +
                "Use this when you need to see images that were sent in earlier messages. " +
                "You can specify either specific image IDs or a message ID to get all images from that message. " +
                "When you retrieve conversation history with get_conversation, you will see imageIds fields - use those IDs here to view the actual images.";

  parameters = {
    type: "object",
    properties: {
      imageIds: {
        type: "array",
        items: { type: "string" },
        description: "Array of specific image IDs to retrieve (from imageIds field in messages). Use this when you know the exact image IDs you want to analyze."
      },
      messageId: {
        type: "string",
        description: "Get all images from a specific message ID. Use this when you want to see all images that were part of a particular message."
      }
    },
    // Note: OpenAI doesn't support oneOf directly, so we handle validation in execute
  };

  constructor(private imageService: ImageService) {}

  async execute(args: { imageIds?: string[]; messageId?: string }): Promise<any> {
    const { imageIds, messageId } = args;

    let targetImageIds: string[];

    // Determine which images to retrieve
    if (imageIds && imageIds.length > 0) {
      targetImageIds = imageIds;
    } else if (messageId) {
      const metadata = await this.imageService.getImagesByMessage(messageId);
      targetImageIds = metadata.map(m => m.id);
    } else {
      throw new Error("Either imageIds or messageId must be provided");
    }

    if (targetImageIds.length === 0) {
      return {
        message: "No images found for the specified criteria",
        imageCount: 0
      };
    }

    // Get images as base64 (same format used for current message images)
    const imageContents = await this.imageService.getImagesAsBase64(targetImageIds);

    // Get metadata for context
    const metadataList = await Promise.all(
      targetImageIds.map(id => this.imageService.getImageMetadata(id))
    );

    // Return image information and base64 data
    return {
      message: `Retrieved ${targetImageIds.length} image(s) successfully`,
      imageCount: targetImageIds.length,
      images: metadataList.map((m, i) => ({
        imageId: m?.id,
        filename: m?.originalFilename || 'unknown',
        size: m?.size,
        mimeType: m?.mimeType,
        createdAt: m?.createdAt,
        // Include base64 data for analysis
        base64Data: imageContents[i].image_url.url
      }))
    };
  }
}
