import { User as PrismaUser, UserRole as PrismaUserRole } from '@prisma/client';
import { User, UserRole } from '../../domain/user.entity';

export class UserMapper {
  static toDomain(user: PrismaUser & { avatar?: { url: string } | null }): User {
    return new User(
      user.username,
      user.fullName,
      user.email,
      user.passwordHash,
      user.role as unknown as UserRole,
      user.createdAt,
      user.updatedAt,
      user.avatar?.url,
    );
  }

  static toPersistence(user: User): Omit<PrismaUser, 'createdAt' | 'updatedAt'> {
    return {
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role as unknown as PrismaUserRole,
    };
  }
}
