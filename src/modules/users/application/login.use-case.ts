import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
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
import { LoginDto } from '../presentation/dto/login.dto';
import { RefreshToken } from '../domain/refresh-token.entity';

interface LoginInput {
  dto: LoginDto;
  userAgent?: string;
  ip?: string;
}

@Injectable()
export class LoginUseCase implements IUseCase<
  LoginInput,
  Promise<{ accessToken: string; refreshToken: string; userId: string }>
> {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: ITokenService,
  ) {}

  async execute(
    input: LoginInput,
  ): Promise<{ accessToken: string; refreshToken: string; userId: string }> {
    const { dto, userAgent, ip } = input;
    const user = await this.usersRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await argon2.verify(
      user.passwordHash,
      dto.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokenId = uuidv4();
    const tokens = await this.tokenService.generateTokens({
      sub: user.username,
      email: user.email,
      tokenId,
    });

    const hashedRefreshToken = crypto
      .createHash('sha256')
      .update(tokens.refreshToken)
      .digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const refreshTokenEntity = new RefreshToken(
      tokenId,
      hashedRefreshToken,
      user.username,
      expiresAt,
      userAgent || null,
      ip || null,
      new Date(),
    );

    await this.usersRepository.addRefreshToken(refreshTokenEntity);

    return { ...tokens, userId: user.username };
  }
}
