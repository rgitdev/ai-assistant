import { JobScheduler } from '../../scheduler/JobScheduler';
import { IJob } from '../../jobs/IJob';

export class SchedulerService {
  private scheduler: JobScheduler;

  constructor() {
    this.scheduler = new JobScheduler();
  }

  async start(): Promise<void> {
    console.log('Starting scheduler service...');
    this.scheduler.start();
  }

  async stop(): Promise<void> {
    console.log('Stopping scheduler service...');
    this.scheduler.stop();
  }

  registerJob(job: IJob): void {
    console.log(`Registering job: ${job.name}`);
    this.scheduler.addJob(job);
  }

  unregisterJob(jobName: string): boolean {
    console.log(`Unregistering job: ${jobName}`);
    return this.scheduler.removeJob(jobName);
  }

  getStatus() {
    return this.scheduler.getStatus();
  }

  // Convenience method to run a job immediately
  async runJobNow(jobName: string): Promise<void> {
    const status = this.getStatus();
    const jobInfo = status.jobs.find(j => j.name === jobName);
    
    if (!jobInfo) {
      throw new Error(`Job ${jobName} not found`);
    }

    // This would require exposing the job instance from the scheduler
    // For now, this is a placeholder for future implementation
    console.log(`Manual execution of job ${jobName} requested`);
  }
}
