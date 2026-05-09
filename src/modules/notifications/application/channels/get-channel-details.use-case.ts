import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/application/use-case.interface';
import { IChannelRepository } from '../../domain/channels/channel.repository.interface';

export interface ChannelDetailsResponse {
  channelId: string;
  title: string;
  memberCount: number;
}

@Injectable()
export class GetChannelDetailsUseCase implements IUseCase<
  string,
  ChannelDetailsResponse | null
> {
  constructor(
    @Inject('CHAT_REPO')
    private readonly channelRepository: IChannelRepository,
  ) {}

  async execute(channelId: string): Promise<ChannelDetailsResponse | null> {
    const channel = await this.channelRepository.findById(channelId);
    if (!channel) return null;
    return {
      channelId: channel.id,
      title: channel.title || 'Channel',
      memberCount: channel.members.length,
    };
  }
}
