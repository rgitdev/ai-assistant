// Types for the conversation API
export interface Conversation {
  id: string;
  createdAt: string;
  updatedAt: string;
  name?: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  imageIds?: string[];
}

export interface ConversationDetailResponse {
  conversationId: string;
  messages: ChatMessage[];
}

export interface UpdateConversationRequest {
  name: string;
}

export interface UpdateConversationResponse {
  conversationId: string;
  success: boolean;
}

export class ConversationClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }

  /**
   * Get all conversations
   */
  async getAllConversations(): Promise<Conversation[]> {
    console.log('About to call getAllConversations');
    try {
      const response = await fetch(`${this.baseUrl}/api/conversation`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      const responseText = await response.text();
      console.log('Raw response text:', responseText);
      
      if (!response.ok) {
        let errorMessage = response.statusText;
        try {
          const errorJson = JSON.parse(responseText);
          errorMessage = errorJson.error || response.statusText;
        } catch {
          // If response text isn't JSON, use the text itself
          errorMessage = responseText || response.statusText;
        }
        throw new Error(`Failed to get conversations: ${errorMessage}`);
      }

      const responseBody = JSON.parse(responseText);
      console.log('Parsed response body:', responseBody);
      
      return responseBody;
    } catch (error) {
      console.error('Error in getAllConversations:', error);
      throw error;
    }
  }

  /**
   * Get conversation details with messages by ID
   */
  async getConversation(conversationId: string): Promise<ConversationDetailResponse> {
    const response = await fetch(`${this.baseUrl}/api/conversation/${conversationId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Failed to get conversation: ${error.error || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Update conversation name
   */
  async updateConversation(conversationId: string, request: UpdateConversationRequest): Promise<UpdateConversationResponse> {
    const response = await fetch(`${this.baseUrl}/api/conversation/${conversationId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Failed to update conversation: ${error.error || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Test the connection to the conversation API
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/conversation`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }
}

// Export a default instance
export const conversationClient = new ConversationClient();

