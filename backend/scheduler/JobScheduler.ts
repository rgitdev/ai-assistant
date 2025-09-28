import { IJob } from '../jobs/IJob';
import { CronExpression } from './CronExpression';

export interface ScheduledJob {
  job: IJob;
  cron: CronExpression;
  lastRun?: Date;
  nextRun?: Date;
  isRunning: boolean;
}

export class JobScheduler {
  private jobs: Map<string, ScheduledJob> = new Map();
  private intervalId?: NodeJS.Timeout;
  private isRunning = false;

  addJob(job: IJob): void {
    if (!job.schedule) {
      throw new Error(`Job ${job.name} must have a schedule`);
    }

    const cron = new CronExpression(job.schedule);
    const scheduledJob: ScheduledJob = {
      job,
      cron,
      isRunning: false
    };

    this.jobs.set(job.name, scheduledJob);
    this.updateNextRun(scheduledJob);
  }

  removeJob(jobName: string): boolean {
    return this.jobs.delete(jobName);
  }

  start(): void {
    if (this.isRunning) {
      console.warn('Scheduler is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting job scheduler...');

    // Check every minute
    this.intervalId = setInterval(() => {
      this.checkAndRunJobs();
    }, 60000);

    // Run immediately on start
    this.checkAndRunJobs();
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.isRunning = false;
    console.log('Job scheduler stopped');
  }

  getStatus(): { isRunning: boolean; jobs: Array<{ name: string; nextRun?: Date; lastRun?: Date }> } {
    return {
      isRunning: this.isRunning,
      jobs: Array.from(this.jobs.values()).map(scheduledJob => ({
        name: scheduledJob.job.name,
        nextRun: scheduledJob.nextRun,
        lastRun: scheduledJob.lastRun
      }))
    };
  }

  private async checkAndRunJobs(): Promise<void> {
    const now = new Date();
    
    for (const scheduledJob of this.jobs.values()) {
      if (scheduledJob.isRunning) continue;
      if (!scheduledJob.nextRun) continue;
      if (scheduledJob.nextRun > now) continue;

      this.runJob(scheduledJob);
    }
  }

  private async runJob(scheduledJob: ScheduledJob): Promise<void> {
    if (scheduledJob.isRunning) return;

    const canRun = await scheduledJob.job.canRun();
    if (!canRun) {
      console.log(`Job ${scheduledJob.job.name} cannot run at this time`);
      this.updateNextRun(scheduledJob);
      return;
    }

    scheduledJob.isRunning = true;
    scheduledJob.lastRun = new Date();

    try {
      console.log(`Running job: ${scheduledJob.job.name}`);
      const result = await scheduledJob.job.execute();
      
      if (result.success) {
        await scheduledJob.job.onSuccess?.(result);
      } else {
        console.error(`Job ${scheduledJob.job.name} failed:`, result.error);
        await scheduledJob.job.onError?.(new Error(result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error(`Job ${scheduledJob.job.name} threw an error:`, error);
      await scheduledJob.job.onError?.(error as Error);
    } finally {
      scheduledJob.isRunning = false;
      this.updateNextRun(scheduledJob);
    }
  }

  private updateNextRun(scheduledJob: ScheduledJob): void {
    try {
      scheduledJob.nextRun = scheduledJob.cron.getNextRun(new Date());
    } catch (error) {
      console.error(`Failed to calculate next run for job ${scheduledJob.job.name}:`, error);
    }
  }
}
