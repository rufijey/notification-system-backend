import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../shared/application/use-case.interface';
import { ADMIN_REPOSITORY, IAdminRepository } from '../domain/admin.repository.interface';

import { AdminEvent } from '../domain/admin-events.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class UnbanChannelUseCase implements IUseCase<string, Promise<void>> {
  constructor(
    @Inject(ADMIN_REPOSITORY)
    private readonly adminRepository: IAdminRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(banId: string): Promise<void> {
    const ban = await this.adminRepository.getBanById(banId);
    if (!ban) return;
    await this.adminRepository.deactivateBan(banId);
    this.eventEmitter.emit(AdminEvent.CHANNEL_UNBANNED, { id: banId, channelId: ban.channelId });
  }
}
