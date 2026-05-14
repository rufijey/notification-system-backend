import { Inject, Injectable } from '@nestjs/common';
import { IChannelRepository } from '../../domain/channels/channel.repository.interface';
import { INotificationRepository } from '../../domain/notifications/notification.repository.interface';
import {
  INotificationsSender,
  MESSENGER_SENDER,
} from '../ports/notifications-sender.port';

@Injectable()
export class ReadNotificationUseCase {
  constructor(
    @Inject('CHAT_REPO')
    private readonly channelRepository: IChannelRepository,
    @Inject('MESSAGE_REPO')
    private readonly notificationRepository: INotificationRepository,
    @Inject(MESSENGER_SENDER)
    private readonly sender: INotificationsSender,
  ) { }

  async execute(userId: string, notificationId: string): Promise<void> {
    const notification =
      await this.notificationRepository.findById(notificationId);
    if (!notification) return;

    const currentSequence =
      await this.channelRepository.getUserLastReadSequence(
        notification.channelId,
        userId,
      );

    if (notification.sequence > currentSequence) {
      await this.channelRepository.updateLastReadSequence(
        notification.channelId,
        userId,
        notification.sequence,
      );

      this.sender.sendMessageRead(notification.channelId, {
        channelId: notification.channelId,
        userId: userId,
        sequence: notification.sequence,
      });
    }
  }
}
