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
      console.log('getAllConversations');
      const conversations = await this.assistant.conversationService.getConversations();

      return conversations;
    } catch (error) {
      throw new Error('Failed to retrieve conversations');
    }
  }
  
  // GET /api/conversation/:id - Get conversation with messages
  async getConversation(conversationId: string): Promise<{ conversationId: string; messages: ChatMessage[] }> {
    try {
      console.log('getConversation ', conversationId);
      const messages = await this.assistant.conversationService.getConversationMessages(conversationId);
      return {
        conversationId,
        messages
      };
    } catch (error) {
      throw new Error('Conversation not found');
    }
  }
  
  // PUT /api/conversation/:id - Update conversation name
  async updateConversation(conversationId: string, data: { name: string }): Promise<{ conversationId: string; success: boolean }> {
    try {
      console.log('updateConversation ', conversationId, data.name);
      await this.assistant.conversationService.updateConversationName(conversationId, data.name);
      return {
        conversationId,
        success: true
      };
    } catch (error) {
      throw new Error('Failed to update conversation');
    }
  }
}

// Export singleton instance
export const conversationController = new ConversationController();