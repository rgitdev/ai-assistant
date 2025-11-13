import { OpenAIService, ConversationMessage } from "backend/client/openai/OpenAIService";
import { OpenAIServiceFactory } from "backend/client/openai/OpenAIServiceFactory";
import { AssistantPromptBuilder } from "backend/assistant/AssistantPromptBuilder";

/**
 * Service responsible for OpenAI communication.
 * Keeps dependencies simple - only uses OpenAI client.
 */
export class AssistantService {

  private readonly openAIService: OpenAIService;

  constructor(openAIService?: OpenAIService) {
    // Allow dependency injection for testing, create default if not provided
    if (openAIService) {
      this.openAIService = openAIService;
    } else {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error("OPENAI_API_KEY environment variable is not set");
      }
      const openAIFactory = new OpenAIServiceFactory();
      this.openAIService = openAIFactory.build();
    }
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
   * Create memory from conversation messages using OpenAI.
   * Returns JSON string with memory data.
   *
   * @param systemPrompt The system prompt for memory creation
   * @param messages The conversation messages
   * @returns JSON string with memory data
   */
  async createMemory(systemPrompt: string, messages: ConversationMessage[]): Promise<string> {
    if (!messages || messages.length === 0) {
      throw new Error("messages are required to create a memory");
    }

    // Call OpenAI with JSON response format
    const responseJson = await this.openAIService.sendMessages(
      systemPrompt,
      messages
    );

    return responseJson;
  }

}

if (require.main === module) {
  const assistant = new AssistantService();
  const promptBuilder = new AssistantPromptBuilder();
  const systemPrompt = promptBuilder.buildSystemPrompt();
  assistant.sendMessage(systemPrompt, "Hello, how are you? what's your name?").then(console.log);
}