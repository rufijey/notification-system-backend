import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ProcessNotificationUseCase } from './application/notifications/process-notification.use-case';
import { SyncNotificationsUseCase } from './application/notifications/sync-notifications.use-case';
import { AcknowledgeNotificationUseCase } from './application/notifications/acknowledge-notification.use-case';
import { ReadNotificationUseCase } from './application/notifications/read-notification.use-case';
import { SendPendingOnConnectUseCase } from './application/notifications/send-pending-on-connect.use-case';
import { GetChannelHistoryUseCase } from './application/notifications/get-channel-history.use-case';
import { GetChannelsUseCase } from './application/channels/get-channels.use-case';
import { MarkAllAsReadUseCase } from './application/notifications/mark-all-as-read.use-case';
import { CreateChannelUseCase } from './application/channels/create-channel.use-case';
import { JoinChannelUseCase } from './application/channels/join-channel.use-case';
import { AddMemberUseCase } from './application/channels/add-member.use-case';
import { LeaveChannelUseCase } from './application/channels/leave-channel.use-case';
import { UpdateMemberRoleUseCase } from './application/channels/update-member-role.use-case';
import { SearchChannelsUseCase } from './application/channels/search-channels.use-case';
import { GetGlobalNotificationsUseCase } from './application/notifications/get-global-notifications.use-case';
import { GetChannelDetailsUseCase } from './application/channels/get-channel-details.use-case';
import { GetMembersUseCase } from './application/channels/get-members.use-case';
import { NotificationsGateway } from './presentation/notifications.gateway';
import { NotificationsController } from './presentation/notifications.controller';
import { BullModule } from '@nestjs/bullmq';
import { FailedNotificationsProcessor } from './infrastructure/redis/failed-notifications.processor';
import { ConnectionTrackerService } from './infrastructure/gateway/connection-tracker.service';
import { MESSENGER_SENDER } from './application/ports/notifications-sender.port';
import { UsersModule } from '../users/users.module';
import { WsAtGuard } from './presentation/guards/ws-at.guard';
import { PrismaChannelRepository } from './infrastructure/repositories/prisma-channel.repository';
import { PrismaNotificationRepository } from './infrastructure/repositories/prisma-notification.repository';
// PWA & Web Push Imports
import { WebPushService } from './infrastructure/push/web-push.service';
import { SubscribePushUseCase } from './application/push/subscribe-push.use-case';
import { PrismaPushSubscriptionRepository } from './infrastructure/repositories/prisma-push-subscription.repository';
import { SendWebPushOnNotificationCreatedListener } from './infrastructure/push/send-web-push-on-notification-created.listener';
import { WsConnectionService } from './infrastructure/gateway/ws-connection.service';
import { FAILED_NOTIFICATIONS_QUEUE } from './application/ports/failed-notifications-queue.port';
import { RedisFailedNotificationsQueue } from './infrastructure/redis/redis-failed-notifications-queue';

@Module({
  imports: [
    UsersModule,
    EventEmitterModule.forRoot(),
    BullModule.registerQueue({ name: 'failed_notifications' }),
  ],
  providers: [
    ProcessNotificationUseCase,
    SyncNotificationsUseCase,
    CreateChannelUseCase,
    JoinChannelUseCase,
    AddMemberUseCase,
    LeaveChannelUseCase,
    UpdateMemberRoleUseCase,
    SearchChannelsUseCase,
    AcknowledgeNotificationUseCase,
    ReadNotificationUseCase,
    SendPendingOnConnectUseCase,
    GetChannelHistoryUseCase,
    GetChannelsUseCase,
    MarkAllAsReadUseCase,
    GetGlobalNotificationsUseCase,
    GetChannelDetailsUseCase,
    GetMembersUseCase,
    SubscribePushUseCase,
    NotificationsGateway,
    ConnectionTrackerService,
    WsAtGuard,
    WebPushService,
    SendWebPushOnNotificationCreatedListener,
    WsConnectionService,
    FailedNotificationsProcessor,
    {
      provide: MESSENGER_SENDER,
      useExisting: ConnectionTrackerService,
    },
    {
      provide: 'CHAT_REPO',
      useClass: PrismaChannelRepository,
    },
    {
      provide: 'MESSAGE_REPO',
      useClass: PrismaNotificationRepository,
    },
    {
      provide: 'PUSH_REPO',
      useClass: PrismaPushSubscriptionRepository,
    },
    {
      provide: FAILED_NOTIFICATIONS_QUEUE,
      useClass: RedisFailedNotificationsQueue,
    },
  ],
  controllers: [NotificationsController],
  exports: [
    ProcessNotificationUseCase,
    SyncNotificationsUseCase,
    CreateChannelUseCase,
    JoinChannelUseCase,
    AddMemberUseCase,
    LeaveChannelUseCase,
    AcknowledgeNotificationUseCase,
    ReadNotificationUseCase,
    SendPendingOnConnectUseCase,
    GetChannelHistoryUseCase,
    GetChannelsUseCase,
    MarkAllAsReadUseCase,
    UpdateMemberRoleUseCase,
    SearchChannelsUseCase,
    GetGlobalNotificationsUseCase,
    GetChannelDetailsUseCase,
    GetMembersUseCase,
    SubscribePushUseCase,
    WebPushService,
  ],
})
export class NotificationsModule { }
