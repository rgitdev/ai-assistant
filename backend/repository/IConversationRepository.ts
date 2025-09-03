import { ChatMessage, Conversation } from "../models/ChatMessage";

export interface IConversationRepository {
  addMessage(conversationId: string, message: ChatMessage): Promise<void>;
  createConversation(): Promise<string>;
  getConversations(): Promise<Conversation[]>;
  getConversationMessages(conversationId: string): Promise<ChatMessage[]>;
}