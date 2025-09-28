import { IJob, JobResult } from './IJob';

export abstract class BaseJob implements IJob {
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly schedule?: string;

  abstract execute(): Promise<JobResult>;

  async canRun(): Promise<boolean> {
    return true; // Override in subclasses for custom logic
  }

  async onSuccess(result: JobResult): Promise<void> {
    console.log(`Job ${this.name} completed successfully:`, result.message);
  }

  async onError(error: Error): Promise<void> {
    console.error(`Job ${this.name} failed:`, error.message);
  }

  protected createSuccessResult(message: string, data?: any): JobResult {
    return {
      success: true,
      message,
      data
    };
  }

  protected createErrorResult(error: string): JobResult {
    return {
      success: false,
      error
    };
  }
}
