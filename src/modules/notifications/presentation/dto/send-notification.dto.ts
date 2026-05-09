import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { NotificationPriority } from '../../domain/notifications/notification-priority.enum';

export class SendNotificationDto {
  @IsString()
  @IsNotEmpty()
  channelId: string;

  @IsString()
  @IsNotEmpty()
  text: string;

  @IsString()
  @IsNotEmpty()
  clientNotificationId: string;

  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority;

  @IsString()
  @IsOptional()
  parentNotificationId?: string;
}
