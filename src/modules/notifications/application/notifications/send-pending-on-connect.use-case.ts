import { Inject, Injectable } from '@nestjs/common';
import { INotificationRepository } from '../../domain/notifications/notification.repository.interface';
import { Notification } from '../../domain/notifications/notification.entity';
import { IChannelRepository } from '../../domain/channels/channel.repository.interface';
import {
  INotificationsSender,
  MESSENGER_SENDER,
} from '../ports/notifications-sender.port';

@Injectable()
export class SendPendingOnConnectUseCase {
  constructor(
    @Inject('MESSAGE_REPO')
    private readonly notificationRepository: INotificationRepository,
    @Inject('CHAT_REPO')
    private readonly channelRepository: IChannelRepository,
    @Inject(MESSENGER_SENDER)
    private readonly sender: INotificationsSender,
  ) { }

  async execute(userId: string): Promise<void> {
    const channels = await this.channelRepository.getChannelsByUserId(userId);

    const syncRequests = channels.map((channel) => ({
      channelId: channel.id,
      lastSequence: channel.lastReadSequence,
    }));

    if (syncRequests.length === 0) return;

    const missedNotifications =
      await this.notificationRepository.findMissedNotificationsBulk(
        syncRequests,
      );

    const channelStatusCache: Record<string, { otherLastRead: number; myLastRead: number }> = {};

    for (const notification of missedNotifications) {
      if (channelStatusCache[notification.channelId] === undefined) {
        const otherLastRead = await this.channelRepository.getOtherMembersLastReadSequence(
          notification.channelId,
          userId,
        );
        const myLastRead = await this.channelRepository.getUserLastReadSequence(
          notification.channelId,
          userId,
        );
        channelStatusCache[notification.channelId] = { otherLastRead, myLastRead };
      }

      const { otherLastRead, myLastRead } = channelStatusCache[notification.channelId];
      const status = Notification.determineStatus(
        notification.senderId,
        userId,
        notification.sequence,
        otherLastRead,
        myLastRead,
      );

      this.sender.send(userId, {
        id: notification.id,
        channelId: notification.channelId,
        senderId: notification.senderId,
        text: notification.text,
        status: status,
        createdAt: notification.createdAt,
        sequence: notification.sequence,
        clientNotificationId: notification.clientNotificationId,
      });
    }
  }
}
