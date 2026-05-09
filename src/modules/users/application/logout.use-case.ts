import { Inject, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  IUsersRepository,
  USERS_REPOSITORY,
} from '../domain/users.repository.interface';
import { IUseCase } from '../../../shared/application/use-case.interface';

interface LogoutInput {
  userId: string;
  refreshToken: string;
}

@Injectable()
export class LogoutUseCase implements IUseCase<LogoutInput, Promise<void>> {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
  ) {}

  async execute(input: LogoutInput): Promise<void> {
    const { userId, refreshToken } = input;
    if (!refreshToken) return;

    const inputHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    await this.usersRepository.deleteRefreshToken(userId, inputHash);
  }
}
