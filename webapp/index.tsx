import { serve } from "bun";
import index from "./index.html";
import { assistantClient, ChatResponse } from "./client/AssistantClient";
import { ImageController } from "./api/images/ImageController";

// Create controller instances
const imageController = new ImageController();

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

    // Image proxy endpoint - proxies to backend
    "/api/images/*": {
      async GET(req): Promise<Response> {
        const url = new URL(req.url);
        const pathParts = url.pathname.split('/');
        const imageId = pathParts[pathParts.length - 1];

        if (!imageId) {
          return Response.json({ error: 'Invalid image ID' }, { status: 400 });
        }

        // Check if requesting metadata
        if (pathParts[pathParts.length - 1] === 'metadata') {
          const actualImageId = pathParts[pathParts.length - 2];
          return imageController.getImageMetadata(actualImageId);
        }

        // Get image file
        return imageController.getImage(imageId);
      }
    },

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
