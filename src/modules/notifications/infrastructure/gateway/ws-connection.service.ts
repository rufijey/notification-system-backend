import { Inject, Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { WsException } from '@nestjs/websockets';
import {
  ITokenService,
  TOKEN_SERVICE,
} from '../../../users/domain/token-service.interface';
import { IChannelRepository } from '../../domain/channels/channel.repository.interface';

@Injectable()
export class WsConnectionService {
  constructor(
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: ITokenService,
    @Inject('CHAT_REPO')
    private readonly channelRepository: IChannelRepository,
  ) {}

  async authenticateAndJoinRooms(client: Socket): Promise<string> {
    const token = this.extractToken(client);
    if (!token) {
      throw new WsException('Unauthorized');
    }

    const payload = await this.tokenService.verifyAccessToken(token);
    client.data.user = payload;
    const userId = payload.sub;

    console.log(`[WS] Authenticated user ${userId} with role ${payload.role}`);

    await client.join(userId);

    if (payload.role === 'GLOBAL_ADMIN') {
      await client.join('admin');
    }

    const channelIds = await this.channelRepository.findUserChannelIds(userId);
    for (const channelId of channelIds) {
      await client.join(channelId);
    }

    return userId;
  }

  private extractToken(client: Socket): string | null {
    const authHeader = client.handshake.headers.authorization;
    return (
      client.handshake.auth.token ||
      (authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null)
    );
  }
}
