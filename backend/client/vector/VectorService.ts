import { QdrantClient } from '@qdrant/js-client-rest';
import { OpenAIEmbeddingService } from '../openai/OpenAIEmbeddingService';
import { VectorRecord } from '../../models/VectorRecord';

export interface IPoint {
  id: string;
  vector: number[];
  payload: {
    sourceId: string;
    sourceType: string;
    metadata?: Record<string, any>;
  };
}
export class VectorService {
  private client: QdrantClient;
  private openAIEmbeddingService: OpenAIEmbeddingService;

  constructor(openAIEmbeddingService: OpenAIEmbeddingService) {
    this.client = new QdrantClient({
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
    });
    this.openAIEmbeddingService = openAIEmbeddingService;
  }

  async ensureCollection(name: string) : Promise<string> {
    const collections = await this.client.getCollections();
    if (!collections.collections.some(c => c.name === name)) {
      await this.client.createCollection(name, {
        vectors: { size: this.openAIEmbeddingService.getVectorSize(), distance: "Cosine" }
      });
      return `Collection '${name}' created`;
    }
    return `Collection '${name}' already exists`;
  }



  async sendPoints(collectionName: string, points: IPoint[]) : Promise<string> {
    try {
    await this.client.upsert(collectionName, {
        wait: true,
        points: points
      });
    } catch (error) {
      console.error('Full error:', error);
      return `Error sending points to collection '${collectionName}'`;
    }
    return `Points sent to collection '${collectionName}'`;
  }

  async sendVectorRecords(collectionName: string, vectorRecords: VectorRecord[]): Promise<string> {
    const points: IPoint[] = vectorRecords.map(record => ({
      id: record.id,
      vector: record.embedding,
      payload: {
        sourceId: record.sourceId,
        sourceType: record.sourceType,
        metadata: record.metadata
      }
    }));

    return this.sendPoints(collectionName, points);
  }


  async performSearch(collectionName: string, queryVector: number[], filter: Record<string, any> = {}, limit: number = 15) {
    return this.client.search(collectionName, {
      vector: queryVector,
      limit,
      with_payload: true,
      filter
    });
  }

  async searchBySourceType(collectionName: string, queryVector: number[], sourceType: string, limit: number = 15) {
    const filter = {
      must: [
        {
          key: "sourceType",
          match: {
            value: sourceType
          }
        }
      ]
    };

    return this.performSearch(collectionName, queryVector, filter, limit);
  }

}