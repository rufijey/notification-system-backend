import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Inject,
  UseGuards,
  Req,
  Delete,
} from '@nestjs/common';
import { Request } from 'express';
import { ClientProxy } from '@nestjs/microservices';
import { SendNotificationDto } from './dto/send-notification.dto';
import { CreateChannelDto } from './dto/create-channel.dto';
import { GetChannelHistoryUseCase } from '../application/notifications/get-channel-history.use-case';
import { GetChannelsUseCase } from '../application/channels/get-channels.use-case';
import { MarkAllAsReadUseCase } from '../application/notifications/mark-all-as-read.use-case';
import { CreateChannelUseCase } from '../application/channels/create-channel.use-case';
import { AddMemberUseCase } from '../application/channels/add-member.use-case';
import { LeaveChannelUseCase } from '../application/channels/leave-channel.use-case';
import { UpdateMemberRoleUseCase } from '../application/channels/update-member-role.use-case';
import { SearchChannelsUseCase } from '../application/channels/search-channels.use-case';
import { JoinChannelUseCase } from '../application/channels/join-channel.use-case';
import { GetGlobalNotificationsUseCase } from '../application/notifications/get-global-notifications.use-case';
import { GetChannelDetailsUseCase } from '../application/channels/get-channel-details.use-case';
import { GetMembersUseCase } from '../application/channels/get-members.use-case';
import { ChannelRole } from '../domain/channels/channel.entity';
import { AtGuard } from '../../users/presentation/guards/at.guard';
import {
  INotificationsSender,
  MESSENGER_SENDER,
} from '../application/ports/notifications-sender.port';
import { WebPushService } from '../infrastructure/push/web-push.service';
import { SubscribePushUseCase } from '../application/push/subscribe-push.use-case';

interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    email: string;
  };
}

@Controller('notifications')
@UseGuards(AtGuard)
export class NotificationsController {
  constructor(
    @Inject('RMQ_SERVICE') private readonly client: ClientProxy,
    private readonly getChannelHistoryUseCase: GetChannelHistoryUseCase,
    private readonly getChannelsUseCase: GetChannelsUseCase,
    private readonly markAllAsReadUseCase: MarkAllAsReadUseCase,
    private readonly createChannelUseCase: CreateChannelUseCase,
    private readonly addMemberUseCase: AddMemberUseCase,
    private readonly leaveChannelUseCase: LeaveChannelUseCase,
    private readonly updateMemberRoleUseCase: UpdateMemberRoleUseCase,
    private readonly searchChannelsUseCase: SearchChannelsUseCase,
    private readonly joinChannelUseCase: JoinChannelUseCase,
    private readonly getGlobalNotificationsUseCase: GetGlobalNotificationsUseCase,
    private readonly getChannelDetailsUseCase: GetChannelDetailsUseCase,
    private readonly getMembersUseCase: GetMembersUseCase,
    @Inject(MESSENGER_SENDER)
    private readonly sender: INotificationsSender,
    private readonly webPushService: WebPushService,
    private readonly subscribePushUseCase: SubscribePushUseCase,
  ) { }

  @Post('channels')
  async createChannel(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateChannelDto,
  ) {
    const memberIds = Array.from(new Set([...dto.memberIds, req.user.sub]));
    const channel = await this.createChannelUseCase.execute(
      req.user.sub,
      dto.memberIds,
      dto.title,
      dto.id,
    );

    const response = {
      channelId: channel.id,
      memberIds: channel.members.map((m) => m.userId),
      members: channel.members,
      createdAt: channel.createdAt,
      unreadCount: 0,
      lastReadSequence: 0,
      title: channel.title,
    };

    this.sender.onChannelJoined(memberIds, response);

    return response;
  }

  @Post('send')
  async sendNotification(
    @Req() req: AuthenticatedRequest,
    @Body() dto: SendNotificationDto,
  ) {
    const senderId = req.user.sub;
    this.client.emit('notification_created', {
      channelId: dto.channelId,
      senderId,
      text: dto.text,
      clientNotificationId: dto.clientNotificationId,
      priority: dto.priority,
      parentNotificationId: dto.parentNotificationId,
    });
    return { success: true };
  }

  @Get('channels')
  async getChannels(@Req() req: AuthenticatedRequest) {
    return this.getChannelsUseCase.execute(req.user.sub);
  }

  @Get('channels/search')
  async searchChannels(
    @Req() req: AuthenticatedRequest,
    @Query('query') query?: string,
  ) {
    return this.searchChannelsUseCase.execute(req.user.sub, query || '');
  }

  @Get('push/vapid-key')
  async getVapidKey() {
    return { publicKey: this.webPushService.getPublicKey() };
  }

  @Post('push/subscribe')
  async subscribePush(
    @Req() req: AuthenticatedRequest,
    @Body() body: { subscription: { endpoint: string; keys: { p256dh: string; auth: string } } },
  ) {
    return this.subscribePushUseCase.execute({
      userId: req.user.sub,
      endpoint: body.subscription.endpoint,
      p256dh: body.subscription.keys.p256dh,
      auth: body.subscription.keys.auth,
    });
  }

  @Get('global')
  async getGlobalNotifications(
    @Req() req: AuthenticatedRequest,
    @Query('limit') limit?: string,
    @Query('beforeId') beforeId?: string,
    @Query('query') query?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.getGlobalNotificationsUseCase.execute({
      userId: req.user.sub,
      limit: limitNum,
      beforeId,
      query,
    });
  }

  @Get('channels/:channelId')
  async getChannelDetails(
    @Req() req: AuthenticatedRequest,
    @Param('channelId') channelId: string,
  ) {
    return this.getChannelDetailsUseCase.execute(channelId);
  }

  @Get('history/:channelId')
  async getHistory(
    @Req() req: AuthenticatedRequest,
    @Param('channelId') channelId: string,
    @Query('limit') limit?: string,
    @Query('beforeSequence') beforeSequence?: string,
    @Query('query') query?: string,
  ) {
    return this.getChannelHistoryUseCase.execute(
      channelId,
      req.user.sub,
      limit ? parseInt(limit, 10) : 30,
      beforeSequence ? parseInt(beforeSequence, 10) : undefined,
      query,
    );
  }

  @Post('read-all/:channelId')
  async markAllAsRead(
    @Req() req: AuthenticatedRequest,
    @Param('channelId') channelId: string,
  ) {
    await this.markAllAsReadUseCase.execute({
      userId: req.user.sub,
      channelId,
    });
    return { success: true };
  }

  @Post('channels/:channelId/members')
  async addMember(
    @Req() req: AuthenticatedRequest,
    @Param('channelId') channelId: string,
    @Body('memberId') memberId: string,
  ) {
    const channel = await this.addMemberUseCase.execute(channelId, memberId);

    const channelPayload = {
      channelId: channel.id,
      memberIds: channel.members.map((m) => m.userId),
      members: channel.members,
      createdAt: channel.createdAt,
      unreadCount: 0,
      lastReadSequence: 0,
      othersLastReadSequence: 0,
      lastActivity: new Date().toISOString(),
      title: channel.title,
    };
    this.sender.onChannelJoined([memberId], channelPayload);

    return { success: true };
  }

  @Delete('channels/:channelId/members')
  async leaveChannel(
    @Req() req: AuthenticatedRequest,
    @Param('channelId') channelId: string,
  ) {
    await this.leaveChannelUseCase.execute(channelId, req.user.sub);
    return { success: true };
  }

  @Post('channels/:channelId/members/:memberId/role')
  async updateMemberRole(
    @Req() req: AuthenticatedRequest,
    @Param('channelId') channelId: string,
    @Param('memberId') memberId: string,
    @Body('role') role: string,
  ) {
    await this.updateMemberRoleUseCase.execute({
      channelId,
      adminId: req.user.sub,
      targetUserId: memberId,
      newRole: role as ChannelRole,
    });

    this.sender.sendChannelUpdated(channelId, {
      channelId,
      userId: memberId,
      role: role,
    });

    return { success: true };
  }

  @Post('channels/:channelId/join')
  async joinChannel(
    @Req() req: AuthenticatedRequest,
    @Param('channelId') channelId: string,
  ) {
    await this.joinChannelUseCase.execute({ userId: req.user.sub, channelId });
    return { success: true };
  }

  @Get('channels/:channelId/members')
  async getMembers(
    @Req() req: AuthenticatedRequest,
    @Param('channelId') channelId: string,
  ) {
    return this.getMembersUseCase.execute(channelId);
  }
}
