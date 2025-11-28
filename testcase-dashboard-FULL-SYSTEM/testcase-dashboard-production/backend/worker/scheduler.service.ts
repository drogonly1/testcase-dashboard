// worker/scheduler.service.ts
import Bull, { Queue, Job, JobOptions } from 'bull';
import { PrismaClient } from '@prisma/client';
import { ExcelCollector } from './excel-collector';

const prisma = new PrismaClient();

interface CollectionJobData {
  source: 'excel' | 'gsheet';
  filePath?: string;
  spreadsheetId?: string;
  sheetName?: string;
}

interface AutoUpdateConfig extends CollectionJobData {
  interval: number; // minutes
}

export class SchedulerService {
  private queue: Queue<CollectionJobData>;
  private collector: ExcelCollector;

  constructor() {
    // Initialize Bull queue with Redis
    this.queue = new Bull<CollectionJobData>('testcase-collection', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD
      },
      defaultJobOptions: {
        removeOnComplete: 20, // Keep last 20 completed jobs
        removeOnFail: 50,     // Keep last 50 failed jobs
        attempts: 3,          // Retry 3 times on failure
        backoff: {
          type: 'exponential',
          delay: 5000        // Start with 5 second delay
        }
      }
    });

    this.collector = new ExcelCollector();
    this.setupProcessors();
    this.setupEventHandlers();
  }

  /**
   * Setup job processors
   */
  private setupProcessors(): void {
    this.queue.process('collect-data', async (job: Job<CollectionJobData>) => {
      console.log(`[Scheduler] Processing job ${job.id} (attempt ${job.attemptsMade + 1}/${job.opts.attempts})`);
      
      const { source, filePath, spreadsheetId, sheetName } = job.data;

      try {
        if (source === 'excel') {
          if (!filePath) {
            throw new Error('Excel file path is required');
          }
          await this.collector.collectFromExcel(filePath, sheetName);
        } else if (source === 'gsheet') {
          // TODO: Implement Google Sheets collection
          throw new Error('Google Sheets collection not yet implemented');
        } else {
          throw new Error(`Unknown source type: ${source}`);
        }

        // Update last collection timestamp
        await prisma.setting.update({
          where: { id: 1 },
          data: { lastCollectionAt: new Date() }
        });

        console.log(`[Scheduler] Job ${job.id} completed successfully`);
        return { success: true, timestamp: new Date().toISOString() };
      } catch (error) {
        console.error(`[Scheduler] Job ${job.id} failed:`, error);
        
        // If this is the last attempt, create an alert
        if (job.attemptsMade + 1 >= (job.opts.attempts || 3)) {
          await this.createFailureAlert(job, error);
        }
        
        throw error;
      }
    });
  }

  /**
   * Setup event handlers for monitoring
   */
  private setupEventHandlers(): void {
    this.queue.on('completed', (job: Job, result: any) => {
      console.log(`[Scheduler] ✓ Job ${job.id} completed:`, result);
    });

    this.queue.on('failed', (job: Job, error: Error) => {
      console.error(`[Scheduler] ✗ Job ${job.id} failed:`, error.message);
    });

    this.queue.on('stalled', (job: Job) => {
      console.warn(`[Scheduler] ⚠ Job ${job.id} stalled`);
    });

    this.queue.on('progress', (job: Job, progress: number) => {
      console.log(`[Scheduler] ⟳ Job ${job.id} progress: ${progress}%`);
    });
  }

  /**
   * Enable auto-update with recurring job
   */
  async enableAutoUpdate(config: AutoUpdateConfig): Promise<void> {
    console.log(`[Scheduler] Enabling auto-update with interval: ${config.interval} minutes`);

    // Remove any existing repeatable jobs first
    await this.disableAutoUpdate();

    // Create repeatable job
    const jobOptions: JobOptions = {
      repeat: {
        every: config.interval * 60 * 1000, // Convert minutes to milliseconds
        immediately: true // Run immediately when enabled
      },
      jobId: 'auto-update-job' // Fixed ID for easy management
    };

    await this.queue.add('collect-data', {
      source: config.source,
      filePath: config.filePath,
      spreadsheetId: config.spreadsheetId,
      sheetName: config.sheetName
    }, jobOptions);

    // Update settings in database
    await prisma.setting.upsert({
      where: { id: 1 },
      create: {
        autoUpdateEnabled: true,
        collectionInterval: config.interval,
        sourceType: config.source,
        sourcePath: config.filePath,
        spreadsheetId: config.spreadsheetId,
        sheetName: config.sheetName
      },
      update: {
        autoUpdateEnabled: true,
        collectionInterval: config.interval,
        sourceType: config.source,
        sourcePath: config.filePath,
        spreadsheetId: config.spreadsheetId,
        sheetName: config.sheetName,
        updatedAt: new Date()
      }
    });

    console.log(`[Scheduler] Auto-update enabled successfully`);
  }

  /**
   * Disable auto-update
   */
  async disableAutoUpdate(): Promise<void> {
    console.log('[Scheduler] Disabling auto-update');

    // Remove all repeatable jobs
    const repeatableJobs = await this.queue.getRepeatableJobs();
    
    for (const job of repeatableJobs) {
      await this.queue.removeRepeatableByKey(job.key);
      console.log(`[Scheduler] Removed repeatable job: ${job.key}`);
    }

    // Update settings
    await prisma.setting.update({
      where: { id: 1 },
      data: {
        autoUpdateEnabled: false,
        updatedAt: new Date()
      }
    });

    console.log('[Scheduler] Auto-update disabled');
  }

  /**
   * Update interval (re-schedule with new interval)
   */
  async updateInterval(newIntervalMinutes: number): Promise<void> {
    console.log(`[Scheduler] Updating interval to ${newIntervalMinutes} minutes`);

    const currentSettings = await prisma.setting.findFirst();
    
    if (!currentSettings || !currentSettings.autoUpdateEnabled) {
      throw new Error('Auto-update is not enabled');
    }

    await this.enableAutoUpdate({
      interval: newIntervalMinutes,
      source: currentSettings.sourceType as 'excel' | 'gsheet',
      filePath: currentSettings.sourcePath || undefined,
      spreadsheetId: currentSettings.spreadsheetId || undefined,
      sheetName: currentSettings.sheetName || undefined
    });
  }

  /**
   * Trigger manual collection (high priority)
   */
  async triggerManualCollection(config: CollectionJobData): Promise<Job<CollectionJobData>> {
    console.log('[Scheduler] Triggering manual collection');

    const job = await this.queue.add('collect-data', config, {
      priority: 1, // High priority
      attempts: 1, // Don't retry manual triggers
      removeOnComplete: true
    });

    return job;
  }

  /**
   * Get queue status
   */
  async getQueueStatus(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: boolean;
  }> {
    const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
      this.queue.isPaused()
    ]);

    return { waiting, active, completed, failed, delayed, paused };
  }

  /**
   * Get recent jobs
   */
  async getRecentJobs(count: number = 10): Promise<Job<CollectionJobData>[]> {
    const jobs = await this.queue.getJobs(
      ['completed', 'failed', 'active', 'waiting'],
      0,
      count,
      false
    );
    return jobs;
  }

  /**
   * Clean old jobs (older than specified days)
   */
  async cleanOldJobs(daysOld: number = 30): Promise<void> {
    console.log(`[Scheduler] Cleaning jobs older than ${daysOld} days`);
    
    const grace = daysOld * 24 * 60 * 60 * 1000; // Convert to milliseconds
    
    await this.queue.clean(grace, 'completed');
    await this.queue.clean(grace, 'failed');
    
    console.log('[Scheduler] Old jobs cleaned');
  }

  /**
   * Create alert for collection failure
   */
  private async createFailureAlert(job: Job<CollectionJobData>, error: any): Promise<void> {
    try {
      await prisma.alert.create({
        data: {
          alertType: 'COLLECTION_FAILED',
          severity: 'CRITICAL',
          message: `Data collection failed after ${job.opts.attempts} attempts`,
          details: {
            jobId: job.id,
            source: job.data.source,
            error: error.message,
            timestamp: new Date().toISOString()
          },
          acknowledged: false
        }
      });
    } catch (err) {
      console.error('[Scheduler] Failed to create alert:', err);
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    console.log('[Scheduler] Shutting down...');
    await this.queue.close();
    await prisma.$disconnect();
    console.log('[Scheduler] Shutdown complete');
  }
}

// CLI interface
if (require.main === module) {
  const scheduler = new SchedulerService();
  const command = process.argv[2];

  const execute = async () => {
    switch (command) {
      case 'enable':
        await scheduler.enableAutoUpdate({
          interval: parseInt(process.argv[3]) || 30,
          source: 'excel',
          filePath: process.argv[4] || '/data/testcases.xlsx'
        });
        break;

      case 'disable':
        await scheduler.disableAutoUpdate();
        break;

      case 'trigger':
        await scheduler.triggerManualCollection({
          source: 'excel',
          filePath: process.argv[3] || '/data/testcases.xlsx'
        });
        break;

      case 'status':
        const status = await scheduler.getQueueStatus();
        console.log('Queue Status:', status);
        break;

      case 'jobs':
        const jobs = await scheduler.getRecentJobs(20);
        console.log(`Recent Jobs (${jobs.length}):`);
        jobs.forEach(job => {
          console.log(`- Job ${job.id}: ${job.name} (${job.finishedOn ? 'completed' : 'pending'})`);
        });
        break;

      case 'clean':
        await scheduler.cleanOldJobs(30);
        break;

      default:
        console.log('Usage:');
        console.log('  node scheduler.service.js enable [interval] [file_path]');
        console.log('  node scheduler.service.js disable');
        console.log('  node scheduler.service.js trigger [file_path]');
        console.log('  node scheduler.service.js status');
        console.log('  node scheduler.service.js jobs');
        console.log('  node scheduler.service.js clean');
    }
  };

  execute()
    .then(() => {
      console.log('Command completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Command failed:', error);
      process.exit(1);
    });
}
