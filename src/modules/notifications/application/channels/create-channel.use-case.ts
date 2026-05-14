import {
  Inject,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Channel } from '../../domain/channels/channel.entity';
import { IChannelRepository } from '../../domain/channels/channel.repository.interface';
import {
  IUsersRepository,
  USERS_REPOSITORY,
} from '../../../users/domain/users.repository.interface';

@Injectable()
export class CreateChannelUseCase {
  constructor(
    @Inject('CHAT_REPO')
    private readonly channelRepository: IChannelRepository,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
  ) {}

  async execute(
    creatorId: string,
    memberIds: string[],
    title?: string,
    id?: string,
    photoUrl?: string,
  ): Promise<Channel> {
    for (const memberId of [creatorId, ...memberIds]) {
      const user = await this.usersRepository.findByUsername(memberId);
      if (!user) {
        throw new NotFoundException(
          `User with username '${memberId}' not found`,
        );
      }
    }

    if (id) {
      const existingChannel = await this.channelRepository.findById(id);
      if (existingChannel) {
        throw new ConflictException(`Channel with ID ${id} already exists`);
      }
    }

    return this.channelRepository.create(creatorId, memberIds, title, id, photoUrl);
  }
}
