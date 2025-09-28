import { SchedulerService } from './SchedulerService';
import { ConversationIndexingJob } from '../../jobs/memory/ConversationIndexingJob';

export class SchedulerInitializer {
  private schedulerService: SchedulerService;

  constructor() {
    this.schedulerService = new SchedulerService();
  }

  async initialize(): Promise<void> {
    console.log('Initializing scheduler with default jobs...');

    // Register all default jobs
    this.schedulerService.registerJob(new ConversationIndexingJob());

    // Start the scheduler
    await this.schedulerService.start();

    console.log('Scheduler initialized successfully');
  }

  async shutdown(): Promise<void> {
    console.log('Shutting down scheduler...');
    await this.schedulerService.stop();
  }

  getStatus() {
    return this.schedulerService.getStatus();
  }
}
