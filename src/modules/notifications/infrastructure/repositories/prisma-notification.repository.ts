import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { INotificationRepository, GlobalNotificationWithRelations } from '../../domain/notifications/notification.repository.interface';
import { Notification } from '../../domain/notifications/notification.entity';
import { NotificationMapper } from '../mappers/notification.mapper';
import { Prisma, Notification as PrismaNotification } from '@prisma/client';

@Injectable()
export class PrismaNotificationRepository implements INotificationRepository {
  constructor(private readonly prisma: PrismaService) { }

  async save(notification: Notification): Promise<Notification> {
    const persistenceData = NotificationMapper.toPersistence(notification);
    const data = await this.prisma.notification.create({
      data: {
        ...persistenceData,
        attachments: {
          create: notification.attachments?.map(url => ({ url })) || [],
        }
      },
      include: { attachments: true }
    });

    return NotificationMapper.toDomain(data);
  }

  async findByClientNotificationId(
    clientNotificationId: string,
  ): Promise<Notification | null> {
    const data = await this.prisma.notification.findUnique({
      where: { clientNotificationId },
      include: { attachments: true }
    });

    if (!data) return null;
    return NotificationMapper.toDomain(data);
  }

  async findMissedNotifications(
    channelId: string,
    lastSequence: number,
  ): Promise<Notification[]> {
    const notifications = await this.prisma.notification.findMany({
      where: {
        channelId,
        sequence: { gt: lastSequence },
      },
      include: { attachments: true },
      orderBy: { sequence: 'asc' },
    });

    return notifications.map(NotificationMapper.toDomain);
  }

  async findMissedNotificationsBulk(
    syncRequests: { channelId: string; lastSequence: number }[],
  ): Promise<Notification[]> {
    if (syncRequests.length === 0) return [];

    const conditions = syncRequests.map((req) => ({
      channelId: req.channelId,
      sequence: { gt: req.lastSequence },
    }));

    const notifications = await this.prisma.notification.findMany({
      where: {
        OR: conditions,
      },
      include: { attachments: true },
      orderBy: { sequence: 'asc' },
    });

    return notifications.map(NotificationMapper.toDomain);
  }

  async findByChannelId(channelId: string): Promise<Notification[]> {
    const notifications = await this.prisma.notification.findMany({
      where: { channelId },
      include: { attachments: true },
      orderBy: { createdAt: 'asc' },
    });

    return notifications.map(NotificationMapper.toDomain);
  }

  async findByChannelIdPaginated(
    channelId: string,
    limit: number,
    beforeSequence?: number,
    query?: string,
  ): Promise<Notification[]> {
    const conditions: Prisma.Sql[] = [Prisma.sql`"channelId" = ${channelId}`];

    if (beforeSequence) {
      conditions.push(Prisma.sql`"sequence" < ${beforeSequence}`);
    }

    if (query) {
      conditions.push(Prisma.sql`("text" % ${query} OR "text" ILIKE ${'%' + query + '%'})`);
      conditions.push(Prisma.sql`"parentNotificationId" IS NULL`);
    }

    const whereClause = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;

    const rawNotifications = await this.prisma.$queryRaw<(PrismaNotification & { attachments_json: any })[]>`
      SELECT 
        n.*,
        (
          SELECT json_agg(json_build_object('url', url))
          FROM "NotificationAttachment"
          WHERE "notificationId" = n.id
        ) as "attachments_json"
      FROM "Notification" n
      ${whereClause}
      ORDER BY n."sequence" DESC
      LIMIT ${limit}
    `;

    const reversed = rawNotifications.reverse();
    
    return reversed.map(n => NotificationMapper.toDomain({
      ...n,
      attachments: n.attachments_json || []
    } as any));
  }

  async findById(id: string): Promise<Notification | null> {
    const data = await this.prisma.notification.findUnique({
      where: { id },
      include: { attachments: true }
    });

    if (!data) return null;
    return NotificationMapper.toDomain(data);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.notification.delete({
      where: { id }
    });
  }

  async getLatestSequence(channelId: string): Promise<number> {
    const lastNotification = await this.prisma.notification.findFirst({
      where: { channelId },
      orderBy: { sequence: 'desc' },
      select: { sequence: true },
    });

    return lastNotification?.sequence || 0;
  }

  async getGlobalNotifications(
    userId: string,
    limit: number,
    beforeId?: string,
    query?: string,
  ): Promise<GlobalNotificationWithRelations[]> {
    const conditions: Prisma.Sql[] = [
      Prisma.sql`n."senderId" != ${userId}`
    ];

    if (query) {
      conditions.push(Prisma.sql`("text" % ${query} OR "text" ILIKE ${'%' + query + '%'})`);
    }

    if (beforeId) {
      conditions.push(Prisma.sql`
        (n."createdAt", n.id) < (
          SELECT "createdAt", id FROM "Notification" WHERE id = ${beforeId}
        )
      `);
    }

    const whereClause = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;

    const notifications = await this.prisma.$queryRaw<GlobalNotificationWithRelations[]>`
      SELECT 
        n.*,
        (
          SELECT json_agg(json_build_object('url', url))
          FROM "NotificationAttachment"
          WHERE "notificationId" = n.id
        ) as "attachments",
        json_build_object(
          'id', c.id,
          'title', c.title,
          'photoUrl', cp.url,
          'members', json_build_array(
            json_build_object('lastReadSequence', cm."lastReadSequence")
          )
        ) as "channel",
        json_build_object(
          'username', u.username,
          'fullName', u."fullName"
        ) as "sender"
      FROM "Notification" n
      INNER JOIN "Channel" c ON n."channelId" = c.id
      LEFT JOIN "ChannelPhoto" cp ON c.id = cp."channelId"
      INNER JOIN "ChannelMember" cm ON c.id = cm."channelId" AND cm."userId" = ${userId}
      INNER JOIN "User" u ON n."senderId" = u.username
      ${whereClause}
      ORDER BY n."createdAt" DESC, n.id DESC
      LIMIT ${limit}
    `;

    return notifications;
  }
}
