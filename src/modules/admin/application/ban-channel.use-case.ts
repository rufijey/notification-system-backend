import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IUseCase } from '../../../shared/application/use-case.interface';
import { ADMIN_REPOSITORY, IAdminRepository } from '../domain/admin.repository.interface';

interface BanChannelInput {
  channelId: string;
  adminId: string;
  reason: string;
  durationDays?: number;
}

import { AdminEvent } from '../domain/admin-events.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class BanChannelUseCase implements IUseCase<BanChannelInput, Promise<void>> {
  constructor(
    @Inject(ADMIN_REPOSITORY)
    private readonly adminRepository: IAdminRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(input: BanChannelInput): Promise<void> {
    const { channelId, adminId, reason, durationDays } = input;

    let expiresAt: Date | null = null;
    if (durationDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + durationDays);
    }

    // Deactivate any existing active bans first
    const currentBan = await this.adminRepository.getActiveBan(channelId);
    if (currentBan) {
      await this.adminRepository.deactivateBan(currentBan.id);
    }

    const ban = await this.adminRepository.createBan({
      channelId,
      adminId,
      reason,
      expiresAt,
      isActive: true,
    });

    this.eventEmitter.emit(AdminEvent.CHANNEL_BANNED, ban);
  }
}
