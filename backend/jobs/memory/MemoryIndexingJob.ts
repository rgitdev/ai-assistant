import { BaseJob } from '../BaseJob';
import { MemoryService } from '../../services/memory/MemoryService';
import { VectorStore } from '../../client/vector/VectorStore';
import { OpenAIEmbeddingService } from '../../client/openai/OpenAIEmbeddingService';

export class MemoryIndexingJob extends BaseJob {
  readonly name = 'memory-indexing';
  readonly description = 'Update vector embeddings for new memories';
  readonly schedule = '*/15 * * * *'; // Every 15 minutes

  private memoryService: MemoryService;
  private vectorStore: VectorStore;
  private embeddingService: OpenAIEmbeddingService;

  constructor() {
    super();
    this.memoryService = new MemoryService();
    this.vectorStore = new VectorStore();
    this.embeddingService = new OpenAIEmbeddingService();
  }

  async execute() {
    try {
      console.log('Starting memory indexing job...');
      
      // Get memories that haven't been indexed yet
      const memories = await this.memoryService.getAllMemories();
      const unindexedMemories = memories.filter(memory => !memory.vectorId);
      
      let indexedCount = 0;
      for (const memory of unindexedMemories) {
        try {
          // Create embedding for the memory content
          const embedding = await this.embeddingService.createEmbedding(memory.content);
          
          // Store in vector store
          const vectorId = await this.vectorStore.addVector({
            id: `memory-${memory.id}`,
            embedding,
            metadata: {
              sourceType: 'Memory',
              sourceId: memory.id,
              category: memory.category,
              importance: memory.importance,
              timestamp: memory.timestamp
            }
          });

          // Update memory with vector ID
          await this.memoryService.updateMemory({
            ...memory,
            vectorId
          });

          indexedCount++;
        } catch (error) {
          console.error(`Failed to index memory ${memory.id}:`, error);
        }
      }

      return this.createSuccessResult(
        `Memory indexing completed. Indexed ${indexedCount} new memories.`,
        { indexedCount, totalUnindexed: unindexedMemories.length }
      );
    } catch (error) {
      return this.createErrorResult(`Memory indexing failed: ${error}`);
    }
  }

  async canRun(): Promise<boolean> {
    // Check if embedding service is available
    try {
      await this.embeddingService.createEmbedding('test');
      return true;
    } catch {
      return false;
    }
  }
}
