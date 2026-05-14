import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { IUseCase } from '../../../../shared/application/use-case.interface';
import { IChannelRepository } from '../../domain/channels/channel.repository.interface';
import {
  INotificationsSender,
  MESSENGER_SENDER,
} from '../ports/notifications-sender.port';

import { BanCheckerService } from '../../../admin/infrastructure/ban-checker.service';

interface JoinChannelInput {
  userId: string;
  channelId: string;
}

@Injectable()
export class JoinChannelUseCase implements IUseCase<JoinChannelInput, void> {
  constructor(
    @Inject('CHAT_REPO')
    private readonly channelRepository: IChannelRepository,
    @Inject(MESSENGER_SENDER)
    private readonly sender: INotificationsSender,
    private readonly banChecker: BanCheckerService,
  ) { }

  async execute(input: JoinChannelInput): Promise<void> {
    await this.banChecker.checkBan(input.channelId);

    const channel = await this.channelRepository.findById(input.channelId);
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    const isMember = await this.channelRepository.isMember(
      input.channelId,
      input.userId,
    );
    if (isMember) {
      return;
    }

    await this.channelRepository.addMember(input.channelId, input.userId);
    const lastReadSequence = await this.channelRepository.getUserLastReadSequence(input.channelId, input.userId);

    const response = {
      channelId: channel.id,
      memberIds: [...channel.members.map((m) => m.userId), input.userId],
      members: [
        ...channel.members,
        { userId: input.userId, role: 'SUBSCRIBER' },
      ],
      createdAt: channel.createdAt,
      unreadCount: 0,
      lastReadSequence,
      title: channel.title,
    };

    await this.sender.onChannelJoined([input.userId], response);
  }
}
