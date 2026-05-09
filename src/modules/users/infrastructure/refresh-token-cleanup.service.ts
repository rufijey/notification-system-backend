import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Inject } from '@nestjs/common';
import {
  IUsersRepository,
  USERS_REPOSITORY,
} from '../domain/users.repository.interface';

@Injectable()
export class RefreshTokenCleanupService {
  private readonly logger = new Logger(RefreshTokenCleanupService.name);

  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCleanup() {
    this.logger.log('Starting expired refresh tokens cleanup...');
    try {
      await this.usersRepository.deleteExpiredRefreshTokens();
      this.logger.log('Expired refresh tokens cleanup completed successfully.');
    } catch (error) {
      this.logger.error(
        'Failed to cleanup expired refresh tokens',
        (error as Error).stack,
      );
    }
  }
}
