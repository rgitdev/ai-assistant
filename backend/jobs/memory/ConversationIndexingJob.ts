import { BaseJob } from '../BaseJob';
import { VectorStore } from '../../client/vector/VectorStore';
import { OpenAIEmbeddingService } from '../../client/openai/OpenAIEmbeddingService';
import { IConversationRepository } from '@backend/repository/IConversationRepository';
import { ConversationRepositoryFactory } from '@backend/repository/ConversationRepositoryFactory';
import { ChatMessage, Conversation } from '../../models/ChatMessage';
import { VectorRecord } from '../../models/VectorRecord';

export class ConversationIndexingJob extends BaseJob {
  readonly name = 'conversation-indexing';
  readonly description = 'Update vector embeddings for new conversations';
  readonly schedule = '*/1 * * * *'; // Every minute

  private conversationRepository: IConversationRepository;
  private vectorStore: VectorStore;
  private embeddingService: OpenAIEmbeddingService;

  constructor() {
    super();
    this.conversationRepository = new ConversationRepositoryFactory().build();
    this.vectorStore = new VectorStore();
    this.embeddingService = new OpenAIEmbeddingService();
  }

  async execute() {
    try {
      console.log('🧠 [conversation-indexing] Starting conversation indexing job...');

      const conversations = await this.fetchConversations();
      const candidates = await this.filterConversationsToIndex(conversations);

      let indexedCount = 0;
      let reindexedCount = 0;
      let skippedCount = conversations.length - candidates.length;

      for (const candidate of candidates) {
        try {
          const { embedding, messages } = await this.createEmbeddingForConversation(candidate.conversation.id);
          await this.upsertVector(candidate, messages.length, embedding);
          if (candidate.action === 'create') {
            indexedCount++;
            console.log(`🆕 [conversation-indexing] Indexed conversation ${candidate.conversation.id}`);
          } else if (candidate.action === 'update') {
            reindexedCount++;
            console.log(`🔄 [conversation-indexing] Reindexed conversation ${candidate.conversation.id}`);
          }
        } catch (error) {
          console.error(`Failed to index conversation ${candidate.conversation.id}:`, error);
        }
      }

      return this.createSuccessResult(
        `Conversation indexing completed. Indexed ${indexedCount}, reindexed ${reindexedCount}, skipped ${skippedCount}.`,
        { indexedCount, reindexedCount, skippedCount, totalConversations: conversations.length }
      );
    } catch (error) {
      return this.createErrorResult(`Conversation indexing failed: ${error}`);
    }
  }

  // --------------------
  // Internal helpers
  // --------------------

  private async fetchConversations(): Promise<Conversation[]> {
    return this.conversationRepository.getConversations();
  }

  private async getNewestVector(conversationId: string): Promise<VectorRecord | undefined> {
    const vectors = await this.vectorStore.getVectorsBySource(conversationId, 'Conversation');
    if (vectors.length === 0) return undefined;
    return vectors
      .slice()
      .sort((a, b) => new Date(b.updatedAt as any).getTime() - new Date(a.updatedAt as any).getTime())[0];
  }

  private determineAction(conversation: Conversation, newestVector?: VectorRecord): 'create' | 'update' | 'skip' {
    if (!newestVector) return 'create';

    const conversationUpdatedAt = new Date(conversation.updatedAt || conversation.createdAt);
    const vectorUpdatedAt = new Date((newestVector.updatedAt as any) || (newestVector.createdAt as any));
    return conversationUpdatedAt.getTime() > vectorUpdatedAt.getTime() ? 'update' : 'skip';
  }

  private async filterConversationsToIndex(conversations: Conversation[]): Promise<Array<{ conversation: Conversation; action: 'create' | 'update'; targetVectorId?: string }>> {
    const results: Array<{ conversation: Conversation; action: 'create' | 'update'; targetVectorId?: string }> = [];
    for (const conversation of conversations) {
      const newest = await this.getNewestVector(conversation.id);
      const action = this.determineAction(conversation, newest);
      if (action === 'skip') continue;
      results.push({ conversation, action, targetVectorId: newest?.id });
    }
    return results;
  }

  private async createEmbeddingForConversation(conversationId: string): Promise<{ embedding: number[]; messages: ChatMessage[] }> {
    const messages = await this.conversationRepository.getConversationMessages(conversationId);
    const content = this.createConversationContent(messages);
    const embedding = await this.embeddingService.createEmbedding(content);
    return { embedding, messages };
  }

  private async upsertVector(
    candidate: { conversation: Conversation; action: 'create' | 'update'; targetVectorId?: string },
    messageCount: number,
    embedding: number[]
  ): Promise<void> {
    const { conversation, action, targetVectorId } = candidate;
    const baseMetadata = {
      title: conversation.name || 'Untitled Conversation',
      messageCount,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    } as Record<string, any>;

    if (action === 'create') {
      await this.vectorStore.storeVector({
        embedding,
        embeddingModel: OpenAIEmbeddingService.EMBEDDING_MODEL,
        sourceType: 'Conversation',
        sourceId: conversation.id,
        metadata: baseMetadata,
      });
      return;
    }

    if (action === 'update' && targetVectorId) {
      await this.vectorStore.updateVector(targetVectorId, {
        embedding,
        embeddingModel: OpenAIEmbeddingService.EMBEDDING_MODEL,
        sourceType: 'Conversation',
        sourceId: conversation.id,
        metadata: baseMetadata,
      });
    }
  }

  private createConversationContent(messages: ChatMessage[]): string {
    // Combine all messages into a single text for embedding
    return messages
      .map(message => `${message.role}: ${message.content}`)
      .join('\n');
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
