import { Notification as PrismaNotification } from '@prisma/client';
import { Notification } from '../../domain/notifications/notification.entity';
import { NotificationPriority } from '../../domain/notifications/notification-priority.enum';

export class NotificationMapper {
  static toDomain(data: PrismaNotification): Notification {
    return new Notification(
      data.id,
      data.channelId,
      data.senderId,
      data.text,
      data.sequence,
      data.createdAt,
      data.clientNotificationId ?? undefined,
      data.priority as unknown as NotificationPriority,
      data.parentNotificationId ?? undefined,
    );
  }

  static toPersistence(notification: Notification): Omit<PrismaNotification, 'sequence'> {
    return {
      id: notification.id,
      channelId: notification.channelId,
      senderId: notification.senderId,
      text: notification.text,
      clientNotificationId: notification.clientNotificationId ?? null,
      priority: notification.priority,
      parentNotificationId: notification.parentNotificationId ?? null,
      createdAt: notification.createdAt,
      updatedAt: new Date(),
    };
  }
}
