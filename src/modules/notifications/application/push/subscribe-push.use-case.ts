import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/application/use-case.interface';
import { IPushSubscriptionRepository } from '../../domain/push/push-subscription.repository.interface';

export interface SubscribePushInput {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

@Injectable()
export class SubscribePushUseCase
  implements IUseCase<SubscribePushInput, { success: boolean }>
{
  constructor(
    @Inject('PUSH_REPO')
    private readonly pushRepository: IPushSubscriptionRepository,
  ) {}

  async execute(input: SubscribePushInput): Promise<{ success: boolean }> {
    await this.pushRepository.save(
      input.userId,
      input.endpoint,
      input.p256dh,
      input.auth,
    );
    return { success: true };
  }
}
