import { ChatMessage, Conversation } from "backend/models/ChatMessage";
import { ConversationService } from "@backend/services/conversation/ConversationService";
import { ConversationRepositoryFactory } from "backend/repository/ConversationRepositoryFactory";

export class ConversationController {
  private conversationService: ConversationService;

  constructor() {
    const repositoryFactory = new ConversationRepositoryFactory();
    const conversationRepository = repositoryFactory.build();
    this.conversationService = new ConversationService(conversationRepository);
  }
  
  // GET /api/conversation - Get all conversations
  async getAllConversations(): Promise<Conversation[]> {
    try {
      console.log('getAllConversations');
      const conversations = await this.conversationService.getConversations();

      return conversations;
    } catch (error) {
      throw new Error('Failed to retrieve conversations');
    }
  }
  
  // GET /api/conversation/:id - Get conversation with messages
  async getConversation(conversationId: string): Promise<{ conversationId: string; messages: ChatMessage[] }> {
    try {
      console.log('getConversation ', conversationId);
      const messages = await this.conversationService.getConversationMessages(conversationId);
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
      await this.conversationService.updateConversationName(conversationId, data.name);
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