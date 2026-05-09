import { User } from './user.entity';
import { RefreshToken } from './refresh-token.entity';

export interface IUsersRepository {
  findByUsername(username: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(user: User): Promise<void>;
  save(user: User): Promise<void>;

  addRefreshToken(token: RefreshToken): Promise<void>;
  findTokensByUserId(userId: string): Promise<RefreshToken[]>;
  findRefreshToken(
    userId: string,
    hashedToken: string,
  ): Promise<RefreshToken | null>;
  findRefreshTokenById(id: string): Promise<RefreshToken | null>;
  deleteRefreshToken(userId: string, hashedToken: string): Promise<void>;
  deleteRefreshTokenById(id: string): Promise<void>;
  deleteAllRefreshTokens(userId: string): Promise<void>;
  deleteExpiredRefreshTokens(): Promise<void>;
  deleteExpiredTokensByUserId(userId: string): Promise<void>;
}

export const USERS_REPOSITORY = Symbol('IUsersRepository');
