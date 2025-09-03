export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
}

export interface ChatResponse {
  id: string;
  content: string;
  role: 'assistant';
  timestamp: string;
  conversationId: string;
}

export interface Conversation {
  id: string;
  createdAt: string;
  updatedAt: string;
  name?: string;
}