import { ConflictException, Inject, Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import {
  IUsersRepository,
  USERS_REPOSITORY,
} from '../domain/users.repository.interface';
import {
  ITokenService,
  TOKEN_SERVICE,
} from '../domain/token-service.interface';
import { IUseCase } from '../../../shared/application/use-case.interface';
import { RegisterDto } from '../presentation/dto/register.dto';
import { User } from '../domain/user.entity';
import { RefreshToken } from '../domain/refresh-token.entity';

interface RegisterInput {
  dto: RegisterDto;
  userAgent?: string;
  ip?: string;
}

@Injectable()
export class RegisterUseCase implements IUseCase<
  RegisterInput,
  Promise<{ accessToken: string; refreshToken: string; userId: string }>
> {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: ITokenService,
  ) {}

  async execute(
    input: RegisterInput,
  ): Promise<{ accessToken: string; refreshToken: string; userId: string }> {
    const { dto, userAgent, ip } = input;

    const existingUserByEmail = await this.usersRepository.findByEmail(
      dto.email,
    );
    if (existingUserByEmail) {
      throw new ConflictException('User with this email already exists');
    }

    const existingUserByUsername = await this.usersRepository.findByUsername(
      dto.username,
    );
    if (existingUserByUsername) {
      throw new ConflictException('Username already taken');
    }

    const passwordHash = await argon2.hash(dto.password);

    const newUser = new User(
      dto.username,
      dto.fullName,
      dto.email,
      passwordHash,
      new Date(),
      new Date(),
    );

    await this.usersRepository.create(newUser);

    const tokenId = uuidv4();
    const tokens = await this.tokenService.generateTokens({
      sub: dto.username,
      email: dto.email,
      tokenId,
    });

    const hashedRefreshToken = crypto
      .createHash('sha256')
      .update(tokens.refreshToken)
      .digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const refreshTokenEntity = new RefreshToken(
      tokenId,
      hashedRefreshToken,
      dto.username,
      expiresAt,
      userAgent || null,
      ip || null,
      new Date(),
    );

    await this.usersRepository.addRefreshToken(refreshTokenEntity);

    return { ...tokens, userId: dto.username };
  }
}
