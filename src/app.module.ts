import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SharedModule } from './shared/shared.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'redis',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
    SharedModule,
    NotificationsModule,
    UsersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
