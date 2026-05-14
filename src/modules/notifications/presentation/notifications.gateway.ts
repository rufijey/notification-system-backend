import {
  OnGatewayConnection,
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
import { ConnectionTrackerService } from '../infrastructure/gateway/connection-tracker.service';
import { WsAtGuard } from './guards/ws-at.guard';
import { SocketEvent } from '../domain/notifications/socket-events.enum';
import { SyncNotificationsUseCase } from '../application/notifications/sync-notifications.use-case';
import { WsConnectionService } from '../infrastructure/gateway/ws-connection.service';

import { OnEvent } from '@nestjs/event-emitter';

@WebSocketGateway({
  path: '/api/socket.io/',
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
  transports: ['websocket'],
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly connectionTracker: ConnectionTrackerService,
    private readonly acknowledgeUseCase: AcknowledgeNotificationUseCase,
    private readonly readUseCase: ReadNotificationUseCase,
    private readonly syncNotificationsUseCase: SyncNotificationsUseCase,
    private readonly wsConnectionService: WsConnectionService,
  ) { }

  afterInit(server: Server) {
    this.connectionTracker.setServer(server);
  }

  async handleConnection(client: Socket) {
    try {
      await this.wsConnectionService.authenticateAndJoinRooms(client);
    } catch (e) {
      client.disconnect();
    }
  }

  @OnEvent(SocketEvent.ADMIN_REPORT_CREATED)
  handleReportCreated(payload: any) {
    console.log(`[WS] Broadcasting admin event: ${SocketEvent.ADMIN_REPORT_CREATED}`, payload);
    this.server.to('admin').emit(SocketEvent.ADMIN_REPORT_CREATED, payload);
  }

  @OnEvent(SocketEvent.ADMIN_REPORT_DISMISSED)
  handleReportDismissed(payload: any) {
    console.log(`[WS] Broadcasting admin event: ${SocketEvent.ADMIN_REPORT_DISMISSED}`, payload);
    this.server.to('admin').emit(SocketEvent.ADMIN_REPORT_DISMISSED, payload);
  }

  @OnEvent(SocketEvent.ADMIN_CHANNEL_BANNED)
  handleChannelBanned(payload: any) {
    console.log(`[WS] Broadcasting admin event: ${SocketEvent.ADMIN_CHANNEL_BANNED}`, payload);
    // Emit to admin room
    this.server.to('admin').emit(SocketEvent.ADMIN_CHANNEL_BANNED, payload);
    // Broadcast globally so non-members currently viewing the channel also get updated
    this.server.emit(SocketEvent.ADMIN_CHANNEL_BANNED, payload);
  }

  @OnEvent(SocketEvent.ADMIN_CHANNEL_UNBANNED)
  handleChannelUnbanned(payload: any) {
    console.log(`[WS] Broadcasting admin event: ${SocketEvent.ADMIN_CHANNEL_UNBANNED}`, payload);
    // Emit to admin room
    this.server.to('admin').emit(SocketEvent.ADMIN_CHANNEL_UNBANNED, payload);
    // Broadcast globally so non-members currently viewing the channel also get updated
    this.server.emit(SocketEvent.ADMIN_CHANNEL_UNBANNED, payload);
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
