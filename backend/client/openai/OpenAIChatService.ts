import OpenAI, { toFile } from "openai";
import Langfuse, { observeOpenAI } from "langfuse";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type { CompletionUsage } from "openai/resources/completions";
import type { ChatCompletion } from "openai/resources/chat/completions";



export class OpenAIChatService {
  public static readonly GPT_4O = "gpt-4o";
  public static readonly GPT_41 = "gpt-4.1";
  public static readonly GPT_4O_MINI = "gpt-4o-mini";
  
  private readonly client: OpenAI;
  private readonly langfuseWrapper: OpenAI & Pick<Langfuse, "flushAsync" | "shutdownAsync"> | undefined;
  private readonly model: string;
  private readonly responseObservers: ((response: ChatCompletion) => void)[] = [];

  constructor(model: string, withLangfuse: boolean = true) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }
    
    this.model = model;

    this.client = new OpenAI({
      apiKey: apiKey,
      timeout: 10000, // 10 seconds timeout
    });

    this.langfuseWrapper = undefined;
    if (withLangfuse) {
      console.debug("Attaching Langfuse");
      this.langfuseWrapper =  observeOpenAI(this.client);
      this.client = this.langfuseWrapper;
    } 
  }

  public attachResponseObserver(observer: (response: ChatCompletion) => void): void {
    this.responseObservers.push(observer);
  }

  async sendMessage(message: string): Promise<string> {
    return this.sendMessagesInternal(undefined, message);
  }

  async sendMessages(systemPrompt: string, message: string, responseFormat: { type: "json_object" | "text" } | undefined = undefined): Promise<string> {
    return this.sendMessagesInternal(systemPrompt, message, responseFormat);
  }

  private async sendMessagesInternal(systemPrompt: string | undefined, message: string, responseFormat: { type: "json_object" | "text" } | undefined = undefined): Promise<string> {
    try {
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        ...(systemPrompt ? [{ role: "system", content: systemPrompt } as const] : []),
        { role: "user", content: message } as const
      ];
      
      const response = await (this.langfuseWrapper ? this.langfuseWrapper : this.client).chat.completions.create({
        model: this.model,
        messages,
        response_format: responseFormat
      });
      
      // Notify all observers with the full response
      this.notifyObservers(response);

      if (this.langfuseWrapper) {
        await this.langfuseWrapper.flushAsync(); 
      }

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No content in response");
      }
      return content;
    } catch (error) {
      console.error("Error sending chat message:", error);
      throw error;
    }
  }

  protected notifyObservers(response: ChatCompletion): void {
    this.responseObservers.forEach(observer => observer(response));
  }

  public shutdown(): void {
    if (this.langfuseWrapper) {
      this.langfuseWrapper.shutdownAsync();
    }
  }
} 