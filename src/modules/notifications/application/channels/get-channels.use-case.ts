import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/application/use-case.interface';
import { IChannelRepository } from '../../domain/channels/channel.repository.interface';

export interface GetChannelsResponse {
  channelId: string;

  role?: string;
  lastNotification?: string;
  lastNotificationSenderId?: string;
  lastNotificationStatus?: string;
  lastNotificationSequence?: number;
  lastActivity: Date;
  unreadCount: number;
  lastReadSequence: number;
  othersLastReadSequence: number;
  title?: string;
  memberIds: string[];
}

@Injectable()
export class GetChannelsUseCase implements IUseCase<
  string,
  GetChannelsResponse[]
> {
  constructor(
    @Inject('CHAT_REPO')
    private readonly repository: IChannelRepository,
  ) {}

  async execute(userId: string): Promise<GetChannelsResponse[]> {
    const channels = await this.repository.getChannelsByUserId(userId);

    const results = channels.map((channel) => {
      return {
        ...channel,
        channelId: channel.id,
        role: channel.role,
        lastNotification: channel.lastNotification?.text,
        lastNotificationSenderId: channel.lastNotification?.senderId,
        lastNotificationStatus: channel.lastNotification?.status,
        lastNotificationSequence: channel.lastNotification?.sequence,
        lastActivity:
          channel.lastNotification?.createdAt || channel.createdAt,
        lastReadSequence: channel.lastReadSequence,
        othersLastReadSequence: channel.othersLastReadSequence,
        title: channel.title,
        memberIds: channel.memberIds,
      };
    });

    return results.sort(
      (a, b) => b.lastActivity.getTime() - a.lastActivity.getTime(),
    );
  }
}
