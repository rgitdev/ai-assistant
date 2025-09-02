import type{ ChatCompletionMessageParam, ChatCompletion } from "openai/resources/chat/completions";
import OpenAI from "openai";

export class OpenAIImageService {

    public static readonly DALL_E_3 = "dall-e-3";
    public static readonly defaultModel = "gpt-4.1";
    
    private readonly client: OpenAI;

    constructor() {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error("OPENAI_API_KEY environment variable is not set");
        }
        this.client = new OpenAI({
            apiKey: apiKey,
        });
    }

    /**
     * Process an image from a URL with the given system prompt
     * @param imageUrl URL of the image to process
     * @param systemPrompt System prompt to guide the image analysis
     * @param model Model to use for processing
     * @returns JSON response from the model
     */
    async processImageFromUrl(imageUrl: string, systemPrompt: string, model: string = OpenAIImageService.defaultModel): Promise<string> {
        const messages: ChatCompletionMessageParam[] = [
            {
                role: "system",
                content: systemPrompt
            },
            {
                role: "user",
                content: [
                    {
                        type: "image_url",
                        image_url: {
                            url: imageUrl
                        }
                    }
                ]
            }
        ];
    
        const chatCompletion = await this.completion(messages, model, false, true, 2048) as ChatCompletion;
        return chatCompletion.choices[0]?.message?.content ?? 'No response generated';
    }

    /**
     * Process a base64 encoded image with the given system prompt
     * @param imageBase64 Base64 encoded image data
     * @param systemPrompt System prompt to guide the image analysis
     * @param model Model to use for processing
     * @returns JSON response from the model
     */
    async processImageFromBase64(imageBase64: string, systemPrompt: string, model: string = OpenAIImageService.defaultModel): Promise<string> {
        const messages: ChatCompletionMessageParam[] = [
            {
                role: "system",
                content: systemPrompt
            },
            {
                role: "user",
                content: [
                    {
                        type: "image_url",
                        image_url: {
                            url: `data:image/jpeg;base64,${imageBase64}`,
                            detail: "high"
                        }
                    }
                ]
            }
        ];
    
        const chatCompletion = await this.completion(messages, model, false, true, 2048) as ChatCompletion;
        return chatCompletion.choices[0]?.message?.content ?? 'No response generated';
    }

    private async completion(
        messages: ChatCompletionMessageParam[],
        model: string = "gpt-4",
        stream: boolean = false,
        jsonMode: boolean = true,
        maxTokens: number = 1024,
        temperature: number = 1.0
    ): Promise<OpenAI.Chat.Completions.ChatCompletion | AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>> {
        try {
            const chatCompletion = await this.client.chat.completions.create({
                messages,
                model,
                stream,
                max_tokens: maxTokens,
                response_format: jsonMode ? { type: "json_object" } : { type: "text" },
                temperature: temperature
            });
                    
            if (stream) {
                return chatCompletion as AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;
            } else {
                return chatCompletion as OpenAI.Chat.Completions.ChatCompletion;
            }
        } catch (error) {
            console.error("Error in OpenAI completion:", error);
            throw error;
        }
    }
    
    /**
     * Generate an image from a prompt
     * @param prompt Text prompt to generate an image from
     * @param model Model to use for image generation
     * @returns URL of the generated image
     */
    async generateImage(prompt: string, model: string = OpenAIImageService.DALL_E_3): Promise<string> {
        const response = await this.client.images.generate({
            prompt,
            n: 1,
            size: "1024x1024",
            model,
        });
        return response?.data?.[0]?.url ?? "";
    }
}