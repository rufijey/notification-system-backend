import {
  Inject,
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { IUseCase } from '../../../../shared/application/use-case.interface';
import { IChannelRepository } from '../../domain/channels/channel.repository.interface';
import { ChannelRole } from '../../domain/channels/channel.entity';

export interface UpdateMemberRoleRequest {
  channelId: string;
  adminId: string;
  targetUserId: string;
  newRole: ChannelRole;
}

@Injectable()
export class UpdateMemberRoleUseCase implements IUseCase<
  UpdateMemberRoleRequest,
  void
> {
  constructor(
    @Inject('CHAT_REPO')
    private readonly repository: IChannelRepository,
  ) {}

  async execute(request: UpdateMemberRoleRequest): Promise<void> {
    const { channelId, adminId, targetUserId, newRole } = request;

    const actorRole = await this.repository.getMemberRole(channelId, adminId);
    if (actorRole !== ChannelRole.ADMIN) {
      throw new ForbiddenException('Only admins can change member roles');
    }

    const isMember = await this.repository.isMember(channelId, targetUserId);
    if (!isMember) {
      throw new NotFoundException(
        'Target user is not a member of this channel',
      );
    }

    await this.repository.addMember(channelId, targetUserId, newRole);
  }
}
