import { ConversationService } from "../../services/conversation/ConversationService";

export const listConversationsDefinition = {
  name: "list_conversations",
  description: "List all available conversations with their metadata",
  inputSchema: {
    type: "object",
    properties: {},
  },
};

export interface ListConversationsServices {
  conversationService: ConversationService;
}

export async function listConversationsHandler(
  args: any,
  services: ListConversationsServices
) {
  const conversations = await services.conversationService.getConversations();

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(conversations, null, 2),
      },
    ],
  };
}
