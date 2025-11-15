import { SampleHandler } from "./samples/SampleHandler";
import { Assistant } from "backend/assistant/Assistant";
import { ChatMessage, ChatRequest, ChatResponse, ChatEditRequest } from "backend/models/ChatMessage";
import { v4 as uuidv4 } from 'uuid';
import { ServiceContainer } from "@backend/di/ServiceContainer";

export class AssistantController {
  private useSimulatedResponses: boolean = false; // Set to true to use simulated responses
  private assistant: Assistant;

  constructor() {
    this.assistant = ServiceContainer.get<Assistant>('Assistant');
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
        ? await this.assistant.handleMessage(requestBody.conversationId, requestBody.message, requestBody.images)
        : await this.assistant.handleNewMessage(requestBody.message, requestBody.images);

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

    // Truncate conversation: remove the message being edited and all following messages
    await this.assistant.conversationService.truncateConversation(
      requestBody.conversationId,
      messageId
    );

    // Handle the edited message through normal flow
    return await this.handleChat({
      message: requestBody.message,
      conversationId: requestBody.conversationId
    });
  }

}
