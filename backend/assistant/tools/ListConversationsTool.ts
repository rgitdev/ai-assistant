import { Tool } from '../ToolRegistry';
import { ConversationService } from '@backend/services/conversation/ConversationService';

export class ListConversationsTool implements Tool {
  name = "list_conversations";
  description = "List all available conversations with their metadata";

  parameters = {
    type: "object",
    properties: {
      limit: {
        type: "number",
        description: "Maximum number of conversations to return (default: 10)",
        default: 10
      }
    }
  };

  constructor(private conversationService: ConversationService) {}

  async execute(args: { limit?: number }): Promise<any> {
    const { limit = 10 } = args;

    const conversations = await this.conversationService.getConversations();
    const limited = conversations.slice(0, limit);

    return {
      total: conversations.length,
      returned: limited.length,
      conversations: limited.map(c => ({
        id: c.id,
        name: c.name,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt
      }))
    };
  }
}

