import { User as PrismaUser } from '@prisma/client';
import { User } from '../../domain/user.entity';

export class UserMapper {
  static toDomain(user: PrismaUser): User {
    return new User(
      user.username,
      user.fullName,
      user.email,
      user.passwordHash,
      user.createdAt,
      user.updatedAt,
    );
  }

  static toPersistence(user: User): Omit<PrismaUser, 'createdAt' | 'updatedAt'> {
    return {
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      passwordHash: user.passwordHash,
    };
  }
}
