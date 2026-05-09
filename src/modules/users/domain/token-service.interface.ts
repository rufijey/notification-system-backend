import { JwtPayload } from './jwt-payload.interface';

export interface ITokenService {
  generateTokens(
    payload: JwtPayload,
  ): Promise<{ accessToken: string; refreshToken: string }>;
  verifyAccessToken(token: string): Promise<JwtPayload>;
  verifyRefreshToken(token: string): Promise<JwtPayload>;
}

export const TOKEN_SERVICE = Symbol('ITokenService');
