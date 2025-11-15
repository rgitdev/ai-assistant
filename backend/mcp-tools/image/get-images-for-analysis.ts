import { ImageService } from "@backend/services/image/ImageService";
import { ConversationService } from "@backend/services/conversation/ConversationService";

/**
 * Tool definition for retrieving and analyzing images from conversation history.
 * Allows the LLM to access historical images by image IDs or message ID.
 */
export const getImagesForAnalysisDefinition = {
  name: "get_images_for_analysis",
  description: "Retrieve and analyze images from previous messages in the conversation. " +
               "Use this when you need to see images that were sent in earlier messages. " +
               "You can specify either specific image IDs or a message ID to get all images from that message. " +
               "When you retrieve conversation history with get_conversation, you will see imageIds fields - use those IDs here to view the actual images.",
  inputSchema: {
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
    oneOf: [
      { required: ["imageIds"] },
      { required: ["messageId"] }
    ]
  }
};

export interface GetImagesForAnalysisServices {
  imageService: ImageService;
  conversationService: ConversationService;
}

/**
 * Handler for the get_images_for_analysis tool.
 * Retrieves images and returns them in a format the LLM can analyze.
 */
export async function getImagesForAnalysisHandler(
  args: any,
  services: GetImagesForAnalysisServices
) {
  const { imageIds, messageId } = args as {
    imageIds?: string[];
    messageId?: string;
  };

  let targetImageIds: string[];

  // Determine which images to retrieve
  if (imageIds && imageIds.length > 0) {
    targetImageIds = imageIds;
  } else if (messageId) {
    const metadata = await services.imageService.getImagesByMessage(messageId);
    targetImageIds = metadata.map(m => m.id);
  } else {
    throw new Error("Either imageIds or messageId must be provided");
  }

  if (targetImageIds.length === 0) {
    return {
      content: [{
        type: "text",
        text: "No images found for the specified criteria"
      }]
    };
  }

  // Get images as base64 (same format used for current message images)
  const imageContents = await services.imageService.getImagesAsBase64(targetImageIds);

  // Get metadata for context
  const metadataList = await Promise.all(
    targetImageIds.map(id => services.imageService.getImageMetadata(id))
  );

  // Return in a format that allows LLM to see the images
  // The LLM can analyze these images just like current message images
  return {
    content: [
      {
        type: "text",
        text: `Retrieved ${targetImageIds.length} image(s):\n` +
              metadataList.map((m, i) =>
                `${i + 1}. Image ID: ${m?.id}, Filename: ${m?.originalFilename || 'unknown'}, ` +
                `Size: ${m?.size} bytes, Created: ${m?.createdAt}`
              ).join('\n')
      },
      // Include images in the response so LLM can see them
      ...imageContents.map(img => ({
        type: "image" as const,
        source: {
          type: "base64" as const,
          media_type: img.image_url.url.match(/data:(.*?);base64/)?.[1] || "image/jpeg",
          data: img.image_url.url.split(',')[1] // Extract base64 data
        }
      }))
    ]
  };
}
