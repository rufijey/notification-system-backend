import { Notification } from './notification.entity';

export interface GlobalNotificationWithRelations {
  id: string;
  channelId: string;
  senderId: string;
  text: string;
  sequence: number;
  createdAt: Date;
  clientNotificationId: string | null;
  priority: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  parentNotificationId: string | null;
  attachments?: { url: string }[];
  channel: {
    id: string;
    title: string | null;
    members: {
      lastReadSequence: number;
    }[];
  };
  sender: {
    username: string;
    fullName: string | null;
  };
}

export interface INotificationRepository {
  save(notification: Notification): Promise<Notification>;
  findByClientNotificationId(
    clientNotificationId: string,
  ): Promise<Notification | null>;
  findMissedNotifications(
    channelId: string,
    lastSequence: number,
  ): Promise<Notification[]>;
  findMissedNotificationsBulk(
    syncRequests: { channelId: string; lastSequence: number }[],
  ): Promise<Notification[]>;
  findByChannelId(channelId: string): Promise<Notification[]>;
  findByChannelIdPaginated(
    channelId: string,
    limit: number,
    beforeSequence?: number,
    query?: string,
  ): Promise<Notification[]>;
  findById(id: string): Promise<Notification | null>;
  delete(id: string): Promise<void>;
  getLatestSequence(channelId: string): Promise<number>;
  getGlobalNotifications(
    userId: string,
    limit: number,
    beforeId?: string,
    query?: string,
  ): Promise<GlobalNotificationWithRelations[]>;
}
