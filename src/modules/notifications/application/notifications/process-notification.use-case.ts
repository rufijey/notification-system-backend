import { Inject, Injectable, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'crypto';
import { Notification } from '../../domain/notifications/notification.entity';
import { INotificationRepository } from '../../domain/notifications/notification.repository.interface';
import { NotificationPriority } from '../../domain/notifications/notification-priority.enum';
import { NotificationCreatedEvent } from '../../domain/notifications/events/notification-created.event';
import {
  INotificationsSender,
  MESSENGER_SENDER,
} from '../ports/notifications-sender.port';
import { IChannelRepository } from '../../domain/channels/channel.repository.interface';
import { Channel } from '../../domain/channels/channel.entity';
import { IFailedNotificationsQueue, FAILED_NOTIFICATIONS_QUEUE } from '../ports/failed-notifications-queue.port';
import { ADMIN_REPOSITORY, IAdminRepository } from '../../../admin/domain/admin.repository.interface';

@Injectable()
export class ProcessNotificationUseCase {
  constructor(
    @Inject('MESSAGE_REPO')
    private readonly repository: INotificationRepository,
    @Inject(MESSENGER_SENDER)
    private readonly sender: INotificationsSender,
    @Inject('CHAT_REPO')
    private readonly channelRepository: IChannelRepository,
    @Inject(ADMIN_REPOSITORY)
    private readonly adminRepository: IAdminRepository,
    private readonly eventEmitter: EventEmitter2,
    @Inject(FAILED_NOTIFICATIONS_QUEUE)
    private readonly failedQueue: IFailedNotificationsQueue,
  ) { }

  async execute(
    channelId: string,
    senderId: string,
    text: string,
    clientNotificationId?: string,
    priority?: NotificationPriority,
    parentNotificationId?: string,
    attachments?: string[],
    throwOnError = false,
  ): Promise<{ success: boolean; status: 'sent' | 'queued'; notification?: any }> {
    // Check for active ban
    const activeBan = await this.adminRepository.getActiveBan(channelId);
    if (activeBan) {
      throw new ForbiddenException(`Channel is banned. Reason: ${activeBan.reason}${activeBan.expiresAt ? `. Banned until: ${activeBan.expiresAt.toLocaleString()}` : ''}`);
    }

    try {
      if (clientNotificationId) {
        const existing = await this.repository.findByClientNotificationId(
          clientNotificationId,
        );
        if (existing) {
          console.log(
            `[Deduplication] Notification with clientNotificationId ${clientNotificationId} already exists in DB. Skipping creation.`,
          );
          return {
            success: true,
            status: 'sent',
            notification: {
              id: existing.id,
              channelId: existing.channelId,
              senderId: existing.senderId,
              text: existing.text,
              status: 'DELIVERED',
              createdAt: existing.createdAt,
              sequence: existing.sequence,
              clientNotificationId: existing.clientNotificationId,
              priority: existing.priority,
              parentNotificationId: existing.parentNotificationId,
              attachments: existing.attachments,
            },
          };
        }
      }

      // Validate that SUBSCRIBERs can only reply, they cannot create root notifications.
      const role = await this.channelRepository.getMemberRole(
        channelId,
        senderId,
      );

      if (!Channel.canMemberPost(role, !!parentNotificationId)) {
        console.warn(
          `[Validation] Sender ${senderId} has ${role} role in channel ${channelId} but tried to create a notification (isReply: ${!!parentNotificationId}). Skipping creation.`,
        );
        return { success: false, status: 'sent' };
      }

      const notification = parentNotificationId
        ? Notification.createReply(parentNotificationId, channelId, senderId, text, clientNotificationId, attachments)
        : Notification.createRoot(channelId, senderId, text, priority, clientNotificationId, attachments);

      const savedNotification = await this.repository.save(notification);

      this.sender.send(channelId, {
        id: savedNotification.id,
        channelId: savedNotification.channelId,
        senderId: savedNotification.senderId,
        text: savedNotification.text,
        status: 'DELIVERED',
        createdAt: savedNotification.createdAt,
        sequence: savedNotification.sequence,
        clientNotificationId: savedNotification.clientNotificationId,
        priority: savedNotification.priority,
        parentNotificationId: savedNotification.parentNotificationId,
        attachments: savedNotification.attachments,
      });

      // Emit asynchronous domain event to handle Web Push delivery in the background
      this.eventEmitter.emit(
        'notification.created',
        new NotificationCreatedEvent(savedNotification),
      );

      return {
        success: true,
        status: 'sent',
        notification: {
          id: savedNotification.id,
          channelId: savedNotification.channelId,
          senderId: savedNotification.senderId,
          text: savedNotification.text,
          status: 'DELIVERED',
          createdAt: savedNotification.createdAt,
          sequence: savedNotification.sequence,
          clientNotificationId: savedNotification.clientNotificationId,
          priority: savedNotification.priority,
          parentNotificationId: savedNotification.parentNotificationId,
          attachments: savedNotification.attachments,
        },
      };
    } catch (error) {
      if (throwOnError) {
        throw error;
      }

      console.error('[ProcessNotification] Error processing notification, queueing for retry...', error);

      await this.failedQueue.enqueue({
        channelId,
        senderId,
        text,
        clientNotificationId,
        priority,
        parentNotificationId,
        attachments,
      });

      return { success: true, status: 'queued' };
    }
  }
}
