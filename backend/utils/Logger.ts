/**
 * Logger utility for Assistant operations
 * Provides structured logging with icons and configurable enable/disable
 */

export enum LogLevel {
  INFO = 'info',
  DEBUG = 'debug',
  WARN = 'warn',
  ERROR = 'error'
}

export class AssistantLogger {
  private enabled: boolean;
  private readonly icon = '🤖';
  private readonly name = 'assistant';

  constructor(enabled?: boolean) {
    // Check environment variable first, then fall back to parameter, default to false
    const envEnabled = process.env.ASSISTANT_LOGGING_ENABLED?.toLowerCase() === 'true';
    this.enabled = enabled !== undefined ? enabled : envEnabled;
  }

  /**
   * Enable or disable logging at runtime
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if logging is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Format log message with icon and name prefix
   */
  private format(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const prefix = `${this.icon} [${this.name}] [${level.toUpperCase()}] ${timestamp}`;
    return data ? `${prefix} - ${message}\n${JSON.stringify(data, null, 2)}` : `${prefix} - ${message}`;
  }

  /**
   * Log info message
   */
  info(message: string, data?: any): void {
    if (!this.enabled) return;
    console.log(this.format(LogLevel.INFO, message, data));
  }

  /**
   * Log debug message
   */
  debug(message: string, data?: any): void {
    if (!this.enabled) return;
    console.debug(this.format(LogLevel.DEBUG, message, data));
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: any): void {
    if (!this.enabled) return;
    console.warn(this.format(LogLevel.WARN, message, data));
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | any): void {
    if (!this.enabled) return;
    const errorData = error instanceof Error
      ? { message: error.message, stack: error.stack }
      : error;
    console.error(this.format(LogLevel.ERROR, message, errorData));
  }

  /**
   * Log query extraction
   */
  logQueryExtraction(messageContent: string, queries: any[]): void {
    if (!this.enabled) return;
    this.info(`Query extraction from user message`, {
      messagePreview: messageContent.substring(0, 100) + (messageContent.length > 100 ? '...' : ''),
      queriesGenerated: queries.length,
      queries: queries.map(q => ({
        type: q.type,
        query: q.query,
        priority: q.priority
      }))
    });
  }

  /**
   * Log query resolution
   */
  logQueryResolution(queries: any[], results: any[]): void {
    if (!this.enabled) return;
    this.info(`Query resolution completed`, {
      queriesProcessed: queries.length,
      resultsFound: results.length,
      results: results.map(r => ({
        query: r.query?.query || 'unknown',
        memoryId: r.memory?.id,
        memoryCategory: r.memory?.category,
        relevanceScore: r.relevanceScore
      }))
    });
  }

  /**
   * Log memory retrieval
   */
  logMemoryRetrieval(category: string, count: number, memoryIds?: string[]): void {
    if (!this.enabled) return;
    this.info(`Memory retrieval: ${category}`, {
      category,
      count,
      memoryIds
    });
  }

  /**
   * Log memory creation
   */
  logMemoryCreation(conversationId: string, category: string, memoryId?: string, success: boolean = true): void {
    if (!this.enabled) return;
    if (success) {
      this.info(`Memory created`, {
        conversationId,
        category,
        memoryId
      });
    } else {
      this.warn(`Memory creation skipped (already exists)`, {
        conversationId,
        category
      });
    }
  }

  /**
   * Log conversation flow
   */
  logConversationFlow(action: string, conversationId: string, details?: any): void {
    if (!this.enabled) return;
    this.debug(`Conversation flow: ${action}`, {
      conversationId,
      ...details
    });
  }

  /**
   * Log message handling
   */
  logMessageHandling(conversationId: string, messagePreview: string, isNew: boolean): void {
    if (!this.enabled) return;
    this.info(`${isNew ? 'New conversation' : 'Existing conversation'} - handling message`, {
      conversationId,
      messagePreview: messagePreview.substring(0, 100) + (messagePreview.length > 100 ? '...' : ''),
      isNewConversation: isNew
    });
  }

  /**
   * Log response generation
   */
  logResponseGeneration(conversationId: string, messageCount: number, responsePreview: string): void {
    if (!this.enabled) return;
    this.info(`Response generated`, {
      conversationId,
      messageCount,
      responsePreview: responsePreview.substring(0, 100) + (responsePreview.length > 100 ? '...' : '')
    });
  }
}

// Export a singleton instance
export const assistantLogger = new AssistantLogger();
