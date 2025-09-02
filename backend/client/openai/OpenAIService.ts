import type { ChatCompletion } from "openai/resources/chat/completions";
import { OpenAIChatService } from "./OpenAIChatService";
import { OpenAIImageService } from "./OpenAIImageService";


export type UrlString = string;

export type Base64String = string;

export type JsonString = string;

export interface ConversationMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface IOpenAIService {
  sendChatMessage(systemPrompt: string, message: string): Promise<JsonString>;
  sendChatMessages(systemPrompt: string, messages: ConversationMessage[]): Promise<JsonString>;
  generateImage(prompt: string, model?: string): Promise<UrlString>;
  processImageFromUrl(imageUrl: UrlString, systemPrompt: string, model?: string): Promise<JsonString>;
  processImageFromBase64(imageBase64: Base64String, systemPrompt: string, model?: string): Promise<JsonString>;
  attachResponseObserver(observer: (response: ChatCompletion) => void): void;
}

export class OpenAIService implements IOpenAIService {

  public static readonly GPT_4O = "gpt-4o";
  public static readonly GPT_41 = "gpt-4.1";
  public static readonly GPT_4O_MINI = "gpt-4o-mini";
  public static readonly DALL_E_3 = "dall-e-3";

  private readonly chatService: OpenAIChatService;
  private readonly imageService: OpenAIImageService;

  constructor(model: string = OpenAIService.GPT_41, withLangfuse: boolean = true) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }
    this.chatService = new OpenAIChatService(model, withLangfuse);
    this.imageService = new OpenAIImageService();
  }

  async sendChatMessage(systemPrompt: string, message: string): Promise<JsonString> {
    return this.chatService.sendMessages(systemPrompt, message, { type: "text" });
  }

  async sendChatMessages(systemPrompt: string, messages: ConversationMessage[]): Promise<JsonString> {
    return this.chatService.sendConversation(systemPrompt, messages, { type: "text" });
  }

  async generateImage(prompt: string, model: string = OpenAIService.DALL_E_3): Promise<UrlString> {
    return this.imageService.generateImage(prompt, model);
  }

  async processImageFromUrl(imageUrl: UrlString, systemPrompt: string, model: string = OpenAIImageService.defaultModel): Promise<JsonString> {
    return this.imageService.processImageFromUrl(imageUrl, systemPrompt, model);
  }

  async processImageFromBase64(imageBase64: Base64String, systemPrompt: string, model: string = OpenAIImageService.defaultModel): Promise<JsonString> {
    return this.imageService.processImageFromBase64(imageBase64, systemPrompt, model);
  }

  public attachResponseObserver(observer: (response: ChatCompletion) => void): void {
    this.chatService.attachResponseObserver(observer);
  }

  public shutdown(): void {
    this.chatService.shutdown();
  }
} 