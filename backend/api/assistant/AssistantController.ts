import { SampleHandler } from "./samples/SampleHandler";
import { Assistant } from "backend/assistant/Assistant";
import { ConversationMessage } from "backend/client/openai/OpenAIService";
import { ChatMessage, ChatRequest, ChatResponse } from "backend/models/ChatMessage";

export class AssistantController {
  private conversations: Map<string, ChatMessage[]> = new Map();
  private useSimulatedResponses: boolean = false; // Set to true to use simulated responses
  private assistant: Assistant;
  
  constructor() {
    this.assistant = new Assistant();
  }
  
  private async getAssistantResponse(conversation: ChatMessage[]): Promise<string> {
    // Convert ChatMessage[] to ConversationMessage[]
    const conversationMessages: ConversationMessage[] = conversation.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    return await this.assistant.sendConversation(conversationMessages);
  }
  // Simulated AI responses are handled via SampleHandler
  
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  private getConversationId(): string {
    return 'conv_' + this.generateId();
  }
  
  
  // POST /api/assistant/chat - Send a message and get AI response
  async handleChat(requestBody: ChatRequest): Promise<ChatResponse> {
    if (!requestBody.message || typeof requestBody.message !== 'string') {
      throw new Error('Message is required and must be a string');
    }
    
    const conversationId = requestBody.conversationId || this.getConversationId();
    const userMessage: ChatMessage = {
      id: this.generateId(),
      content: requestBody.message,
      role: 'user',
      timestamp: new Date().toISOString()
    };
    
    // Get or create conversation
    if (!this.conversations.has(conversationId)) {
      this.conversations.set(conversationId, []);
    }
    
    const conversation = this.conversations.get(conversationId)!;
    conversation.push(userMessage);
    
    // Get assistant response (simulated or real)
    const responseContent = this.useSimulatedResponses 
      ? SampleHandler.getSimulatedResponse(requestBody.message)
      : await this.getAssistantResponse(conversation);
    
    const aiResponse : ChatResponse = {
      id: this.generateId(),
      content: responseContent,
      role: 'assistant',
      timestamp: new Date().toISOString(),
      conversationId
    };
    
    conversation.push(aiResponse);
    
    return aiResponse;
  }
  
  // GET /api/assistant/conversations/:id - Get conversation history
  async getConversation(conversationId: string): Promise<{ conversationId: string; messages: ChatMessage[] }> {
    const conversation = this.conversations.get(conversationId);
    
    if (!conversation) {
      throw new Error('Conversation not found');
    }
    
    return {
      conversationId,
      messages: conversation
    };
  }
  
  // DELETE /api/assistant/conversations/:id - Clear conversation
  async clearConversation(conversationId: string): Promise<{ message: string }> {
    if (this.conversations.has(conversationId)) {
      this.conversations.delete(conversationId);
      return { message: 'Conversation cleared successfully' };
    } else {
      throw new Error('Conversation not found');
    }
  }
  
  // GET /api/assistant/health - Health check endpoint
  async healthCheck(): Promise<{ status: string; timestamp: string; activeConversations: number }> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      activeConversations: this.conversations.size
    };
  }
  

}

// Export singleton instance
export const assistantController = new AssistantController();
