import { Inject, Injectable } from '@nestjs/common';
import { IChannelRepository } from '../../domain/channels/channel.repository.interface';

export interface SearchChannelResult {
  channelId: string;
  title: string;
  isMember: boolean;
}

@Injectable()
export class SearchChannelsUseCase {
  constructor(
    @Inject('CHAT_REPO')
    private readonly channelRepository: IChannelRepository,
  ) {}

  async execute(userId: string, query: string): Promise<SearchChannelResult[]> {
    if (!query || !query.trim()) return [];

    const trimmedQuery = query.trim();

    // RegExp check: is it a unique identifier (UUID or custom alphanumeric ID without spaces)?
    const idRegex =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$|^[a-zA-Z0-9-_]{3,50}$/;
    const isId = idRegex.test(trimmedQuery);

    const channels = await this.channelRepository.searchChannels(
      trimmedQuery,
      20,
      isId,
    );

    return channels.map((channel) => {
      const isMember = channel.members.some((m) => m.userId === userId);
      return {
        channelId: channel.id,
        title: channel.title || 'Channel',
        isMember,
      };
    });
  }
}
