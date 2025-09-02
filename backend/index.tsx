import { serve } from "bun";
import { assistantController } from "./api/assistant/AssistantController";

const server = serve({
  port: 3001,
  routes: {
    // Assistant API routes - handle all methods and paths
    "/api/assistant/*": async (req) => {
      console.log(`Assistant API request received: ${req.method} ${req.url}`);
      return assistantController.handleRequest(req);
    },
  },

  development: process.env.NODE_ENV !== "production",
});

console.log(`🚀 Backend server running at ${server.url}`);
