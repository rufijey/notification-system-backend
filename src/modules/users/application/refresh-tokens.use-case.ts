import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
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
import { RefreshToken } from '../domain/refresh-token.entity';

interface RefreshTokensInput {
  userId: string;
  refreshToken: string;
  tokenId?: string;
  userAgent?: string;
  ip?: string;
}

@Injectable()
export class RefreshTokensUseCase implements IUseCase<
  RefreshTokensInput,
  Promise<{ 
    accessToken: string; 
    refreshToken: string; 
    userId: string; 
    role: string; 
    fullName: string; 
    avatarUrl?: string 
  }>
> {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: ITokenService,
  ) {}

  async execute(
    input: RefreshTokensInput,
  ): Promise<{ 
    accessToken: string; 
    refreshToken: string; 
    userId: string; 
    role: string; 
    fullName: string; 
    avatarUrl?: string 
  }> {
    const { userId, refreshToken, userAgent, ip } = input;
    const user = await this.usersRepository.findByUsername(userId);
    if (!user) {
      throw new UnauthorizedException('Access Denied');
    }

    // Clean up expired tokens for this user first
    await this.usersRepository.deleteExpiredTokensByUserId(userId).catch(() => {});

    const inputHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    // Direct match by SHA-256 hash (O(1) database index match)
    const matchedToken = await this.usersRepository.findRefreshToken(userId, inputHash);

    if (!matchedToken) {
      throw new UnauthorizedException('Access Denied');
    }

    // Delete the matched token by ID
    await this.usersRepository.deleteRefreshTokenById(matchedToken.id);

    const newTokenId = uuidv4();
    const newTokens = await this.tokenService.generateTokens({
      sub: user.username,
      email: user.email,
      role: user.role,
      tokenId: newTokenId,
    });

    const hashedRefreshToken = crypto
      .createHash('sha256')
      .update(newTokens.refreshToken)
      .digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const refreshTokenEntity = new RefreshToken(
      newTokenId,
      hashedRefreshToken,
      userId,
      expiresAt,
      userAgent || null,
      ip || null,
      new Date(),
    );

    await this.usersRepository.addRefreshToken(refreshTokenEntity);

    return { 
      ...newTokens, 
      userId, 
      role: user.role, 
      fullName: user.fullName, 
      avatarUrl: user.avatarUrl 
    };
  }
}
