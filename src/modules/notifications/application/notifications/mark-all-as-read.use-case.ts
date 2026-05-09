import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/application/use-case.interface';
import { INotificationRepository } from '../../domain/notifications/notification.repository.interface';
import { IChannelRepository } from '../../domain/channels/channel.repository.interface';
import {
  MESSENGER_SENDER,
  INotificationsSender,
} from '../ports/notifications-sender.port';

interface MarkAllAsReadInput {
  userId: string;
  channelId: string;
}

@Injectable()
export class MarkAllAsReadUseCase implements IUseCase<
  MarkAllAsReadInput,
  void
> {
  constructor(
    @Inject('MESSAGE_REPO')
    private readonly notificationRepository: INotificationRepository,
    @Inject('CHAT_REPO')
    private readonly channelRepository: IChannelRepository,
    @Inject(MESSENGER_SENDER)
    private readonly sender: INotificationsSender,
  ) { }

  async execute(input: MarkAllAsReadInput): Promise<void> {
    const latestSequence = await this.notificationRepository.getLatestSequence(
      input.channelId,
    );

    if (latestSequence > 0) {
      await this.channelRepository.updateLastReadSequence(
        input.channelId,
        input.userId,
        latestSequence,
      );

      this.sender.sendChannelRead(input.channelId, {
        channelId: input.channelId,
        userId: input.userId,
        lastReadSequence: latestSequence,
        unreadCount: 0,
      });
    }
  }
}
