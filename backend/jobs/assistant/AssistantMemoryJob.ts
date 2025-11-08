import { BaseJob } from '../BaseJob';
import { Assistant } from '@backend/assistant/Assistant';
import { IConversationRepository } from '@backend/repository/IConversationRepository';
import { ConversationRepositoryFactory } from '@backend/repository/ConversationRepositoryFactory';
import { MemoryCategory } from '@backend/models/Memory';

/**
 * Background job that creates memories from conversations.
 * Orchestrates the memory creation process by using the Assistant class.
 * Assistant orchestrates between MemoryCreator and AssistantService.
 */
export class AssistantMemoryJob extends BaseJob {
  readonly name = 'assistant-memory-creation';
  readonly description = 'Create memories from recent conversations';
  readonly schedule = '*/5 * * * *'; // Every 5 minutes

  private assistant: Assistant;
  private conversationRepository: IConversationRepository;

  constructor() {
    super();
    this.assistant = new Assistant();
    this.conversationRepository = new ConversationRepositoryFactory().build();
  }

  async execute() {
    try {
      console.log('Starting assistant memory creation job...');

      // Get all conversations
      const conversations = await this.conversationRepository.getConversations();

      let createdMemoriesCount = 0;
      const memoryCategories = [
        MemoryCategory.CONVERSATION,
        MemoryCategory.USER_PROFILE,
        MemoryCategory.ASSISTANT_PERSONA
      ];

      for (const conversation of conversations) {
        try {
          // Get messages for this conversation
          const messages = await this.conversationRepository.getConversationMessages(conversation.id);

          // Skip conversations with too few messages (need at least 2 for meaningful memory)
          if (messages.length < 2) {
            console.log(`Skipping conversation ${conversation.id} - insufficient messages (${messages.length})`);
            continue;
          }

          // Create memories for each category
          for (const category of memoryCategories) {
            try {
              // Create memory using Assistant orchestration (handles duplicate check internally)
              const memory = await this.assistant.createMemoryForConversation(
                conversation.id,
                category
              );

              if (memory) {
                createdMemoriesCount++;
                console.log(`Created ${category} memory: ${memory.id}`);
              } else {
                console.log(`Memory already exists for conversation ${conversation.id}, category ${category}`);
              }
            } catch (error) {
              console.error(`Failed to create ${category} memory for conversation ${conversation.id}:`, error);
            }
          }
        } catch (error) {
          console.error(`Failed to process conversation ${conversation.id}:`, error);
        }
      }

      return this.createSuccessResult(
        `Memory creation completed. Created ${createdMemoriesCount} new memories.`,
        {
          createdMemoriesCount,
          totalConversations: conversations.length,
          categoriesProcessed: memoryCategories.length
        }
      );
    } catch (error) {
      return this.createErrorResult(`Memory creation job failed: ${error}`);
    }
  }

  async canRun(): Promise<boolean> {
    // Check if Assistant is properly initialized
    try {
      return this.assistant !== null;
    } catch {
      return false;
    }
  }
}
