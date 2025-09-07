import { IConversationRepository } from "./IConversationRepository";
import { ChatMessage, Conversation } from "../models/ChatMessage";
import { DatabaseService } from "../client/database/DatabaseService";

export class ConversationDatabaseRepository implements IConversationRepository {
  private db: DatabaseService;

  constructor(dbPath?: string) {
    this.db = new DatabaseService(dbPath);
  }

  async addMessage(conversationId: string, message: ChatMessage): Promise<void> {
    await this.db.insertMessage({
      uuid: message.id,
      conversation_id: conversationId,
      content: message.content,
      role: message.role,
    });
  }


  async createConversation(): Promise<string> {
    return 'conv_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  async getConversations(): Promise<Conversation[]> {
    const allMessages = await this.db.getAllMessages();
    const conversationMap = new Map<string, { createdAt: string; updatedAt: string }>();
    
    for (const msg of allMessages) {
      const existing = conversationMap.get(msg.conversation_id);
      if (!existing || msg.created_at < existing.createdAt) {
        conversationMap.set(msg.conversation_id, {
          createdAt: msg.created_at,
          updatedAt: existing?.updatedAt && msg.updated_at > existing.updatedAt ? msg.updated_at : (msg.updated_at || msg.created_at)
        });
      } else if (msg.updated_at > existing.updatedAt) {
        existing.updatedAt = msg.updated_at;
      }
    }

    return Array.from(conversationMap.entries()).map(([id, { createdAt, updatedAt }]) => ({
      id,
      createdAt,
      updatedAt,
    }));
  }

  async getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
    const messages = await this.db.getMessagesByConversationId(conversationId);
    const sorted = messages.sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));
    return sorted.map(msg => ({
      id: msg.uuid,
      content: msg.content,
      role: msg.role as 'user' | 'assistant',
      timestamp: msg.created_at,
    }));
  }

  async updateConversationName(conversationId: string, name: string): Promise<void> {
    throw new Error('updateConversationName not implemented for database repository');
  }

  async updateMessage(messageId: string, content: string): Promise<void> {
    await this.db.updateMessage(messageId, content);
  }

  async deleteMessagesAfter(conversationId: string, messageId: string): Promise<void> {
    const all = await this.db.getMessagesByConversationId(conversationId);
    const sorted = all.sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));
    const index = sorted.findIndex(m => m.uuid === messageId);
    if (index === -1) {
      throw new Error('Message not found');
    }
    const toDelete = sorted.slice(index + 1);
    for (const msg of toDelete) {
      await this.db.deleteMessage(msg.uuid);
    }
  }
}