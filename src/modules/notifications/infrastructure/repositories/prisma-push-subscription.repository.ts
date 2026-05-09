import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import {
  IPushSubscriptionRepository,
  PushSubscriptionDetails,
} from '../../domain/push/push-subscription.repository.interface';

@Injectable()
export class PrismaPushSubscriptionRepository
  implements IPushSubscriptionRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async save(
    userId: string,
    endpoint: string,
    p256dh: string,
    auth: string,
  ): Promise<void> {
    await this.prisma.pushSubscription.upsert({
      where: { endpoint },
      create: {
        userId,
        endpoint,
        p256dh,
        auth,
      },
      update: {
        userId,
        p256dh,
        auth,
      },
    });
  }

  async findByUserId(userId: string): Promise<PushSubscriptionDetails[]> {
    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId },
    });

    return subscriptions.map((s) => ({
      endpoint: s.endpoint,
      keys: {
        p256dh: s.p256dh,
        auth: s.auth,
      },
    }));
  }

  async findByUserIds(userIds: string[]): Promise<PushSubscriptionDetails[]> {
    if (userIds.length === 0) return [];
    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: {
        userId: { in: userIds },
      },
    });

    return subscriptions.map((s) => ({
      endpoint: s.endpoint,
      keys: {
        p256dh: s.p256dh,
        auth: s.auth,
      },
    }));
  }

  async deleteByEndpoint(endpoint: string): Promise<void> {
    await this.prisma.pushSubscription.deleteMany({
      where: { endpoint },
    });
  }
}
