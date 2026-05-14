import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SharedModule } from './shared/shared.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { UsersModule } from './modules/users/users.module';
import { UploadModule } from './modules/upload/upload.module';
import { AdminModule } from './modules/admin/admin.module';

import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: true,
    }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'redis',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
    SharedModule,
    NotificationsModule,
    UsersModule,
    UploadModule,
    AdminModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
