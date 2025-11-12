import OpenAI, { toFile } from "openai";
import Langfuse, { observeOpenAI } from "langfuse";
import type { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";
import type { CompletionUsage } from "openai/resources/completions";
import type { ChatCompletion } from "openai/resources/chat/completions";
import type { ConversationMessage } from "./OpenAIService";
import type { ToolExecutor } from "./OpenAIService";



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
      timeout: 30000, // 10 seconds timeout
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
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "user", content: message }
    ];
    return this.sendMessagesInternal(messages);
  }

  async sendMessages(systemPrompt: string, message: string, responseFormat: { type: "json_object" | "text" } | undefined = undefined): Promise<string> {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: message }
    ];
    return this.sendMessagesInternal(messages, responseFormat);
  }

  async sendConversation(systemPrompt: string, messages: ConversationMessage[], responseFormat: { type: "json_object" | "text" } | undefined = undefined): Promise<string> {
    const formattedMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ];
    return this.sendMessagesInternal(formattedMessages, responseFormat);
  }

  /**
   * Sends a conversation with tool-calling support. Iteratively handles tool calls by
   * invoking the provided toolExecutor and appending tool results to the message history.
   */
  async sendConversationWithTools(
    systemPrompt: string,
    messages: ConversationMessage[],
    tools: ChatCompletionTool[] | undefined,
    toolExecutor: ToolExecutor,
    options: { maxToolIterations?: number; toolChoice?: "auto" | "none" } = {}
  ): Promise<string> {
    const { maxToolIterations = 5, toolChoice } = options;

    const openAIMessages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content }))
    ];

    // Prepare API params - only include tool_choice when tools are provided
    const apiParams: any = {
      model: this.model,
      messages: openAIMessages,
    };
    if (tools) {
      apiParams.tools = tools;
      if (toolChoice) {
        apiParams.tool_choice = toolChoice;
      }
    }

    // Initial round-trip
    let response = await (this.langfuseWrapper ? this.langfuseWrapper : this.client).chat.completions.create(apiParams);
    this.notifyObservers(response);
    if (this.langfuseWrapper) {
      await this.langfuseWrapper.flushAsync();
    }

    let iterations = 0;
    while (response.choices[0]?.message?.tool_calls && iterations < maxToolIterations) {
      const toolCalls = response.choices[0].message.tool_calls;

      // Record assistant message with tool calls
      openAIMessages.push({
        role: "assistant",
        content: response.choices[0].message.content,
        tool_calls: toolCalls
      });

      // Execute each function tool call
      for (const toolCall of toolCalls) {
        if (toolCall.type !== "function") continue;
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments ?? "{}");
        try {
          const result = await toolExecutor(toolName, toolArgs);
          openAIMessages.push({ role: "tool", tool_call_id: toolCall.id, content: JSON.stringify(result) });
        } catch (err) {
          openAIMessages.push({ role: "tool", tool_call_id: toolCall.id, content: JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }) });
        }
      }

      // Next round-trip; may return more tool calls or final answer
      // Reuse the same apiParams structure
      const followUpParams: any = {
        model: this.model,
        messages: openAIMessages,
      };
      if (tools) {
        followUpParams.tools = tools;
        if (toolChoice) {
          followUpParams.tool_choice = toolChoice;
        }
      }
      response = await (this.langfuseWrapper ? this.langfuseWrapper : this.client).chat.completions.create(followUpParams);
      this.notifyObservers(response);
      if (this.langfuseWrapper) {
        await this.langfuseWrapper.flushAsync();
      }

      iterations++;
    }

    if (iterations >= maxToolIterations) {
      console.warn(`Reached max tool iterations (${maxToolIterations})`);
    }

    return response.choices[0]?.message?.content ?? "";
  }

  private async sendMessagesInternal(messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[], responseFormat: { type: "json_object" | "text" } | undefined = undefined): Promise<string> {
    try {
      
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