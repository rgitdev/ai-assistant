import type { ChatCompletion, ChatCompletionTool } from "openai/resources/chat/completions";
import { OpenAIChatService } from "./OpenAIChatService";
import { OpenAIImageService } from "./OpenAIImageService";


export type UrlString = string;

export type Base64String = string;

export type JsonString = string;

// Callback used to execute a tool/function call emitted by the model
export type ToolExecutor = (name: string, args: any) => Promise<any>;

export type MessageContent = string | Array<{
  type: "text" | "image_url";
  text?: string;
  image_url?: { url: string };
}>;

export interface ConversationMessage {
  role: "user" | "assistant" | "system";
  content: MessageContent;
}

export interface IOpenAIService {
  sendChatMessage(systemPrompt: string, message: string): Promise<JsonString>;
  sendChatMessages(systemPrompt: string, messages: ConversationMessage[]): Promise<JsonString>;
  /**
   * Send a conversation with OpenAI tool-calling support.
   * The provided toolExecutor will be invoked for each tool call returned by the model.
   */
  sendConversationWithTools(
    systemPrompt: string,
    messages: ConversationMessage[],
    tools: ChatCompletionTool[] | undefined,
    toolExecutor: ToolExecutor,
    options?: { maxToolIterations?: number; toolChoice?: "auto" | "none" }
  ): Promise<JsonString>;
  
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

  async sendMessages(systemPrompt: string, messages: ConversationMessage[]): Promise<JsonString> {
    return this.chatService.sendConversation(systemPrompt, messages, { type: "json_object" });
  }

  async sendConversationWithTools(
    systemPrompt: string,
    messages: ConversationMessage[],
    tools: ChatCompletionTool[] | undefined,
    toolExecutor: ToolExecutor,
    options?: { maxToolIterations?: number; toolChoice?: "auto" | "none" }
  ): Promise<JsonString> {
    // Delegate to chat service implementation
    // Response format is text by default when tools are involved
    // Observers and Langfuse handling are performed inside chat service
    // The chat service will loop until tool-calling completes or max iterations reached
    // and return the final assistant message content.
    // Keeping method on this facade to avoid leaking chat service details to callers.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.chatService.sendConversationWithTools(
      systemPrompt,
      messages,
      tools,
      toolExecutor,
      options
    );
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