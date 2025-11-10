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
  readonly schedule = '*/1 * * * *'; // Every 15 minutes

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
      console.log('Starting conversation indexing job...');
      
      // Get only unindexed conversations
      const conversations = await this.fetchConversation();
      
      let indexedCount = 0;
      for (const conversation of conversations) {
        try {
          // Create content from conversation messages for embedding
          const messages = await this.conversationRepository.getConversationMessages(conversation.id);
          const conversationContent = this.createConversationContent(messages);
          
          // Create embedding for the conversation content
          const embedding = await this.embeddingService.createEmbedding(conversationContent);
          
          // Store in vector store
          await this.vectorStore.storeVector({
            embedding,
            embeddingModel: OpenAIEmbeddingService.EMBEDDING_MODEL,
            sourceType: 'Conversation',
            sourceId: conversation.id,
            metadata: {
              title: conversation.name || 'Untitled Conversation',
              messageCount: messages.length,
              createdAt: conversation.createdAt,
              updatedAt: conversation.updatedAt
            }
          });

          indexedCount++;
          console.log(`Indexed conversation ${conversation.id}`);
        } catch (error) {
          console.error(`Failed to index conversation ${conversation.id}:`, error);
        }
      }

      return this.createSuccessResult(
        `Conversation indexing completed. Indexed ${indexedCount} new conversations.`,
        { indexedCount, totalConversations: conversations.length }
      );
    } catch (error) {
      return this.createErrorResult(`Conversation indexing failed: ${error}`);
    }
  }

  private async fetchConversation() {
    // Get all conversations
    const conversations = await this.conversationRepository.getConversations();
    
    // Check all conversations in parallel
    const vectorChecks = await Promise.all(
      conversations.map(async (conversation) => {
        const existingVectors = await this.vectorStore.getVectorsBySource(conversation.id, 'Conversation');
        return { conversation, isIndexed: existingVectors.length > 0 };
      })
    );
    
    // Filter out already indexed conversations
    return vectorChecks
      .filter(check => !check.isIndexed)
      .map(check => check.conversation);
  }

  private createConversationContent(messages: ChatMessage[]): string {
    // Combine all messages into a single text for embedding
    return messages
      .map(message => `${message.role}: ${message.content}`)
      .join('\n');
  }

  async canRun(): Promise<boolean> {
    // Check environment variable (reloaded with each call)
    const enabled = process.env.ENABLE_CONVERSATION_INDEXING;
    return enabled === 'true' || enabled === '1';
  }
}
