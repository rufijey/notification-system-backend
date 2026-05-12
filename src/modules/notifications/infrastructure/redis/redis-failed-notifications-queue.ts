import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { IFailedNotificationsQueue, QueuedNotificationPayload } from '../../application/ports/failed-notifications-queue.port';

@Injectable()
export class RedisFailedNotificationsQueue implements IFailedNotificationsQueue {
  private readonly logger = new Logger(RedisFailedNotificationsQueue.name);

  constructor(
    @InjectQueue('failed_notifications')
    private readonly queue: Queue,
  ) { }

  async enqueue(payload: QueuedNotificationPayload): Promise<void> {
    this.logger.log(`Enqueuing failed notification to BullMQ with exponential backoff for channel ${payload.channelId}...`);

    await this.queue.add('retry_notification', payload, {
      delay: 5000,
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    });
  }
}
