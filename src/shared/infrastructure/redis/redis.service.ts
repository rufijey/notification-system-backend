import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  onModuleInit() {
    const host = process.env.REDIS_HOST || 'redis';
    const port = parseInt(process.env.REDIS_PORT || '6379', 10);

    this.client = new Redis({
      host,
      port,
      maxRetriesPerRequest: null,
    });

    this.client.on('connect', () => {
      this.logger.log(`Successfully connected to Redis at ${host}:${port}`);
    });

    this.client.on('error', (err) => {
      this.logger.error('Redis Client Error:', err);
    });
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.disconnect();
      this.logger.log('Redis connection closed.');
    }
  }

  getClient(): Redis {
    return this.client;
  }

  async rpush(key: string, value: string): Promise<number> {
    return this.client.rpush(key, value);
  }

  async lpop(key: string): Promise<string | null> {
    return this.client.lpop(key);
  }

  async llen(key: string): Promise<number> {
    return this.client.llen(key);
  }
}
