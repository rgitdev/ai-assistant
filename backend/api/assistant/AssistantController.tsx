import { serve } from "bun";
import { basicResponses } from "./samples/basicResponses";
import { multilineResponses } from "./samples/multilineResponses"; 
import { markdownResponses } from "./samples/markdownResponses";
import { Assistant } from "backend/assistant/Assistant";

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

export class AssistantController {
  private conversations: Map<string, ChatMessage[]> = new Map();
  
  private async getAssistantResponse(userMessage: string): Promise<string> {
    const assistant = new Assistant();
    return await assistant.sendMessage(userMessage);
  }
  // Simulated AI responses - you can replace this with actual LLM integration
  private getSimulatedResponse(userMessage: string): string {
    const allResponses = [...basicResponses, ...multilineResponses, ...markdownResponses];
    
    // Add some context-aware responses based on keywords
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return "Hello! I'm your AI assistant. How can I help you today?";
    }
    
    if (lowerMessage.includes('help')) {
      return "I'm here to help! You can ask me questions, request explanations, or discuss any topic you'd like. What would you like to know?";
    }
    
    if (lowerMessage.includes('thank')) {
      return "You're very welcome! I'm glad I could help. Is there anything else you'd like to discuss?";
    }
    
    if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye')) {
      return "Goodbye! It was great chatting with you. Feel free to come back anytime you need assistance!";
    }
    
    if (lowerMessage.includes('code') || lowerMessage.includes('programming')) {
      return "I'd be happy to help with programming questions! Whether it's debugging, explaining concepts, or reviewing code, I'm here to assist. What specific programming topic would you like to explore?";
    }
    
    if (lowerMessage.includes('weather')) {
      return "I don't have access to real-time weather data, but I can help you understand weather patterns, climate science, or suggest how to check weather information in your area.";
    }
    
    if (lowerMessage.includes('markdown')) {
      return markdownResponses[Math.floor(Math.random() * markdownResponses.length)];
    }
    
    // Default to random response
    return allResponses[Math.floor(Math.random() * allResponses.length)];
  }
  
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  private getConversationId(): string {
    return 'conv_' + this.generateId();
  }
  
  // Simulate AI processing delay
  private async simulateProcessingDelay(): Promise<void> {
    const delay = 1000 + Math.random() * 2000; // 1-3 seconds
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  // POST /api/assistant/chat - Send a message and get AI response
  async handleChat(req: Request): Promise<Response> {
    try {
      const body: ChatRequest = await req.json();
      
      if (!body.message || typeof body.message !== 'string') {
        return Response.json(
          { error: 'Message is required and must be a string' },
          { status: 400 }
        );
      }
      
      const conversationId = body.conversationId || this.getConversationId();
      const userMessage: ChatMessage = {
        id: this.generateId(),
        content: body.message,
        role: 'user',
        timestamp: new Date().toISOString()
      };
      
      // Get or create conversation
      if (!this.conversations.has(conversationId)) {
        this.conversations.set(conversationId, []);
      }
      
      const conversation = this.conversations.get(conversationId)!;
      conversation.push(userMessage);
      
      // Simulate AI processing
      await this.simulateProcessingDelay();
      
      // Get assistant response
      const aiResponse : ChatResponse = {
        id: this.generateId(),
        content: await this.getAssistantResponse(body.message),
        role: 'assistant',
        timestamp: new Date().toISOString(),
        conversationId
      };
      // Generate AI response
      const aiGeneratedResponse: ChatResponse = {
        id: this.generateId(),
        content: this.getSimulatedResponse(body.message),
        role: 'assistant',
        timestamp: new Date().toISOString(),
        conversationId
      };
      
      conversation.push(aiResponse);
      
      return Response.json(aiResponse);
      
    } catch (error) {
      console.error('Error in handleChat:', error);
      return Response.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
  
  // GET /api/assistant/conversations/:id - Get conversation history
  async getConversation(req: Request, conversationId: string): Promise<Response> {
    try {
      const conversation = this.conversations.get(conversationId);
      
      if (!conversation) {
        return Response.json(
          { error: 'Conversation not found' },
          { status: 404 }
        );
      }
      
      return Response.json({
        conversationId,
        messages: conversation
      });
      
    } catch (error) {
      console.error('Error in getConversation:', error);
      return Response.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
  
  // DELETE /api/assistant/conversations/:id - Clear conversation
  async clearConversation(req: Request, conversationId: string): Promise<Response> {
    try {
      if (this.conversations.has(conversationId)) {
        this.conversations.delete(conversationId);
        return Response.json({ message: 'Conversation cleared successfully' });
      } else {
        return Response.json(
          { error: 'Conversation not found' },
          { status: 404 }
        );
      }
    } catch (error) {
      console.error('Error in clearConversation:', error);
      return Response.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
  
  // GET /api/assistant/health - Health check endpoint
  async healthCheck(): Promise<Response> {
    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      activeConversations: this.conversations.size
    });
  }
  
  // Main request handler
  async handleRequest(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    
    // Handle preflight requests
    if (method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }
    
    try {
      let response: Response;
      
      if (path === '/api/assistant/chat' && method === 'POST') {
        response = await this.handleChat(req);
      } else if (path.startsWith('/api/assistant/conversations/') && method === 'GET') {
        const conversationId = path.split('/').pop();
        if (conversationId) {
          response = await this.getConversation(req, conversationId);
        } else {
          response = Response.json({ error: 'Invalid conversation ID' }, { status: 400 });
        }
      } else if (path.startsWith('/api/assistant/conversations/') && method === 'DELETE') {
        const conversationId = path.split('/').pop();
        if (conversationId) {
          response = await this.clearConversation(req, conversationId);
        } else {
          response = Response.json({ error: 'Invalid conversation ID' }, { status: 400 });
        }
      } else if (path === '/api/assistant/health' && method === 'GET') {
        response = await this.healthCheck();
      } else {
        response = Response.json({ error: 'Not found' }, { status: 404 });
      }
      
      // Add CORS headers to response
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      return response;
      
    } catch (error) {
      console.error('Error handling request:', error);
      const errorResponse = Response.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
      
      Object.entries(corsHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });
      
      return errorResponse;
    }
  }
}

// Export singleton instance
export const assistantController = new AssistantController();