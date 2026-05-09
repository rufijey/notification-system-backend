import { Module } from '@nestjs/common';
import { SharedModule } from './shared/shared.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [SharedModule, NotificationsModule, UsersModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
