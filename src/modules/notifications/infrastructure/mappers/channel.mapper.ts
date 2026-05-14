import { Channel as PrismaChannel, ChannelMember as PrismaChannelMember } from '@prisma/client';
import { Channel, ChannelRole } from '../../domain/channels/channel.entity';

export interface PrismaChannelWithMembers extends PrismaChannel {
  members: PrismaChannelMember[];
  photo?: { url: string } | null;
}

export class ChannelMapper {
  static toDomain(channel: PrismaChannelWithMembers): Channel {
    return new Channel(
      channel.id,
      channel.createdAt,
      channel.isEncrypted,
      channel.members.map((m) => ({
        userId: m.userId,
        role: m.role as ChannelRole,
        encryptedKey: m.encryptedKey ?? undefined,
      })),
      channel.title ?? undefined,
      channel.photo?.url ?? undefined,
    );
  }
}
