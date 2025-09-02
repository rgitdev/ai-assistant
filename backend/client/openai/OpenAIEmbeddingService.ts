import OpenAI from "openai";
import type { CreateEmbeddingResponse } from "openai/resources/embeddings";

export class OpenAIEmbeddingService {
  public static readonly EMBEDDING_MODEL = "text-embedding-3-large";
  public static readonly VECTOR_SIZE = 3072

  private client: OpenAI;
  private model: string;
  private vectorSize: number;
  private readonly responseObservers: ((response: CreateEmbeddingResponse) => void)[] = [];

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }
    
    this.model = OpenAIEmbeddingService.EMBEDDING_MODEL;
    this.vectorSize = OpenAIEmbeddingService.VECTOR_SIZE;
    this.client = new OpenAI({
      apiKey: apiKey,
    });
  }

  public getVectorSize() : number {
    return this.vectorSize;
  }

  async createEmbedding(text: string): Promise<number[]> {
    try {
      const response: CreateEmbeddingResponse = await this.client.embeddings.create({
        model: this.model,
        input: text,
      });
       // Notify all observers with the full response
       this.notifyObservers(response);

      const embedding = response.data[0]?.embedding;
      if (!embedding) {
        throw new Error("No embedding in response");
      }
      return embedding;
    } catch (error) {
      console.error("Error creating embedding:", error);
      throw error;
    }
  }

  private notifyObservers(response: CreateEmbeddingResponse): void {
    this.responseObservers.forEach(observer => observer(response));
  }
} 