import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/application/use-case.interface';
import { IChannelRepository } from '../../domain/channels/channel.repository.interface';

@Injectable()
export class GetMembersUseCase implements IUseCase<string, any[]> {
  constructor(
    @Inject('CHAT_REPO')
    private readonly channelRepository: IChannelRepository,
  ) {}

  async execute(channelId: string): Promise<any[]> {
    return this.channelRepository.getMembers(channelId);
  }
}
