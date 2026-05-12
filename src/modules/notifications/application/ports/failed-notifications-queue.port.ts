import { NotificationPriority } from '../../domain/notifications/notification-priority.enum';

export interface QueuedNotificationPayload {
  channelId: string;
  senderId: string;
  text: string;
  clientNotificationId?: string;
  priority?: NotificationPriority;
  parentNotificationId?: string;
}

export interface IFailedNotificationsQueue {
  enqueue(payload: QueuedNotificationPayload): Promise<void>;
}

export const FAILED_NOTIFICATIONS_QUEUE = Symbol('FAILED_NOTIFICATIONS_QUEUE');
