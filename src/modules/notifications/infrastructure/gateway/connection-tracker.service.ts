import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { SocketEvent } from '../../domain/notifications/socket-events.enum';
import { INotificationsSender } from '../../application/ports/notifications-sender.port';

@Injectable()
export class ConnectionTrackerService implements INotificationsSender {
  private server: Server;

  setServer(server: Server) {
    this.server = server;
  }

  send(targetId: string, notification: any): void {
    if (this.server) {
      this.server
        .to(targetId)
        .emit(SocketEvent.RECEIVE_NOTIFICATION, notification);
    }
  }

  sendDelivered(targetId: string, payload: any): void {
    if (this.server) {
      this.server
        .to(targetId)
        .emit(SocketEvent.NOTIFICATION_DELIVERED, payload);
    }
  }

  sendMessageRead(targetId: string, payload: any): void {
    if (this.server) {
      this.server.to(targetId).emit(SocketEvent.NOTIFICATION_READ, payload);
    }
  }

  sendChannelRead(targetId: string, payload: any): void {
    if (this.server) {
      this.server.to(targetId).emit(SocketEvent.CHANNEL_READ, payload);
    }
  }

  async onChannelJoined(memberIds: string[], channel: any): Promise<void> {
    if (!this.server) return;

    for (const userId of memberIds) {
      const sockets = await this.server.in(userId).fetchSockets();
      for (const socket of sockets) {
        socket.join(channel.channelId);
      }

      const memberInfo = channel.members?.find((m: any) => m.userId === userId);
      const userRole = memberInfo?.role || 'SUBSCRIBER';

      const personalizedChannel = {
        ...channel,
        role: userRole,
      };

      this.server
        .to(userId)
        .emit(SocketEvent.CHANNEL_JOINED, personalizedChannel);
    }
  }

  sendChannelUpdated(
    channelId: string,
    payload: {
      channelId: string;
      userId?: string;
      role?: string;
      title?: string;
    },
  ): void {
    if (this.server) {
      this.server.to(channelId).emit(SocketEvent.CHANNEL_UPDATED, payload);
    }
  }
}
