import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IUsersRepository, USERS_REPOSITORY } from '../domain/users.repository.interface';
import { User } from '../domain/user.entity';

interface UpdateProfileInput {
  username: string;
  fullName: string;
}

@Injectable()
export class UpdateProfileUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
  ) {}

  async execute(input: UpdateProfileInput): Promise<{ username: string; fullName: string }> {
    const user = await this.usersRepository.findByUsername(input.username);
    if (!user) {
      throw new NotFoundException(`User with username ${input.username} not found`);
    }

    const updatedUser = new User(
      user.username,
      input.fullName,
      user.email,
      user.passwordHash,
      user.createdAt,
      new Date(),
    );

    await this.usersRepository.save(updatedUser);

    return {
      username: updatedUser.username,
      fullName: updatedUser.fullName,
    };
  }
}
