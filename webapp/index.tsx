import { serve } from "bun";
import index from "./index.html";
import { assistantController } from "./api/assistant/AssistantController";

const server = serve({
  routes: {
    // Serve index.html for all unmatched routes.
    "/*": index,

    // Assistant API routes
    "/api/assistant/*": { 
      async POST (req) {
      console.log("Assistant API request received");
      return assistantController.handleRequest(req);
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
