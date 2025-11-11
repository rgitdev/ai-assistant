import { ConversationService } from "../../services/conversation/ConversationService";

export const getConversationDefinition = {
  name: "get_conversation",
  description: "Get all messages from a specific conversation by ID",
  inputSchema: {
    type: "object",
    properties: {
      conversationId: {
        type: "string",
        description: "The unique identifier of the conversation",
      },
    },
    required: ["conversationId"],
  },
};

export interface GetConversationServices {
  conversationService: ConversationService;
}

export async function getConversationHandler(
  args: any,
  services: GetConversationServices
) {
  const { conversationId } = args as { conversationId: string };
  const messages = await services.conversationService.getConversationMessages(conversationId);

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(messages, null, 2),
      },
    ],
  };
}
