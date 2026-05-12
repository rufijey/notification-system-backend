import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
  OnGatewayInit,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { AcknowledgeNotificationUseCase } from '../application/notifications/acknowledge-notification.use-case';
import { ReadNotificationUseCase } from '../application/notifications/read-notification.use-case';
import { SendPendingOnConnectUseCase } from '../application/notifications/send-pending-on-connect.use-case';
import { ConnectionTrackerService } from '../infrastructure/gateway/connection-tracker.service';
import { WsAtGuard } from './guards/ws-at.guard';
import { SocketEvent } from '../domain/notifications/socket-events.enum';
import { SyncNotificationsUseCase } from '../application/notifications/sync-notifications.use-case';
import { WsConnectionService } from '../infrastructure/gateway/ws-connection.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly connectionTracker: ConnectionTrackerService,
    private readonly acknowledgeUseCase: AcknowledgeNotificationUseCase,
    private readonly readUseCase: ReadNotificationUseCase,
    private readonly sendPendingUseCase: SendPendingOnConnectUseCase,
    private readonly syncNotificationsUseCase: SyncNotificationsUseCase,
    private readonly wsConnectionService: WsConnectionService,
  ) { }

  afterInit(server: Server) {
    this.connectionTracker.setServer(server);
  }

  async handleConnection(client: Socket) {
    try {
      const userId = await this.wsConnectionService.authenticateAndJoinRooms(client);
      await this.sendPendingUseCase.execute(userId).catch(console.error);
    } catch (e) {
      client.disconnect();
    }
  }

  @UseGuards(WsAtGuard)
  @SubscribeMessage(SocketEvent.ACK)
  async handleAck(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { notificationId: string },
  ) {
    const userId = client.data.user?.sub;
    if (!userId) return;
    await this.acknowledgeUseCase.execute(userId, data.notificationId);
  }

  @UseGuards(WsAtGuard)
  @SubscribeMessage(SocketEvent.READ)
  async handleRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { notificationId: string },
  ) {
    const userId = client.data.user?.sub;
    if (!userId) return;
    await this.readUseCase.execute(userId, data.notificationId);
  }

  @UseGuards(WsAtGuard)
  @SubscribeMessage(SocketEvent.SYNC_NOTIFICATIONS)
  async handleSyncNotifications(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { syncRequests: { channelId: string; lastSequence: number }[] },
  ) {
    const userId = client.data.user?.sub;
    if (!userId) return { error: 'Unauthorized' };

    const notifications = await this.syncNotificationsUseCase.execute(
      userId,
      data.syncRequests,
    );
    return { notifications };
  }
}
