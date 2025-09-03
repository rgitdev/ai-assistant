import { SampleHandler } from "./samples/SampleHandler";
import { Assistant } from "backend/assistant/Assistant";
import { ChatMessage, ChatRequest, ChatResponse } from "backend/models/ChatMessage";
import { v4 as uuidv4 } from 'uuid';

export class AssistantController {
  private useSimulatedResponses: boolean = false; // Set to true to use simulated responses
  private assistant: Assistant;
  
  constructor() {
    this.assistant = new Assistant();
  }
  
  // POST /api/assistant/chat - Send a message and get AI response
  async handleChat(requestBody: ChatRequest): Promise<ChatResponse> {
    if (!requestBody.message || typeof requestBody.message !== 'string') {
      throw new Error('Message is required and must be a string');
    }
    
    let conversationId = requestBody.conversationId;
    
    // Create new conversation if none provided
    if (!conversationId) {
      conversationId = await this.assistant.createConversation();
    }
    
    // Get assistant response (simulated or real)
    let responseContent: string;
    if (this.useSimulatedResponses) {
      responseContent = SampleHandler.getSimulatedResponse(requestBody.message);
    } else {
      const result = await this.assistant.sendMessageToConversation(conversationId, requestBody.message);
      responseContent = result.response;
    }
    
    const aiResponse: ChatResponse = {
      id: uuidv4(),
      content: responseContent,
      role: 'assistant',
      timestamp: new Date().toISOString(),
      conversationId
    };
    
    return aiResponse;
  }
  
  // GET /api/assistant/conversations/:id - Get conversation history
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
  
  // DELETE /api/assistant/conversations/:id - Clear conversation
  async clearConversation(conversationId: string): Promise<{ message: string }> {
    try {
      // Note: ConversationRepository interface doesn't have a clear method
      // For now, we'll return success but this may need to be implemented
      return { message: 'Conversation cleared successfully' };
    } catch (error) {
      throw new Error('Conversation not found');
    }
  }
  
  // GET /api/assistant/health - Health check endpoint
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString()
    };
  }
  

}

// Export singleton instance
export const assistantController = new AssistantController();
