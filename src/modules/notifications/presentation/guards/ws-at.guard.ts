import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import {
  ITokenService,
  TOKEN_SERVICE,
} from '../../../users/domain/token-service.interface';

@Injectable()
export class WsAtGuard implements CanActivate {
  constructor(
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: ITokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client = context.switchToWs().getClient();
      const authHeader = client.handshake.headers.authorization;
      const token =
        client.handshake.auth.token ||
        (authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);

      if (!token) {
        throw new WsException('Unauthorized');
      }

      const payload = await this.tokenService.verifyAccessToken(token);
      client.data.user = payload;
      return true;
    } catch (err) {
      throw new WsException('Unauthorized');
    }
  }
}
