import { ImageService } from "@backend/services/image/ImageService";
import { ConversationService } from "@backend/services/conversation/ConversationService";

/**
 * Tool definition for analyzing a specific message along with all its images.
 * Combines message retrieval with image analysis in a single tool call.
 */
export const analyzeMessageWithImagesDefinition = {
  name: "analyze_message_with_images",
  description: "Retrieve a specific message along with all its images for analysis. " +
               "This is useful when you need to re-examine what a user showed you in a previous message. " +
               "The tool will return both the message text and any images that were included with it.",
  inputSchema: {
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
  }
};

export interface AnalyzeMessageWithImagesServices {
  imageService: ImageService;
  conversationService: ConversationService;
}

/**
 * Handler for the analyze_message_with_images tool.
 * Retrieves a message and its associated images for LLM analysis.
 */
export async function analyzeMessageWithImagesHandler(
  args: any,
  services: AnalyzeMessageWithImagesServices
) {
  const { messageId, conversationId } = args as {
    messageId: string;
    conversationId: string;
  };

  // Get the message
  const messages = await services.conversationService.getConversationMessages(conversationId);
  const message = messages.find(m => m.id === messageId);

  if (!message) {
    throw new Error(`Message ${messageId} not found in conversation ${conversationId}`);
  }

  // If message has no images, return just the text
  if (!message.imageIds || message.imageIds.length === 0) {
    return {
      content: [{
        type: "text",
        text: `Message from ${message.role} (${message.timestamp}):\n${message.content}\n\n(No images in this message)`
      }]
    };
  }

  // Get images as base64
  const imageContents = await services.imageService.getImagesAsBase64(message.imageIds);
  const metadataList = await Promise.all(
    message.imageIds.map(id => services.imageService.getImageMetadata(id))
  );

  return {
    content: [
      {
        type: "text",
        text: `Message from ${message.role} (${message.timestamp}):\n${message.content}\n\n` +
              `Contains ${message.imageIds.length} image(s):\n` +
              metadataList.map((m, i) =>
                `${i + 1}. ${m?.originalFilename || 'unknown'} (${m?.size} bytes)`
              ).join('\n')
      },
      // Include images in the response so LLM can see them
      ...imageContents.map(img => ({
        type: "image" as const,
        source: {
          type: "base64" as const,
          media_type: img.image_url.url.match(/data:(.*?);base64/)?.[1] || "image/jpeg",
          data: img.image_url.url.split(',')[1]
        }
      }))
    ]
  };
}
