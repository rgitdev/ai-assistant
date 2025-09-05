import { serve } from "bun";
import { assistantController } from "./api/assistant/AssistantController";
import { conversationController } from "./api/conversation/ConversationController";
import { ChatRequest } from "./models/ChatMessage";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Helper function to add CORS headers
function addCorsHeaders(response: Response): Response {
  const newResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });

  Object.entries(corsHeaders).forEach(([key, value]) => {
    newResponse.headers.set(key, value);
  });

  return newResponse;
}

const server = serve({
  port: 3001,
  routes: {
    // Assistant API routes - specific endpoints
    "/api/assistant/chat": {
      async POST(req) {
        console.log(`Chat request: ${req.method} ${req.url}`);
        
        try {
          const requestBody: ChatRequest = await req.json();
          const result = await assistantController.handleChat(requestBody);
          return addCorsHeaders(Response.json(result));
        } catch (error) {
          console.error('Error in chat:', error);
          const status = error instanceof Error && error.message.includes('required') ? 400 : 500;
          return addCorsHeaders(Response.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status }));
        }
      }
    },
    
    "/api/assistant/health": {
      async GET (req) {
      console.log(`Health check: ${req.method} ${req.url}`);
      
      if (req.method !== 'GET') {
        return addCorsHeaders(Response.json({ error: 'Method not allowed' }, { status: 405 }));
      }

      try {
        const result = await assistantController.healthCheck();
        return addCorsHeaders(Response.json(result));
      } catch (error) {
        console.error('Error in health check:', error);
        return addCorsHeaders(Response.json({ error: 'Internal server error' }, { status: 500 }));
      }
    }},
    
    "/api/conversation": {
      async GET(req) {
        console.log(`Conversation list request: ${req.method} ${req.url}`);
        
        try {
          const result = await conversationController.getAllConversations();
          return addCorsHeaders(Response.json(result));
        } catch (error) {
          console.error('Error getting conversations:', error);
          return addCorsHeaders(Response.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 }));
        }
      }
    },
    
    "/api/conversation/*": {
      async GET(req) {
        console.log(`Conversation request: ${req.method} ${req.url}`);
        
        const url = new URL(req.url);
        const pathParts = url.pathname.split('/');
        const conversationId = pathParts[pathParts.length - 1];
        
        if (!conversationId) {
          return addCorsHeaders(Response.json({ error: 'Invalid conversation ID' }, { status: 400 }));
        }

        try {
          const result = await conversationController.getConversation(conversationId);
          return addCorsHeaders(Response.json(result));
        } catch (error) {
          console.error('Error getting conversation:', error);
          const status = error instanceof Error && error.message.includes('not found') ? 404 : 500;
          return addCorsHeaders(Response.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status }));
        }
      }
    },
  },

  development: process.env.NODE_ENV !== "production",
});

console.log(`🚀 Backend server running at ${server.url}`);
