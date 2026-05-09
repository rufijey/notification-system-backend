export interface PushSubscriptionDetails {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface IPushSubscriptionRepository {
  save(
    userId: string,
    endpoint: string,
    p256dh: string,
    auth: string,
  ): Promise<void>;
  findByUserId(userId: string): Promise<PushSubscriptionDetails[]>;
  findByUserIds(userIds: string[]): Promise<PushSubscriptionDetails[]>;
  deleteByEndpoint(endpoint: string): Promise<void>;
}
