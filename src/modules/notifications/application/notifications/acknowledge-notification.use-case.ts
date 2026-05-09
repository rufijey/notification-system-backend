import { Inject, Injectable } from '@nestjs/common';
import { INotificationRepository } from '../../domain/notifications/notification.repository.interface';
import { IChannelRepository } from '../../domain/channels/channel.repository.interface';
import {
  INotificationsSender,
  MESSENGER_SENDER,
} from '../ports/notifications-sender.port';

@Injectable()
export class AcknowledgeNotificationUseCase {
  constructor(
    @Inject('MESSAGE_REPO')
    private readonly notificationRepository: INotificationRepository,
    @Inject(MESSENGER_SENDER)
    private readonly sender: INotificationsSender,
  ) { }

  async execute(userId: string, notificationId: string): Promise<void> {
    const notification =
      await this.notificationRepository.findById(notificationId);
    if (!notification) return;

    this.sender.sendDelivered(notification.channelId, {
      channelId: notification.channelId,
      userId: userId,
      notificationId: notificationId,
    });
  }
}
