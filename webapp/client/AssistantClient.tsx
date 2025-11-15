// Types for the assistant API
export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
  images?: File[];
}

export interface ChatResponse {
  id: string;
  content: string;
  role: 'assistant';
  timestamp: string;
  conversationId: string;
}

export interface ChatEditRequest {
  message: string;
  conversationId: string;
}

export interface ConversationResponse {
  conversationId: string;
  messages: ChatMessage[];
}

export interface HealthResponse {
  status: string;
  timestamp: string;
}

export class AssistantClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }

  /**
   * Send a message to the assistant and get a response
   */
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    console.log(`Sending message to ${this.baseUrl}/api/assistant/chat`);

    let body: FormData | string;
    let headers: HeadersInit = {};

    // Use FormData if images are present
    if (request.images && request.images.length > 0) {
      const formData = new FormData();
      formData.append('message', request.message);
      if (request.conversationId) {
        formData.append('conversationId', request.conversationId);
      }
      request.images.forEach((image, index) => {
        formData.append('images', image);
      });
      body = formData;
      // Don't set Content-Type for FormData - browser will set it with boundary
    } else {
      // Use JSON for text-only messages
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(request);
    }

    const response = await fetch(`${this.baseUrl}/api/assistant/chat`, {
      method: 'POST',
      headers,
      body,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Failed to send message: ${error.error || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Edit the last user message and regenerate the assistant response
   */
  async editLastMessage(messageId: string, request: ChatEditRequest): Promise<ChatResponse> {
    const response = await fetch(`${this.baseUrl}/api/assistant/chat/${messageId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Failed to edit message: ${error.error || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Check the health status of the assistant service
   */
  async healthCheck(): Promise<HealthResponse> {
    const response = await fetch(`${this.baseUrl}/api/assistant/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Health check failed: ${error.error || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Test the connection to the backend
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/assistant/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error(`Health check failed with status: ${response.status}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

// Export a default instance
export const assistantClient = new AssistantClient();