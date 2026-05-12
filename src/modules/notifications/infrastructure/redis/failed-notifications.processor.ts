import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Logger, OnModuleInit } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { ProcessNotificationUseCase } from '../../application/notifications/process-notification.use-case';

@Processor('failed_notifications')
export class FailedNotificationsProcessor extends WorkerHost implements OnModuleInit {
  private readonly logger = new Logger(FailedNotificationsProcessor.name);
  private isCheckingHealth = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly processNotificationUseCase: ProcessNotificationUseCase,
    @InjectQueue('failed_notifications')
    private readonly queue: Queue,
  ) {
    super();
  }

  onModuleInit() {
    // Check DB health every 10 seconds only if the queue was paused, to resume it automatically
    setInterval(async () => {
      await this.checkAndResumeQueue();
    }, 10000);
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const payload = job.data;
    this.logger.log(`[Processor] Processing job ${job.id} for channel ${payload.channelId}...`);

    // 1. Healthcheck: Check if the database is online before doing anything
    const isDbOnline = await this.checkDatabaseHealth();
    if (!isDbOnline) {
      this.logger.warn(`[Circuit Breaker] Database is offline. Pausing failed_notifications queue to prevent jobs from exhausting attempts.`);
      
      // Pause the queue so no other pending jobs are processed or exhaust their retries
      await this.queue.pause();
      
      throw new Error('Database is offline. Queue paused by Circuit Breaker.');
    }

    // 2. Try to process/save notification with throwOnError = true
    await this.processNotificationUseCase.execute(
      payload.channelId,
      payload.senderId,
      payload.text,
      payload.clientNotificationId,
      payload.priority,
      payload.parentNotificationId,
      true, // throwOnError = true
    );

    this.logger.log(`[Processor] Job ${job.id} successfully processed and notification saved.`);
  }

  private async checkAndResumeQueue() {
    if (this.isCheckingHealth) {
      return;
    }

    try {
      const isPaused = await this.queue.isPaused();
      if (!isPaused) {
        return;
      }

      this.isCheckingHealth = true;
      this.logger.log('[Circuit Breaker] Checking database health to resume paused queue...');
      
      const isDbOnline = await this.checkDatabaseHealth();
      if (isDbOnline) {
        this.logger.log('[Circuit Breaker] Database is back online! Resuming failed_notifications queue.');
        await this.queue.resume();
      } else {
        this.logger.warn('[Circuit Breaker] Database is still offline. Queue remains paused.');
      }
    } catch (err) {
      this.logger.error('[Circuit Breaker] Error in healthcheck/resume routine:', err);
    } finally {
      this.isCheckingHealth = false;
    }
  }

  private async checkDatabaseHealth(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (err) {
      return false;
    }
  }
}
