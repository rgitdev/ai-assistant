import { serve } from "bun";
import { AssistantController } from "./api/assistant/AssistantController";
import { conversationController } from "./api/conversation/ConversationController";
import { ChatEditRequest, ChatRequest } from "./models/ChatMessage";
import { SchedulerInitializer } from "./services/scheduler/SchedulerInitializer";
import { registerAllServices } from "./registerServices";

// Initialize DI container at startup
console.log('Initializing DI container...');
registerAllServices();
console.log('DI container initialized');

// Create controller instances AFTER service registration
const assistantController = new AssistantController();

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, OPTIONS',
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
      async OPTIONS(req) {
        return addCorsHeaders(new Response(null, { status: 200 }));
      },
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
    
    "/api/assistant/chat/*": {
      async OPTIONS(req) {
        return addCorsHeaders(new Response(null, { status: 200 }));
      },
      async PUT(req) {
        console.log(`Edit chat request: ${req.method} ${req.url}`);
        const url = new URL(req.url);
        const pathParts = url.pathname.split('/');
        const messageId = pathParts[pathParts.length - 1];
        if (!messageId) {
          return addCorsHeaders(Response.json({ error: 'Invalid message ID' }, { status: 400 }));
        }
        try {
          const requestBody: ChatEditRequest = await req.json();
          const result = await assistantController.handleEditChat(messageId, requestBody);
          return addCorsHeaders(Response.json(result));
        } catch (error) {
          console.error('Error editing chat:', error);
          const status = error instanceof Error && (error.message.includes('required') || error.message.includes('Only the last')) ? 400 : 500;
          return addCorsHeaders(Response.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status }));
        }
      }
    },

    "/api/assistant/health": {
      async OPTIONS(req) {
        return addCorsHeaders(new Response(null, { status: 200 }));
      },
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
      async OPTIONS(req) {
        return addCorsHeaders(new Response(null, { status: 200 }));
      },
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
      async OPTIONS(req) {
        return addCorsHeaders(new Response(null, { status: 200 }));
      },
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
      },
      
      async PUT(req) {
        console.log(`Update conversation request: ${req.method} ${req.url}`);
        
        const url = new URL(req.url);
        const pathParts = url.pathname.split('/');
        const conversationId = pathParts[pathParts.length - 1];
        
        if (!conversationId) {
          return addCorsHeaders(Response.json({ error: 'Invalid conversation ID' }, { status: 400 }));
        }

        try {
          const requestBody = await req.json();
          if (!requestBody.name || typeof requestBody.name !== 'string') {
            return addCorsHeaders(Response.json({ error: 'Name is required and must be a string' }, { status: 400 }));
          }
          
          const result = await conversationController.updateConversation(conversationId, { name: requestBody.name });
          return addCorsHeaders(Response.json(result));
        } catch (error) {
          console.error('Error updating conversation:', error);
          const status = error instanceof Error && error.message.includes('not found') ? 404 : 500;
          return addCorsHeaders(Response.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status }));
        }
      }
    },
  },

  development: process.env.NODE_ENV !== "production",
});

// Initialize and start the scheduler
const scheduler = new SchedulerInitializer();
scheduler.initialize().catch(error => {
  console.error('Failed to initialize scheduler:', error);
});

console.log(`🚀 Backend server running at ${server.url}`);
