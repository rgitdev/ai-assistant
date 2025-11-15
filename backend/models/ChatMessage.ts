export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  imageIds?: string[]; // References to saved images
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
  images?: File[] | Blob[];
}

export interface ChatResponse {
  id: string;
  content: string;
  role: 'assistant';
  timestamp: string;
  conversationId: string;
}

export interface ChatEditRequest {
  conversationId: string;
  message: string;
}

export interface Conversation {
  id: string;
  createdAt: string;
  updatedAt: string;
  name?: string;
}