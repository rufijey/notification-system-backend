import { Inject, Injectable } from '@nestjs/common';
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

@Injectable()
export class ProcessNotificationUseCase {
  constructor(
    @Inject('MESSAGE_REPO')
    private readonly repository: INotificationRepository,
    @Inject(MESSENGER_SENDER)
    private readonly sender: INotificationsSender,
    @Inject('CHAT_REPO')
    private readonly channelRepository: IChannelRepository,
    private readonly eventEmitter: EventEmitter2,
  ) { }

  async execute(
    channelId: string,
    senderId: string,
    text: string,
    clientNotificationId?: string,
    priority?: NotificationPriority,
    parentNotificationId?: string,
  ): Promise<void> {
    if (clientNotificationId) {
      const existing = await this.repository.findByClientNotificationId(
        clientNotificationId,
      );
      if (existing) {
        console.log(
          `[Deduplication] Notification with clientNotificationId ${clientNotificationId} already exists in DB. Skipping creation.`,
        );
        return;
      }
    }

    // Validate that SUBSCRIBERs can only reply, they cannot create root notifications.
    const role = await this.channelRepository.getMemberRole(
      channelId,
      senderId,
    );

    if (role === 'SUBSCRIBER' && !parentNotificationId) {
      console.warn(
        `[Validation] Sender ${senderId} has ${role} role in channel ${channelId} but tried to create a root notification. Skipping creation.`,
      );
      return;
    }

    const notification = parentNotificationId
      ? Notification.createReply(parentNotificationId, channelId, senderId, text, clientNotificationId)
      : Notification.createRoot(channelId, senderId, text, priority, clientNotificationId);

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
    });

    // Emit asynchronous domain event to handle Web Push delivery in the background
    this.eventEmitter.emit(
      'notification.created',
      new NotificationCreatedEvent(savedNotification),
    );
  }
}
