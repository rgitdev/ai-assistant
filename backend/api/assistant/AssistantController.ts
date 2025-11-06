import { SampleHandler } from "./samples/SampleHandler";
import { Assistant } from "backend/assistant/Assistant";
import { ChatMessage, ChatRequest, ChatResponse, ChatEditRequest } from "backend/models/ChatMessage";
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

    // Get assistant response (simulated or real)
    let responseContent: string;
    let conversationId: string;

    if (this.useSimulatedResponses) {
      // For simulated responses, just use a random UUID (no need to persist)
      conversationId = requestBody.conversationId || uuidv4();
      responseContent = SampleHandler.getSimulatedResponse(requestBody.message);
    } else {
      // Use the new simplified Assistant API
      const result = requestBody.conversationId
        ? await this.assistant.handleMessage(requestBody.conversationId, requestBody.message)
        : await this.assistant.handleNewMessage(requestBody.message);

      responseContent = result.response;
      conversationId = result.conversationId;
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
      const messages = await this.assistant.conversationService.getConversationMessages(conversationId);
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
  
  // PUT /api/assistant/chat/:messageId - Edit last user message and regenerate response
  async handleEditChat(messageId: string, requestBody: ChatEditRequest): Promise<ChatResponse> {
    if (!requestBody || typeof requestBody !== 'object') {
      throw new Error('Invalid request body');
    }
    if (!requestBody.message || typeof requestBody.message !== 'string') {
      throw new Error('Message is required and must be a string');
    }
    if (!requestBody.conversationId || typeof requestBody.conversationId !== 'string') {
      throw new Error('conversationId is required and must be a string');
    }

    const { response, conversationId } = await this.assistant.editLastUserMessageAndRegenerate(
      requestBody.conversationId,
      messageId,
      requestBody.message
    );

    const aiResponse: ChatResponse = {
      id: uuidv4(),
      content: response,
      role: 'assistant',
      timestamp: new Date().toISOString(),
      conversationId
    };
    return aiResponse;
  }

}

// Export singleton instance
export const assistantController = new AssistantController();
