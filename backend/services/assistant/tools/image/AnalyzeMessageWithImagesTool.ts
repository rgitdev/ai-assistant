// backend/services/assistant/tools/image/AnalyzeMessageWithImagesTool.ts
import { Tool } from '../../ToolRegistry';
import { ImageService } from '@backend/services/image/ImageService';
import { ConversationService } from '@backend/services/conversation/ConversationService';

/**
 * Tool for analyzing a specific message along with all its images.
 * Combines message retrieval with image analysis in a single tool call.
 */
export class AnalyzeMessageWithImagesTool implements Tool {
  name = "analyze_message_with_images";
  description = "Retrieve a specific message along with all its images for analysis. " +
                "This is useful when you need to re-examine what a user showed you in a previous message. " +
                "The tool will return both the message text and any images that were included with it.";

  parameters = {
    type: "object",
    properties: {
      messageId: {
        type: "string",
        description: "The ID of the message to retrieve with its images"
      },
      conversationId: {
        type: "string",
        description: "The conversation ID (for validation)"
      }
    },
    required: ["messageId", "conversationId"]
  };

  constructor(
    private imageService: ImageService,
    private conversationService: ConversationService
  ) {}

  async execute(args: { messageId: string; conversationId: string }): Promise<any> {
    const { messageId, conversationId } = args;

    // Get the message
    const messages = await this.conversationService.getConversationMessages(conversationId);
    const message = messages.find(m => m.id === messageId);

    if (!message) {
      throw new Error(`Message ${messageId} not found in conversation ${conversationId}`);
    }

    // If message has no images, return just the text
    if (!message.imageIds || message.imageIds.length === 0) {
      return {
        messageId: message.id,
        role: message.role,
        content: message.content,
        timestamp: message.timestamp,
        imageCount: 0,
        message: "No images in this message"
      };
    }

    // Get images as base64
    const imageContents = await this.imageService.getImagesAsBase64(message.imageIds);
    const metadataList = await Promise.all(
      message.imageIds.map(id => this.imageService.getImageMetadata(id))
    );

    return {
      messageId: message.id,
      role: message.role,
      content: message.content,
      timestamp: message.timestamp,
      imageCount: message.imageIds.length,
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
