import { Inject, Injectable, ForbiddenException } from '@nestjs/common';
import { ADMIN_REPOSITORY, IAdminRepository } from '../domain/admin.repository.interface';

@Injectable()
export class BanCheckerService {
  constructor(
    @Inject(ADMIN_REPOSITORY)
    private readonly adminRepository: IAdminRepository,
  ) {}

  async checkBan(channelId: string) {
    const activeBan = await this.adminRepository.getActiveBan(channelId);
    if (activeBan) {
      const expirationText = activeBan.expiresAt 
        ? `. Banned until: ${activeBan.expiresAt.toLocaleString()}` 
        : '. Permanent ban.';
      throw new ForbiddenException(`Channel is banned. Reason: ${activeBan.reason}${expirationText}`);
    }
  }
}
