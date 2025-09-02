import { OpenAIService } from "./OpenAIService";

export class OpenAIServiceFactory {
  public static readonly GPT_4O = "gpt-4o";
  public static readonly GPT_41 = "gpt-4.1";
  public static readonly GPT_41_MINI = "gpt-4.1-mini";
  public static readonly DALL_E_3 = "dall-e-3";
  public static readonly DEFAULT_MODEL = OpenAIService.GPT_41;
  private modelParam: string = OpenAIServiceFactory.DEFAULT_MODEL;
  private withLangfuseParam: boolean = true;

    /**
   * Sets the model to use for the chat service
   * @param model The model identifier
   * @returns The factory instance for method chaining
   */
  model(model: string): OpenAIServiceFactory {
    this.modelParam = model;
    return this;
  }

  /**
   * Enables Langfuse for the chat service
   * @returns The factory instance for method chaining
   */
  withLangfuse(withLangfuse: boolean): OpenAIServiceFactory {
    this.withLangfuseParam = withLangfuse;
    return this;
  }
  /**
   * Builds and returns the configured chat service instance
   * @returns An instance of OpenAIChatService or its subclasses
   * @throws Error if cache directory is required but not provided
   */
  build(): OpenAIService {
        return new OpenAIService(this.modelParam, this.withLangfuseParam);
  }
}