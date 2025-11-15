import { serve } from "bun";
import index from "./index.html";
import { assistantClient, ChatResponse } from "./client/AssistantClient";
import { imageClient } from "./client/ImageClient";

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

    // Image proxy endpoint - proxies to backend via ImageClient
    "/api/images/*": {
      async GET(req): Promise<Response> {
        const url = new URL(req.url);
        const pathParts = url.pathname.split('/');
        const imageId = pathParts[pathParts.length - 1];

        if (!imageId) {
          return Response.json({ error: 'Invalid image ID' }, { status: 400 });
        }

        try {
          const response = await imageClient.getImage(imageId);

          if (!response.ok) {
            return Response.json(
              { error: 'Image not found' },
              { status: response.status }
            );
          }

          // Forward the image with the same content-type and caching headers
          const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
          const imageData = await response.arrayBuffer();

          return new Response(imageData, {
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=31536000, immutable'
            }
          });
        } catch (error) {
          console.error('Error proxying image:', error);
          return Response.json(
            { error: 'Failed to fetch image' },
            { status: 500 }
          );
        }
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
