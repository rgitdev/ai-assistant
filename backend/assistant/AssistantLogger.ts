/**
 * AssistantLogger - Domain-specific logger for Assistant operations
 * Provides clean, readable logging for conversation flow, queries, and memory operations
 */

import { Logger } from "@backend/utils/Logger";

export class AssistantLogger {
  private logger: Logger;

  constructor() {
    this.logger = new Logger(
      'assistant',
      '🤖',
      process.env.ASSISTANT_LOGGING_ENABLED?.toLowerCase() === 'true'
    );
  }

  /**
   * Enable or disable logging at runtime
   */
  setEnabled(enabled: boolean): void {
    this.logger.setEnabled(enabled);
  }

  /**
   * Check if logging is enabled
   */
  isEnabled(): boolean {
    return this.logger.isEnabled();
  }

  // Query operations

  /**
   * Log query extraction from user message
   */
  logQueryExtraction(queries: any[]): void {
    if (queries.length === 0) {
      this.logger.log('No queries generated');
      return;
    }

    const queryList = queries
      .map((q, i) => `Query ${i + 1} [${q.type}]: "${q.query}"`)
      .join(', ');

    this.logger.log(`Generated ${queries.length} ${queries.length === 1 ? 'query' : 'queries'}: ${queryList}`);
  }

  /**
   * Log query resolution results
   */
  logQueryResolution(results: any[]): void {
    if (results.length === 0) {
      this.logger.log('Query resolution: No memories found');
      return;
    }

    const resultSummary = results
      .map((r, i) => {
        const category = r.memory?.category || 'unknown';
        const score = r.relevanceScore ? r.relevanceScore.toFixed(2) : 'N/A';
        const content = r.memory?.content ? r.memory.content.substring(0, 40).replace(/\n/g, ' ') : 'N/A';
        return `${i + 1}. [${category}] "${content}..." (score: ${score})`;
      })
      .join('\n    ');

    this.logger.log(`Query resolution: Found ${results.length} ${results.length === 1 ? 'memory' : 'memories'}\n    ${resultSummary}`);
  }

  // Conversation flow

  /**
   * Log new conversation creation
   */
  logNewConversation(conversationId: string, message: string): void {
    const shortId = conversationId.substring(0, 8);
    const preview = message.length > 50 ? message.substring(0, 50).replace(/\n/g, ' ') + '...' : message;
    this.logger.log(`New conversation [${shortId}]: "${preview}"`);
  }

  /**
   * Log message in existing conversation
   */
  logMessage(conversationId: string, message: string): void {
    const shortId = conversationId.substring(0, 8);
    const preview = message.length > 50 ? message.substring(0, 50).replace(/\n/g, ' ') + '...' : message;
    this.logger.log(`Message [${shortId}]: "${preview}"`);
  }

  /**
   * Log response generation (single line, cut at ~60 chars)
   */
  logResponseGenerated(conversationId: string, response: string): void {
    const shortId = conversationId.substring(0, 8);
    const preview = response.length > 60 ? response.substring(0, 60).replace(/\n/g, ' ') + '...' : response.replace(/\n/g, ' ');
    this.logger.log(`Response [${shortId}]: "${preview}"`);
  }

  /**
   * Log message edit
   */
  logMessageEdit(conversationId: string, messageId: string): void {
    const shortConvId = conversationId.substring(0, 8);
    const shortMsgId = messageId.substring(0, 8);
    this.logger.log(`Editing message [${shortMsgId}] in conversation [${shortConvId}]`);
  }

  // Memory operations

  /**
   * Log memory creation success
   */
  logMemoryCreated(category: string, memoryId: string, conversationId: string): void {
    const shortMemId = memoryId.substring(0, 8);
    const shortConvId = conversationId.substring(0, 8);
    this.logger.log(`Memory created [${category}] ID: ${shortMemId} from conversation [${shortConvId}]`);
  }

  /**
   * Log when memory already exists
   */
  logMemoryAlreadyExists(category: string, conversationId: string): void {
    const shortConvId = conversationId.substring(0, 8);
    this.logger.warn(`Memory [${category}] already exists for conversation [${shortConvId}]`);
  }
}

// Export singleton instance
export const assistantLogger = new AssistantLogger();
