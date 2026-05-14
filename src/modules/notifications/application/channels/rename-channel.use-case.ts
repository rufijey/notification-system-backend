import {
  Inject,
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { IUseCase } from '../../../../shared/application/use-case.interface';
import { IChannelRepository } from '../../domain/channels/channel.repository.interface';
import { ChannelRole } from '../../domain/channels/channel.entity';
import { BanCheckerService } from '../../../admin/infrastructure/ban-checker.service';

export interface RenameChannelRequest {
  channelId: string;
  adminId: string;
  title?: string;
  photoUrl?: string;
}

@Injectable()
export class RenameChannelUseCase implements IUseCase<
  RenameChannelRequest,
  void
> {
  constructor(
    @Inject('CHAT_REPO')
    private readonly repository: IChannelRepository,
    private readonly banChecker: BanCheckerService,
  ) {}

  async execute(request: RenameChannelRequest): Promise<void> {
    const { channelId, adminId, title, photoUrl } = request;

    await this.banChecker.checkBan(channelId);

    const channel = await this.repository.findById(channelId);
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    const actorRole = await this.repository.getMemberRole(channelId, adminId);
    if (actorRole !== ChannelRole.ADMIN) {
      throw new ForbiddenException('Only admins can change channel title');
    }

    await this.repository.updateDetails(channelId, title, photoUrl);
  }
}
