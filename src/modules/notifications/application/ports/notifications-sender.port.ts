export const MESSENGER_SENDER = Symbol('MESSENGER_SENDER');

export interface INotificationsSender {
  send(targetId: string, notification: any): void;
  sendDelivered(
    targetId: string,
    payload: { channelId: string; userId: string; notificationId: string },
  ): void;
  sendMessageRead(
    targetId: string,
    payload: { channelId: string; userId: string; sequence: number },
  ): void;
  sendChannelRead(
    targetId: string,
    payload: {
      channelId: string;
      userId: string;
      lastReadSequence: number;
      unreadCount: number;
    },
  ): void;
  onChannelJoined(members: string[], channel: any): void;
  sendChannelUpdated(
    channelId: string,
    payload: { channelId: string; userId: string; role: string },
  ): void;
}
