import { serve } from "bun";
import index from "./index.html";
import { assistantController } from "../webapp/api/assistant/AssistantController";

const server = serve({
  routes: {
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

    // Assistant API routes
    "/api/assistant/*": async (req) => {
      return assistantController.handleRequest(req);
    },

    // Serve index.html for all unmatched routes (must be last)
    "/*": index,
  },

  development: process.env.NODE_ENV !== "production",
});

console.log(`🚀 Server running at ${server.url}`);
