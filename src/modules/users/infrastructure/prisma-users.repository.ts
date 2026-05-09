import { Injectable } from '@nestjs/common';
import { User } from '../domain/user.entity';
import { RefreshToken } from '../domain/refresh-token.entity';
import { IUsersRepository } from '../domain/users.repository.interface';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { UserMapper } from './mappers/user.mapper';
import { TokenMapper } from './mappers/token.mapper';

@Injectable()
export class PrismaUsersRepository implements IUsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUsername(username: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) return null;
    return UserMapper.toDomain(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    return UserMapper.toDomain(user);
  }

  async create(user: User): Promise<void> {
    await this.prisma.user.create({
      data: UserMapper.toPersistence(user),
    });
  }

  async save(user: User): Promise<void> {
    const data = UserMapper.toPersistence(user);
    await this.prisma.user.upsert({
      where: { username: user.username },
      update: {
        fullName: data.fullName,
        email: data.email,
        passwordHash: data.passwordHash,
      },
      create: data,
    });
  }

  async addRefreshToken(token: RefreshToken): Promise<void> {
    await this.prisma.refreshToken.create({
      data: TokenMapper.toPersistence(token),
    });
  }

  async findTokensByUserId(userId: string): Promise<RefreshToken[]> {
    const tokens = await this.prisma.refreshToken.findMany({
      where: { userId },
    });
    return tokens.map((t) => TokenMapper.toDomain(t));
  }

  async findRefreshToken(
    userId: string,
    hashedToken: string,
  ): Promise<RefreshToken | null> {
    const token = await this.prisma.refreshToken.findFirst({
      where: { userId, hashedToken },
    });
    if (!token) return null;
    return TokenMapper.toDomain(token);
  }

  async findRefreshTokenById(id: string): Promise<RefreshToken | null> {
    const token = await this.prisma.refreshToken.findUnique({
      where: { id },
    });
    if (!token) return null;
    return TokenMapper.toDomain(token);
  }

  async deleteRefreshToken(userId: string, hashedToken: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { userId, hashedToken },
    });
  }

  async deleteRefreshTokenById(id: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { id },
    });
  }

  async deleteAllRefreshTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  async deleteExpiredRefreshTokens(): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }

  async deleteExpiredTokensByUserId(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId,
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}
