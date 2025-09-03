import { serve } from "bun";
import index from "./index.html";
import { assistantClient, ChatResponse } from "./client/AssistantClient";

const server = serve({
  routes: {
    // Serve index.html for all unmatched routes.
    "/*": index,

    // Assistant API routes
    "/api/assistant/health": {
      async GET(req): Promise<Response> {
        const backendHealth = await assistantClient.testConnection();
        return Response.json({ 
          timestamp: new Date().toISOString(),
          backend: backendHealth
        });
      }
    },

    "/api/assistant/*": { 
      async POST (req): Promise<Response> {
      console.log("Assistant API request received");
      return Response.json(await assistantClient.sendMessage(await req.json()));
    }},

    // Legacy API routes (keeping for compatibility)
    "/api/hello": {
      async GET(req) {
        return Response.json({
          message: "Hello, world!",
          method: "GET",
        });
      },
      async PUT(req) {
        return Response.json({
          message: "Hello, world!",
          method: "PUT",
        });
      },
    },

    "/api/hello/:name": async (req) => {
      const name = req.params.name;
      return Response.json({
        message: `Hello, ${name}!`,
      });
    },
  },

  development: process.env.NODE_ENV !== "production",
});

console.log(`🚀 Server running at ${server.url}`);
