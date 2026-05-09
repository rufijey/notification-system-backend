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
    const data = await this.prisma.notification.create({
      data: NotificationMapper.toPersistence(notification),
    });

    return NotificationMapper.toDomain(data);
  }

  async findByClientNotificationId(
    clientNotificationId: string,
  ): Promise<Notification | null> {
    const data = await this.prisma.notification.findUnique({
      where: { clientNotificationId },
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
      orderBy: { sequence: 'asc' },
    });

    return notifications.map(NotificationMapper.toDomain);
  }

  async findByChannelId(channelId: string): Promise<Notification[]> {
    const notifications = await this.prisma.notification.findMany({
      where: { channelId },
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

    const rawNotifications = await this.prisma.$queryRaw<PrismaNotification[]>`
      SELECT * FROM "Notification"
      ${whereClause}
      ORDER BY "sequence" DESC
      LIMIT ${limit}
    `;

    return rawNotifications.reverse().map(NotificationMapper.toDomain);
  }

  async findById(id: string): Promise<Notification | null> {
    const data = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!data) return null;
    return NotificationMapper.toDomain(data);
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
        json_build_object(
          'id', c.id,
          'title', c.title,
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
      INNER JOIN "ChannelMember" cm ON c.id = cm."channelId" AND cm."userId" = ${userId}
      INNER JOIN "User" u ON n."senderId" = u.username
      ${whereClause}
      ORDER BY n."createdAt" DESC, n.id DESC
      LIMIT ${limit}
    `;

    return notifications;
  }
}
