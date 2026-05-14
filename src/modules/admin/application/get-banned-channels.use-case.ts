import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../shared/application/use-case.interface';
import { ADMIN_REPOSITORY, IAdminRepository, ChannelBan } from '../domain/admin.repository.interface';

@Injectable()
export class GetBannedChannelsUseCase implements IUseCase<void, Promise<(ChannelBan & { channelTitle: string })[]>> {
  constructor(
    @Inject(ADMIN_REPOSITORY)
    private readonly adminRepository: IAdminRepository,
  ) {}

  async execute(): Promise<(ChannelBan & { channelTitle: string })[]> {
    return this.adminRepository.getAllActiveBans();
  }
}
