import { Inject, Injectable, ForbiddenException } from '@nestjs/common';
import { INotificationRepository } from '../../domain/notifications/notification.repository.interface';
import { IChannelRepository } from '../../domain/channels/channel.repository.interface';
import { Notification } from '../../domain/notifications/notification.entity';
import { DeliveryStatus } from '../../domain/notifications/delivery-status.enum';
import { NotificationPriority } from '../../domain/notifications/notification-priority.enum';
import { ADMIN_REPOSITORY, IAdminRepository } from '../../../admin/domain/admin.repository.interface';

const DEFAULT_PAGE_SIZE = 30;

export interface NotificationWithStatus {
  id: string;
  channelId: string;
  senderId: string;
  text: string;
  sequence: number;
  createdAt: Date;
  status: DeliveryStatus;
  clientNotificationId?: string;
  priority: NotificationPriority;
  parentNotificationId?: string;
  attachments?: string[];
}

export interface GetChannelHistoryResult {
  items: NotificationWithStatus[];
  hasMore: boolean;
}

@Injectable()
export class GetChannelHistoryUseCase {
  constructor(
    @Inject('MESSAGE_REPO')
    private readonly notificationRepository: INotificationRepository,
    @Inject('CHAT_REPO')
    private readonly channelRepository: IChannelRepository,
    @Inject(ADMIN_REPOSITORY)
    private readonly adminRepository: IAdminRepository,
  ) {}

  async execute(
    channelId: string,
    userId: string,
    limit: number = DEFAULT_PAGE_SIZE,
    beforeSequence?: number,
    query?: string,
  ): Promise<GetChannelHistoryResult> {
    // Check for active ban
    const activeBan = await this.adminRepository.getActiveBan(channelId);
    if (activeBan) {
      throw new ForbiddenException(`Channel is banned. Reason: ${activeBan.reason}${activeBan.expiresAt ? `. Banned until: ${activeBan.expiresAt.toLocaleString()}` : ''}`);
    }

    const notifications =
      await this.notificationRepository.findByChannelIdPaginated(
        channelId,
        limit + 1,
        beforeSequence,
        query,
      );

    const hasMore = notifications.length > limit;
    const items = hasMore ? notifications.slice(1) : notifications;

    const otherLastRead =
      await this.channelRepository.getOtherMembersLastReadSequence(
        channelId,
        userId,
      );

    const myLastRead =
      await this.channelRepository.getUserLastReadSequence(
        channelId,
        userId,
      );

    return {
      items: items.map((m) => ({
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
        attachments: m.attachments,
      })),
      hasMore,
    };
  }
}
