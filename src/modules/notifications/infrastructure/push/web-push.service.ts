import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as webpush from 'web-push';

@Injectable()
export class WebPushService implements OnModuleInit {
  private readonly logger = new Logger(WebPushService.name);
  private publicKey: string;

  onModuleInit() {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT;

    if (!publicKey || !privateKey || !subject) {
      const errorMessage = 'CRITICAL ERROR: VAPID keys (VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT) are missing or incomplete in your backend .env file. Please generate them and set them securely.';
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    this.publicKey = publicKey;

    webpush.setVapidDetails(
      subject,
      publicKey,
      privateKey,
    );
    this.logger.log('Web Push VAPID keys loaded successfully from environment.');
  }

  getPublicKey(): string {
    return this.publicKey;
  }

  async sendNotification(
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
    payload: { title: string; body: string; data?: Record<string, unknown> },
  ): Promise<void> {
    try {
      await webpush.sendNotification(
        subscription,
        JSON.stringify(payload),
      );
    } catch (error: any) {
      if (error.statusCode === 410 || error.statusCode === 404) {
        throw error;
      }
      this.logger.error(`Failed to send Web Push to ${subscription.endpoint}:`, error);
    }
  }
}
