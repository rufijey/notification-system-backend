import { Inject, Injectable } from '@nestjs/common';
import { INotificationRepository } from '../../domain/notifications/notification.repository.interface';
import { IChannelRepository } from '../../domain/channels/channel.repository.interface';
import { NotificationWithStatus } from './get-channel-history.use-case';
import { Notification } from '../../domain/notifications/notification.entity';
import { NotificationPriority } from '../../domain/notifications/notification-priority.enum';

export interface SyncRequestDto {
  channelId: string;
  lastSequence: number;
}

@Injectable()
export class SyncNotificationsUseCase {
  constructor(
    @Inject('MESSAGE_REPO')
    private readonly notificationRepo: INotificationRepository,
    @Inject('CHAT_REPO')
    private readonly channelRepo: IChannelRepository,
  ) { }

  async execute(
    userId: string,
    syncRequests: SyncRequestDto[],
  ): Promise<NotificationWithStatus[]> {
    if (!Array.isArray(syncRequests)) {
      return [];
    }

    const validRequests: SyncRequestDto[] = [];
    for (const req of syncRequests) {
      const isMember = await this.channelRepo.isMember(req.channelId, userId);
      if (isMember) {
        validRequests.push(req);
      }
    }

    if (validRequests.length === 0) return [];

    const notifications =
      await this.notificationRepo.findMissedNotificationsBulk(
        validRequests.map((r) => ({
          channelId: r.channelId,
          lastSequence: r.lastSequence,
        })),
      );

    const channelStatusCache: Record<string, { otherLastRead: number; myLastRead: number }> = {};

    return Promise.all(
      notifications.map(async (m) => {
        if (channelStatusCache[m.channelId] === undefined) {
          const otherLastRead = await this.channelRepo.getOtherMembersLastReadSequence(
            m.channelId,
            userId,
          );
          const myLastRead = await this.channelRepo.getUserLastReadSequence(
            m.channelId,
            userId,
          );
          channelStatusCache[m.channelId] = { otherLastRead, myLastRead };
        }

        const { otherLastRead, myLastRead } = channelStatusCache[m.channelId];

        return {
          id: m.id,
          channelId: m.channelId,
          senderId: m.senderId,
          text: m.text,
          sequence: m.sequence,
          createdAt: m.createdAt,
          clientNotificationId: m.clientNotificationId,
          status: Notification.determineStatus(
            m.senderId,
            userId,
            m.sequence,
            otherLastRead,
            myLastRead,
          ),
          priority: m.priority as NotificationPriority,
          parentNotificationId: m.parentNotificationId,
        };
      }),
    );
  }
}
