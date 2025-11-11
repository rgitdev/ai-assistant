#!/usr/bin/env bun
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Import existing services
import { MemorySearchService } from "./services/memory/MemorySearchService";
import { ConversationService } from "./services/conversation/ConversationService";
import { ConversationRepositoryFactory } from "./repository/ConversationRepositoryFactory";
import { MemoryRepositoryFactory } from "./repository/memory/MemoryRepositoryFactory";
import { VectorStore } from "./client/vector/VectorStore";
import { OpenAIEmbeddingService } from "./client/openai/OpenAIEmbeddingService";

// Import MCP tools
import {
  searchMemoriesDefinition,
  searchMemoriesHandler,
  memoryResourceDefinitions,
  memoryResourceHandler,
} from './mcp-tools/memory';

import {
  getConversationDefinition,
  getConversationHandler,
  listConversationsDefinition,
  listConversationsHandler,
} from './mcp-tools/conversation';

/**
 * MCP Server for AI Assistant
 * Exposes memory and conversation features via Model Context Protocol
 */
class AssistantMCPServer {
  private server: Server;
  private memorySearchService: MemorySearchService;
  private conversationService: ConversationService;
  private memoryRepository: any;

  constructor() {
    // Initialize services (reusing existing architecture)
    const vectorStore = new VectorStore();
    const embeddingService = new OpenAIEmbeddingService();
    this.memorySearchService = new MemorySearchService(vectorStore, embeddingService);

    const conversationRepoFactory = new ConversationRepositoryFactory();
    const conversationRepository = conversationRepoFactory.build();
    this.conversationService = new ConversationService(conversationRepository);

    const memoryRepoFactory = new MemoryRepositoryFactory();
    this.memoryRepository = memoryRepoFactory.build();

    // Initialize MCP server
    this.server = new Server(
      {
        name: "ai-assistant",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        searchMemoriesDefinition,
        getConversationDefinition,
        listConversationsDefinition,
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "search_memories":
            return await searchMemoriesHandler(args, {
              memorySearchService: this.memorySearchService,
            });

          case "get_conversation":
            return await getConversationHandler(args, {
              conversationService: this.conversationService,
            });

          case "list_conversations":
            return await listConversationsHandler(args, {
              conversationService: this.conversationService,
            });

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ error: errorMessage }),
            },
          ],
          isError: true,
        };
      }
    });

    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: memoryResourceDefinitions,
    }));

    // Handle resource reads
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      try {
        return await memoryResourceHandler(uri, {
          memoryRepository: this.memoryRepository,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to read resource ${uri}: ${errorMessage}`);
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("AI Assistant MCP server running on stdio");
  }
}

// Start the server
const server = new AssistantMCPServer();
server.run().catch(console.error);
