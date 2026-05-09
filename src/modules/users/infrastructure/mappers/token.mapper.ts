import { RefreshToken as PrismaRefreshToken } from '@prisma/client';
import { RefreshToken } from '../../domain/refresh-token.entity';

export class TokenMapper {
  static toDomain(token: PrismaRefreshToken): RefreshToken {
    return new RefreshToken(
      token.id,
      token.hashedToken,
      token.userId,
      token.expiresAt,
      token.userAgent,
      token.ip,
      token.createdAt,
    );
  }

  static toPersistence(token: RefreshToken): PrismaRefreshToken {
    return {
      id: token.id,
      hashedToken: token.hashedToken,
      userId: token.userId,
      expiresAt: token.expiresAt,
      userAgent: token.userAgent,
      ip: token.ip,
      createdAt: token.createdAt,
    };
  }
}
