import { Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { PrismaService } from './infrastructure/prisma/prisma.service';
import { RedisService } from './infrastructure/redis/redis.service';
import { GlobalExceptionFilter } from './presentation/filters/global-exception.filter';

@Global()
@Module({
  providers: [
    PrismaService,
    RedisService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
  exports: [PrismaService, RedisService],
})
export class SharedModule {}
