
// backend/services/assistant/tools/GetConversationTool.ts
import { Tool } from '../ToolRegistry';
import { ConversationService } from '@backend/services/conversation/ConversationService';

export class GetConversationTool implements Tool {
  name = "get_conversation";
  description = "Retrieve all messages from a specific conversation by ID";

  parameters = {
    type: "object",
    properties: {
      conversationId: {
        type: "string",
        description: "The unique identifier of the conversation"
      }
    },
    required: ["conversationId"]
  };

  constructor(private conversationService: ConversationService) {}

  async execute(args: { conversationId: string }): Promise<any> {
    const { conversationId } = args;

    const messages = await this.conversationService.getConversationMessages(conversationId);

    return {
      conversationId,
      messageCount: messages.length,
      messages: messages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
        imageIds: m.imageIds,
        // Add hint if message contains images
        imageHint: m.imageIds && m.imageIds.length > 0
          ? `This message contains ${m.imageIds.length} image(s). Use get_images_for_analysis or analyze_message_with_images to view them.`
          : undefined
      }))
    };
  }
}
