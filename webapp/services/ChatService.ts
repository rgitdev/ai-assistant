import { assistantClient } from '../client/AssistantClient';
import { conversationClient } from '../client/ConversationClient';
import { Message } from '../components/Messages';

export interface SendMessageResult {
  content: string;
  conversationId: string;
}

export interface EditMessageResult {
  content: string;
}

export class ChatService {
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  async sendMessage(
    message: string, 
    conversationId?: string | null
  ): Promise<SendMessageResult> {
    try {
      const data = await assistantClient.sendMessage({
        message,
        conversationId: conversationId || undefined,
      });
      return {
        content: data.content,
        conversationId: data.conversationId,
      };
    } catch (error) {
      console.error('Error sending message to API:', error);
      throw error;
    }
  }

  async editMessage(
    messageId: string, 
    message: string, 
    conversationId: string
  ): Promise<EditMessageResult> {
    try {
      const data = await assistantClient.editLastMessage(messageId, { 
        message, 
        conversationId 
      });
      return {
        content: data.content,
      };
    } catch (error) {
      console.error('Error editing message:', error);
      throw error;
    }
  }

  async resendMessage(
    messageId: string, 
    message: string, 
    conversationId: string
  ): Promise<EditMessageResult> {
    try {
      const data = await assistantClient.editLastMessage(messageId, { 
        message, 
        conversationId 
      });
      return {
        content: data.content,
      };
    } catch (error) {
      console.error('Error resending message:', error);
      throw error;
    }
  }

  async loadConversationMessages(conversationId: string): Promise<Message[]> {
    try {
      const conversationData = await conversationClient.getConversation(conversationId);
      
      // Convert ChatMessage[] to Message[]
      return conversationData.messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        role: msg.role,
        timestamp: new Date(msg.timestamp)
      }));
    } catch (error) {
      console.error('Failed to load conversation messages:', error);
      throw error;
    }
  }

  createUserMessage(content: string): Message {
    return {
      id: this.generateId(),
      content,
      role: 'user',
      timestamp: new Date()
    };
  }

  createAssistantMessage(content: string): Message {
    return {
      id: this.generateId(),
      content,
      role: 'assistant',
      timestamp: new Date()
    };
  }

  createErrorMessage(content: string = "I'm sorry, I encountered an error connecting to the AI service. Please try again."): Message {
    return {
      id: this.generateId(),
      content,
      role: 'assistant',
      timestamp: new Date()
    };
  }
}
