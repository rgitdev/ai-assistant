import { BaseJob } from '../BaseJob';
import { VectorStore } from '../../client/vector/VectorStore';
import { OpenAIEmbeddingService } from '../../client/openai/OpenAIEmbeddingService';
import { IConversationRepository } from '@backend/repository/IConversationRepository';
import { ConversationRepositoryFactory } from '@backend/repository/ConversationRepositoryFactory';
import { ChatMessage } from '../../models/ChatMessage';
import { v4 as uuidv4 } from 'uuid';

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
      
      // Get all conversations
      const conversations = await this.conversationRepository.getConversations();
      
      let indexedCount = 0;
      let reindexedCount = 0;
      let skippedCount = 0;
      for (const conversation of conversations) {
        try {
          // Check existing vectors for this conversation
          const existingVectors = await this.vectorStore.getVectorsBySource(
            conversation.id,
            'Conversation'
          );

          // Determine whether we need to create a new vector or update an existing one
          if (existingVectors.length === 0) {
            // New conversation: index
            const messages = await this.conversationRepository.getConversationMessages(conversation.id);
            const conversationContent = this.createConversationContent(messages);
            const embedding = await this.embeddingService.createEmbedding(conversationContent);

            await this.vectorStore.storeVector({
              embedding,
              embeddingModel: OpenAIEmbeddingService.EMBEDDING_MODEL,
              sourceType: 'Conversation',
              sourceId: conversation.id,
              metadata: {
                title: (conversation as any).name || 'Untitled Conversation',
                messageCount: messages.length,
                createdAt: conversation.createdAt,
                updatedAt: conversation.updatedAt,
              },
            });

            indexedCount++;
            console.log(`🆕 [conversation-indexing] Indexed conversation ${conversation.id}`);
          } else {
            // Existing vector(s) present: reindex only if conversation updated since last vector update
            const newestVector = existingVectors
              .slice()
              .sort((a, b) => new Date(b.updatedAt as any).getTime() - new Date(a.updatedAt as any).getTime())[0];

            const conversationUpdatedAt = new Date(
              (conversation as any).updatedAt || (conversation as any).createdAt
            );
            const vectorUpdatedAt = new Date(
              (newestVector.updatedAt as any) || (newestVector.createdAt as any)
            );

            if (conversationUpdatedAt.getTime() > vectorUpdatedAt.getTime()) {
              const messages = await this.conversationRepository.getConversationMessages(conversation.id);
              const conversationContent = this.createConversationContent(messages);
              const embedding = await this.embeddingService.createEmbedding(conversationContent);

              await this.vectorStore.updateVector(newestVector.id, {
                embedding,
                embeddingModel: OpenAIEmbeddingService.EMBEDDING_MODEL,
                sourceId: conversation.id,
                sourceType: 'Conversation',
                metadata: {
                  ...(newestVector.metadata || {}),
                  title: (conversation as any).name || 'Untitled Conversation',
                  messageCount: messages.length,
                  createdAt: (conversation as any).createdAt,
                  updatedAt: (conversation as any).updatedAt,
                },
              });

              reindexedCount++;
              console.log(`🔄 [conversation-indexing] Reindexed conversation ${conversation.id}`);
            } else {
              // Up-to-date, skip without noisy logs
              skippedCount++;
            }
          }
        } catch (error) {
          console.error(`Failed to index conversation ${conversation.id}:`, error);
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
