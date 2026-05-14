import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../shared/application/use-case.interface';
import { IUsersRepository, USERS_REPOSITORY } from '../domain/users.repository.interface';

export interface ProfileResponse {
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: string;
}

@Injectable()
export class GetProfileUseCase implements IUseCase<string, ProfileResponse | null> {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
  ) {}

  async execute(username: string): Promise<ProfileResponse | null> {
    const user = await this.usersRepository.findByUsername(username);
    if (!user) return null;

    return {
      username: user.username,
      fullName: user.fullName ?? null,
      avatarUrl: user.avatarUrl ?? null,
      role: user.role,
    };
  }
}
