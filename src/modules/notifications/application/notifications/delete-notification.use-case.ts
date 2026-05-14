import { Inject, Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { IUseCase } from '../../../../shared/application/use-case.interface';
import { INotificationRepository } from '../../domain/notifications/notification.repository.interface';
import { IChannelRepository } from '../../domain/channels/channel.repository.interface';
import { Channel } from '../../domain/channels/channel.entity';
import { INotificationsSender, MESSENGER_SENDER } from '../ports/notifications-sender.port';

interface DeleteNotificationRequest {
  notificationId: string;
  userId: string;
}

@Injectable()
export class DeleteNotificationUseCase implements IUseCase<DeleteNotificationRequest, void> {
  constructor(
    @Inject('MESSAGE_REPO')
    private readonly notificationRepository: INotificationRepository,
    @Inject('CHAT_REPO')
    private readonly channelRepository: IChannelRepository,
    @Inject(MESSENGER_SENDER)
    private readonly sender: INotificationsSender,
  ) {}

  async execute(request: DeleteNotificationRequest): Promise<void> {
    const { notificationId, userId } = request;

    const notification = await this.notificationRepository.findById(notificationId);
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    const role = await this.channelRepository.getMemberRole(notification.channelId, userId);
    
    // Use domain logic to check if member can delete
    if (!Channel.canMemberDelete(role)) {
      throw new ForbiddenException('Only admins can delete notifications');
    }

    await this.notificationRepository.delete(notificationId);

    // Broadcast deletion to all channel members
    this.sender.sendNotificationDeleted(notification.channelId, {
      notificationId,
      channelId: notification.channelId,
    });
  }
}
