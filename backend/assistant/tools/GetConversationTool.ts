
// backend/services/assistant/tools/GetConversationTool.ts
import { Tool } from '../ToolRegistry';
import { IConversationRepository } from '@backend/repository/IConversationRepository';

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

  constructor(private conversationRepository: IConversationRepository) {}

  async execute(args: { conversationId: string }): Promise<any> {
    const { conversationId } = args;
    
    const messages = await this.conversationRepository.getConversationMessages(conversationId);
    
    return {
      conversationId,
      messageCount: messages.length,
      messages: messages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp
      }))
    };
  }
}
