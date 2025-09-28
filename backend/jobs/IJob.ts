export interface JobResult {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

export interface IJob {
  readonly name: string;
  readonly description: string;
  readonly schedule?: string; // Cron expression
  
  execute(): Promise<JobResult>;
  canRun(): Promise<boolean>;
  onSuccess?(result: JobResult): Promise<void>;
  onError?(error: Error): Promise<void>;
}
