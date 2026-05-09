import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { ProcessNotificationUseCase } from '../application/notifications/process-notification.use-case';
import { NotificationPriority } from '../domain/notifications/notification-priority.enum';

@Controller()
export class NotificationsConsumer {
  private readonly logger = new Logger(NotificationsConsumer.name);

  constructor(
    private readonly processNotificationUseCase: ProcessNotificationUseCase,
  ) {}

  @EventPattern('notification_created')
  async handleNotificationCreated(
    @Payload()
    data: {
      channelId: string;
      senderId: string;
      text: string;
      clientNotificationId?: string;
      priority?: NotificationPriority;
      parentNotificationId?: string;
    },
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      await this.processNotificationUseCase.execute(
        data.channelId,
        data.senderId,
        data.text,
        data.clientNotificationId,
        data.priority,
        data.parentNotificationId,
      );
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error('Failed to process notification', error);
      channel.nack(originalMsg, false, true);
    }
  }
}
