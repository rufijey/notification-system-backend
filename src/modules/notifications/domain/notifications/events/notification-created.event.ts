import { Notification } from '../notification.entity';

export class NotificationCreatedEvent {
  constructor(public readonly notification: Notification) {}
}
