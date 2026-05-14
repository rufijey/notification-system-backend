import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { IStorageService } from '../application/ports/storage.port';

@Injectable()
export class S3StorageService implements IStorageService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.bucketName = process.env.AWS_S3_BUCKET_NAME || 'notification-system-images';
    
    // Read directly from process.env since ConfigModule might be used differently
    const region = process.env.AWS_REGION || 'eu-north-1';
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!accessKeyId || !secretAccessKey) {
        console.warn('AWS Credentials are not provided in environment variables.');
    }

    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId: accessKeyId || '',
        secretAccessKey: secretAccessKey || '',
      },
    });
  }

  async generatePresignedUrl(fileName: string, contentType: string): Promise<{ uploadUrl: string; fileUrl: string }> {
    try {
      const fileExtension = fileName.split('.').pop();
      const uniqueFileName = `${uuidv4()}.${fileExtension}`;
      
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: uniqueFileName,
        ContentType: contentType,
      });

      const presignedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: 3600,
      });

      const region = process.env.AWS_REGION || 'eu-north-1';
      const fileUrl = `https://${this.bucketName}.s3.${region}.amazonaws.com/${uniqueFileName}`;

      return { uploadUrl: presignedUrl, fileUrl };
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      throw error;
    }
  }
}
