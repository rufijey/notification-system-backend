import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/application/use-case.interface';
import { INotificationRepository } from '../../domain/notifications/notification.repository.interface';

export interface GetGlobalNotificationsInput {
  userId: string;
  limit: number;
  beforeId?: string;
  query?: string;
}

@Injectable()
export class GetGlobalNotificationsUseCase implements IUseCase<
  GetGlobalNotificationsInput,
  { items: any[]; hasMore: boolean }
> {
  constructor(
    @Inject('MESSAGE_REPO')
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(
    input: GetGlobalNotificationsInput,
  ): Promise<{ items: any[]; hasMore: boolean }> {
    const items = await this.notificationRepository.getGlobalNotifications(
      input.userId,
      input.limit + 1,
      input.beforeId,
      input.query,
    );

    const hasMore = items.length > input.limit;
    const paginatedItems = hasMore ? items.slice(0, input.limit) : items;

    return {
      items: paginatedItems,
      hasMore,
    };
  }
}
