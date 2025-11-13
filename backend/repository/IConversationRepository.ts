import { ChatMessage, Conversation } from "../models/ChatMessage";

export interface IConversationRepository {
  addMessage(conversationId: string, message: ChatMessage): Promise<void>;
  createConversation(): Promise<string>;
  getConversations(): Promise<Conversation[]>;
  getConversationMessages(conversationId: string): Promise<ChatMessage[]>;
  updateConversationName(conversationId: string, name: string): Promise<void>;
  updateMessage(messageId: string, content: string): Promise<void>;
  deleteMessagesAfter(conversationId: string, messageId: string): Promise<void>;
  deleteMessagesFrom(conversationId: string, messageId: string): Promise<void>;
}