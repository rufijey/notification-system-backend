import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { IChannelRepository } from '../../domain/channels/channel.repository.interface';

@Injectable()
export class LeaveChannelUseCase {
  constructor(
    @Inject('CHAT_REPO')
    private readonly channelRepository: IChannelRepository,
  ) {}

  async execute(channelId: string, userId: string): Promise<void> {
    const channel = await this.channelRepository.findById(channelId);
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    const isMember = await this.channelRepository.isMember(channelId, userId);
    if (!isMember) {
      throw new BadRequestException('User is not a member of this channel');
    }

    await this.channelRepository.removeMember(channelId, userId);
  }
}
