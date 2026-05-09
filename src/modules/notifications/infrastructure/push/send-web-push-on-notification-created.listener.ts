import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationCreatedEvent } from '../../domain/notifications/events/notification-created.event';
import { IChannelRepository } from '../../domain/channels/channel.repository.interface';
import { IPushSubscriptionRepository } from '../../domain/push/push-subscription.repository.interface';
import { WebPushService } from './web-push.service';

@Injectable()
export class SendWebPushOnNotificationCreatedListener {
  constructor(
    @Inject('CHAT_REPO')
    private readonly channelRepository: IChannelRepository,
    @Inject('PUSH_REPO')
    private readonly pushRepository: IPushSubscriptionRepository,
    private readonly webPushService: WebPushService,
  ) {}

  @OnEvent('notification.created', { async: true })
  async handleNotificationCreatedEvent(event: NotificationCreatedEvent): Promise<void> {
    const { notification } = event;
    try {
      const channel = await this.channelRepository.findById(notification.channelId);
      const channelTitle = channel?.title || 'New Notification';

      const members = await this.channelRepository.getMembers(notification.channelId);
      const otherMembers = members.filter((m) => m.userId !== notification.senderId);

      if (otherMembers.length === 0) return;

      const userIds = otherMembers.map((m) => m.userId);
      const subscriptions = await this.pushRepository.findByUserIds(userIds);

      for (const sub of subscriptions) {
        this.webPushService
          .sendNotification(sub, {
            title: channelTitle,
            body: notification.text,
            data: {
              channelId: notification.channelId,
              priority: notification.priority,
            },
          })
          .catch((err: any) => {
            if (err.statusCode === 410 || err.statusCode === 404) {
              // If the subscription is expired or inactive, delete it
              this.pushRepository.deleteByEndpoint(sub.endpoint).catch(() => {});
            }
          });
      }
    } catch (error) {
      console.error('Error in background Web Push dispatch:', error);
    }
  }
}
