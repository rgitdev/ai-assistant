import { OpenAIService } from "backend/client/openai/OpenAIService";
import { OpenAIServiceFactory } from "backend/client/openai/OpenAIServiceFactory";
import { systemPrompt } from "./prompts/systemPrompt";

export class Assistant {
  
  openAIService: OpenAIService;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }
    const factory = new OpenAIServiceFactory();
    this.openAIService = factory.build();
  }


  async sendMessage(message: string): Promise<string> {
    console.log("Sending message to assistant:", message);
    const response = await this.openAIService.sendChatMessages(systemPrompt, message);
    return response;
  }

  async getConversation(conversationId: string): Promise<string> {
    return conversationId;
  }
}

if (require.main === module) {
  const assistant = new Assistant();
  assistant.sendMessage("Hello, how are you? what's your name?").then(console.log);
}