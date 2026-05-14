import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { IChannelRepository } from '../../domain/channels/channel.repository.interface';
import {
  IUsersRepository,
  USERS_REPOSITORY,
} from '../../../users/domain/users.repository.interface';
import { Channel } from '../../domain/channels/channel.entity';
import { BanCheckerService } from '../../../admin/infrastructure/ban-checker.service';

@Injectable()
export class AddMemberUseCase {
  constructor(
    @Inject('CHAT_REPO')
    private readonly channelRepository: IChannelRepository,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    private readonly banChecker: BanCheckerService,
  ) {}

  async execute(channelId: string, memberId: string): Promise<Channel> {
    await this.banChecker.checkBan(channelId);

    const channel = await this.channelRepository.findById(channelId);
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    const user = await this.usersRepository.findByUsername(memberId);
    if (!user) {
      throw new NotFoundException(`User with username '${memberId}' not found`);
    }

    const isMember = await this.channelRepository.isMember(channelId, memberId);
    if (isMember) {
      throw new BadRequestException('User is already a member');
    }

    await this.channelRepository.addMember(channelId, memberId);

    const updatedChannel = await this.channelRepository.findById(channelId);
    if (!updatedChannel) {
      throw new NotFoundException('Channel not found after adding member');
    }
    return updatedChannel;
  }
}
