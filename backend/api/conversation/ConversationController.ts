import { Assistant } from "backend/assistant/Assistant";
import { ChatMessage, Conversation } from "backend/models/ChatMessage";

export class ConversationController {
  private assistant: Assistant;
  
  constructor() {
    this.assistant = new Assistant();
  }
  
  // GET /api/conversation - Get all conversations
  async getAllConversations(): Promise<Conversation[]> {
    try {
      const conversations = await this.assistant.getConversations();
      return conversations;
    } catch (error) {
      throw new Error('Failed to retrieve conversations');
    }
  }
  
  // GET /api/conversation/:id - Get conversation with messages
  async getConversation(conversationId: string): Promise<{ conversationId: string; messages: ChatMessage[] }> {
    try {
      const messages = await this.assistant.getConversationMessages(conversationId);
      return {
        conversationId,
        messages
      };
    } catch (error) {
      throw new Error('Conversation not found');
    }
  }
}

// Export singleton instance
export const conversationController = new ConversationController();