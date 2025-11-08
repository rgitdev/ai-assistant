import { OpenAIService, ConversationMessage } from "backend/client/openai/OpenAIService";
import { OpenAIServiceFactory } from "backend/client/openai/OpenAIServiceFactory";
import { AssistantPromptBuilder } from "backend/assistant/AssistantPromptBuilder";
import { ChatMessage } from "backend/models/ChatMessage";
import { z } from "zod";

const CreatedMemoryResponseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  memory: z.string().min(1, "Memory content is required"),
});

export type CreatedMemoryResponse = z.infer<typeof CreatedMemoryResponseSchema>;

/**
 * Service responsible for OpenAI communication.
 * Keeps dependencies simple - only uses OpenAI client.
 */
export class AssistantService {

  private readonly openAIService: OpenAIService;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }
    const openAIFactory = new OpenAIServiceFactory();
    this.openAIService = openAIFactory.build();
  }


  /**
   * Send a single message to the assistant
   */
  async sendMessage(systemPrompt: string, message: string): Promise<string> {
    console.log("Sending message to assistant:", message);
    const response = await this.openAIService.sendChatMessage(systemPrompt, message);
    return response;
  }

  /**
   * Send a conversation (multiple messages) to the assistant
   */
  async sendConversation(systemPrompt: string, messages: ConversationMessage[]): Promise<string> {
    console.log("Sending conversation to assistant:", messages.length, "messages");
    const response = await this.openAIService.sendChatMessages(systemPrompt, messages);
    return response;
  }

  /**
   * Create memory input from conversation messages using OpenAI.
   * This method handles the LLM interaction for memory creation.
   *
   * @param systemPrompt The system prompt for memory creation (e.g., conversation summary, user profile, etc.)
   * @param messages The conversation messages to create memory from
   * @returns Object with title and memory content
   */
  async createMemoryInput(systemPrompt: string, messages: ChatMessage[]): Promise<CreatedMemoryResponse> {
    if (!messages || messages.length === 0) {
      throw new Error("messages are required to create a memory");
    }

    // Convert ChatMessage to OpenAI ConversationMessage format
    const openAIMessages: ConversationMessage[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Call OpenAI with JSON response format
    const responseRawJson = await this.openAIService.sendMessages(
      systemPrompt,
      openAIMessages
    );

    // Parse and validate response
    const responseJson = JSON.parse(responseRawJson);
    const validatedResponse = CreatedMemoryResponseSchema.parse(responseJson);

    return validatedResponse;
  }

}

if (require.main === module) {
  const assistant = new AssistantService();
  const promptBuilder = new AssistantPromptBuilder();
  const systemPrompt = promptBuilder.buildSystemPrompt();
  assistant.sendMessage(systemPrompt, "Hello, how are you? what's your name?").then(console.log);
}