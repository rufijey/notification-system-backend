import { DeliveryStatus } from './delivery-status.enum';
import { NotificationPriority } from './notification-priority.enum';
import { randomUUID } from 'crypto';

export class Notification {
  constructor(
    public readonly id: string,
    public readonly channelId: string,
    public readonly senderId: string,
    public readonly text: string,
    public readonly sequence: number,
    public readonly createdAt: Date,
    public readonly clientNotificationId?: string,
    public readonly priority: NotificationPriority = NotificationPriority.MEDIUM,
    public readonly parentNotificationId?: string,
    public readonly attachments?: string[],
  ) { }

  /**
   * Factory method to create a new Root notification.
   * Root notifications can have high, medium, or low priority (defaults to MEDIUM).
   */
  static createRoot(
    channelId: string,
    senderId: string,
    text: string,
    priority: NotificationPriority = NotificationPriority.MEDIUM,
    clientNotificationId?: string,
    attachments?: string[],
  ): Notification {
    return new Notification(
      randomUUID(),
      channelId,
      senderId,
      text,
      0,
      new Date(),
      clientNotificationId,
      priority,
      undefined,
      attachments,
    );
  }

  /**
   * Factory method to create a Reply notification.
   * Business Rule: Replies are always associated with a parentNotificationId and always have NONE priority.
   */
  static createReply(
    parentNotificationId: string,
    channelId: string,
    senderId: string,
    text: string,
    clientNotificationId?: string,
    attachments?: string[],
  ): Notification {
    return new Notification(
      randomUUID(),
      channelId,
      senderId,
      text,
      0,
      new Date(),
      clientNotificationId,
      NotificationPriority.NONE,
      parentNotificationId,
      attachments,
    );
  }

  /**
   * 1. If the current user is NOT the sender of the notification, they are reading it now, meaning it is 'READ'.
   * 2. If the current user IS the sender:
   *    - We compare the message sequence (offset) against the lastReadSequence of the OTHER members in the channel.
   *    - If sequence <= otherMembersLastReadSequence, then at least one other member has read up to or past this message, so it is 'READ'.
   *    - If sequence > otherMembersLastReadSequence, the message is sent and buffered but not yet read by others, so it is 'DELIVERED'.
   */
  static determineStatus(
    senderId: string,
    currentUserId: string,
    notificationSequence: number,
    otherMembersLastReadSequence: number,
    currentUserLastReadSequence: number = 0,
  ): DeliveryStatus {
    if (senderId !== currentUserId) {
      return notificationSequence <= currentUserLastReadSequence
        ? DeliveryStatus.READ
        : DeliveryStatus.DELIVERED;
    }

    return notificationSequence <= otherMembersLastReadSequence
      ? DeliveryStatus.READ
      : DeliveryStatus.DELIVERED;
  }
}
