import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import {
  IChannelRepository,
  ChannelWithLastNotification,
  ChannelMemberDetails,
} from '../../domain/channels/channel.repository.interface';
import { Channel, ChannelRole } from '../../domain/channels/channel.entity';
import { ChannelRole as PrismaChannelRole } from '@prisma/client';
import { ChannelMapper } from '../mappers/channel.mapper';

@Injectable()
export class PrismaChannelRepository implements IChannelRepository {
  constructor(private readonly prisma: PrismaService) { }

  async create(
    creatorId: string,
    memberIds: string[],
    title?: string,
    id?: string,
    photoUrl?: string,
  ): Promise<Channel> {
    const channel = await this.prisma.channel.create({
      data: {
        id: id || undefined,
        title: title || 'New Channel',
        members: {
          create: [
            { userId: creatorId, role: PrismaChannelRole.ADMIN },
            ...memberIds.map((userId) => ({ userId, role: PrismaChannelRole.SUBSCRIBER })),
          ],
        },
        photo: photoUrl ? { create: { url: photoUrl } } : undefined,
      },
      include: {
        members: true,
        photo: true,
      },
    });

    return ChannelMapper.toDomain(channel as any);
  }

  async findById(id: string): Promise<Channel | null> {
    const channel = await this.prisma.channel.findUnique({
      where: { id },
      include: { members: true, photo: true },
    });

    if (!channel) return null;

    return ChannelMapper.toDomain(channel);
  }

  async findUserChannelIds(userId: string): Promise<string[]> {
    const memberships = await this.prisma.channelMember.findMany({
      where: { userId },
      select: { channelId: true },
    });

    return memberships.map((m) => m.channelId);
  }

  async getChannelsByUserId(
    userId: string,
  ): Promise<ChannelWithLastNotification[]> {
    const channels = await this.prisma.channel.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        members: true,
        photo: true,
        notifications: {
          where: { parentNotificationId: null },
          orderBy: { sequence: 'desc' },
          take: 1,
        },
      },
    });

    const results = await Promise.all(
      channels.map(async (channel) => {
        const lastMsg = channel.notifications[0];
        const member = channel.members.find((m) => m.userId === userId);

        const lastReadSequence = member?.lastReadSequence ?? 0;

        const unreadCount = await this.prisma.notification.count({
          where: {
            channelId: channel.id,
            sequence: { gt: lastReadSequence },
            senderId: { not: userId },
            parentNotificationId: null,
          },
        });

        const othersMembers = channel.members.filter(
          (m) => m.userId !== userId,
        );
        const othersLastReadSequence =
          othersMembers.length > 0
            ? Math.max(
              ...othersMembers.map((m) => m.lastReadSequence ?? 0),
            )
            : 0;

        return {
          id: channel.id,
          role: member?.role as string,
          createdAt: channel.createdAt,
          memberIds: channel.members.map((m) => m.userId),
          title: channel.title ?? undefined,
          photoUrl: channel.photo?.url ?? undefined,
          lastNotification: lastMsg
            ? {
              text: lastMsg.text,
              createdAt: lastMsg.createdAt,
              sequence: lastMsg.sequence,
              senderId: lastMsg.senderId,
              status: (lastMsg.sequence <= othersLastReadSequence
                ? 'READ'
                : 'DELIVERED') as 'READ' | 'DELIVERED',
            }
            : undefined,
          unreadCount,
          lastReadSequence,
          othersLastReadSequence,
        };
      }),
    );

    return results;
  }

  async updateLastReadSequence(
    channelId: string,
    userId: string,
    sequence: number,
  ): Promise<void> {
    await this.prisma.channelMember.update({
      where: {
        channelId_userId: { channelId, userId },
      },
      data: {
        lastReadSequence: sequence,
      },
    });
  }

  async getUserLastReadSequence(
    channelId: string,
    userId: string,
  ): Promise<number> {
    const member = await this.prisma.channelMember.findUnique({
      where: {
        channelId_userId: { channelId, userId },
      },
      select: { lastReadSequence: true },
    });

    return member?.lastReadSequence ?? 0;
  }

  async getOtherMembersLastReadSequence(
    channelId: string,
    userId: string,
  ): Promise<number> {
    const members = await this.prisma.channelMember.findMany({
      where: {
        channelId,
        userId: { not: userId },
      },
      select: { lastReadSequence: true },
    });

    if (members.length === 0) return 0;
    return Math.max(...members.map((m) => m.lastReadSequence));
  }

  async isMember(channelId: string, userId: string): Promise<boolean> {
    const count = await this.prisma.channelMember.count({
      where: { channelId, userId },
    });
    return count > 0;
  }

  async getMemberRole(
    channelId: string,
    userId: string,
  ): Promise<ChannelRole | null> {
    const member = await this.prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId } },
      select: { role: true },
    });
    return member ? (member.role as ChannelRole) : null;
  }

  async addMember(
    channelId: string,
    userId: string,
    role: ChannelRole = ChannelRole.SUBSCRIBER,
  ): Promise<void> {
    // Get the latest notification sequence in this channel
    const lastNotification = await this.prisma.notification.findFirst({
      where: { channelId, parentNotificationId: null },
      orderBy: { sequence: 'desc' },
      select: { sequence: true },
    });

    const lastSequence = lastNotification?.sequence ?? 0;

    await this.prisma.channelMember.upsert({
      where: {
        channelId_userId: { channelId, userId },
      },
      update: { 
        role: role as PrismaChannelRole,
        lastReadSequence: lastSequence,
      },
      create: {
        channelId,
        userId,
        role: role as PrismaChannelRole,
        lastReadSequence: lastSequence,
      },
    });
  }

  async removeMember(channelId: string, userId: string): Promise<void> {
    await this.prisma.channelMember.delete({
      where: {
        channelId_userId: { channelId, userId },
      },
    });
  }

  async getUnreadCount(channelId: string, userId: string): Promise<number> {
    const member = await this.prisma.channelMember.findUnique({
      where: {
        channelId_userId: { channelId, userId },
      },
      select: { lastReadSequence: true },
    });

    const lastReadSequence = member?.lastReadSequence ?? 0;

    return this.prisma.notification.count({
      where: {
        channelId,
        sequence: { gt: lastReadSequence },
        senderId: { not: userId },
        parentNotificationId: null,
      },
    });
  }

  async searchChannels(
    query: string,
    limit: number = 20,
    isId: boolean = false,
  ): Promise<Channel[]> {
    try {
      if (isId) {
        const channels = await this.prisma.channel.findMany({
          where: {
            OR: [
              { id: query },
              { title: { contains: query, mode: 'insensitive' } },
            ],
          },
          take: limit,
          include: {
            members: true,
            photo: true,
          },
        });

        return channels.map(ChannelMapper.toDomain);
      }

      try {
        const rawResults = await this.prisma.$queryRaw<{ id: string }[]>`
          SELECT id FROM "Channel"
          WHERE title % ${query} OR title ILIKE ${'%' + query + '%'}
          LIMIT ${limit}
        `;

        if (!rawResults || rawResults.length === 0) return [];

        const channelIds = rawResults.map((r) => r.id);

        const channels = await this.prisma.channel.findMany({
          where: { id: { in: channelIds } },
          include: { members: true, photo: true },
        });

        return channels.map(ChannelMapper.toDomain);
      } catch (dbError) {
        const channels = await this.prisma.channel.findMany({
          where: {
            title: { contains: query, mode: 'insensitive' },
          },
          take: limit,
          include: {
            members: true,
            photo: true,
          },
        });

        return channels.map(ChannelMapper.toDomain);
      }
    } catch (e) {
      console.error('searchChannels repository error:', e);
      return [];
    }
  }

  async getMembers(channelId: string): Promise<ChannelMemberDetails[]> {
    const members = await this.prisma.channelMember.findMany({
      where: { channelId },
      include: {
        user: { 
          select: { 
            username: true, 
            fullName: true,
            avatar: { select: { url: true } }
          } 
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return members.map((m) => ({
      userId: m.userId,
      username: m.user.username,
      fullName: m.user.fullName,
      avatarUrl: m.user.avatar?.url,
      role: m.role as ChannelRole,
      lastReadSequence: m.lastReadSequence,
      joinedAt: m.joinedAt,
    }));
  }

  async updateDetails(channelId: string, title?: string, photoUrl?: string): Promise<Channel> {
    const data: any = {};
    if (title !== undefined) data.title = title;
    if (photoUrl !== undefined) {
      if (photoUrl) {
        data.photo = {
          upsert: {
            create: { url: photoUrl },
            update: { url: photoUrl }
          }
        };
      } else {
        data.photo = { delete: true };
      }
    }

    const channel = await this.prisma.channel.update({
      where: { id: channelId },
      data,
      include: { members: true, photo: true },
    });
    return ChannelMapper.toDomain(channel);
  }

  async isBanned(channelId: string): Promise<boolean> {
    const count = await this.prisma.channelBan.count({
      where: {
        channelId,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });
    return count > 0;
  }
}
