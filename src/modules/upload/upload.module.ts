import { Module } from '@nestjs/common';
import { UploadController } from './presentation/upload.controller';
import { GeneratePresignedUrlUseCase } from './application/generate-presigned-url.use-case';
import { S3StorageService } from './infrastructure/s3.storage.service';
import { STORAGE_SERVICE } from './application/ports/storage.port';

@Module({
  controllers: [UploadController],
  providers: [
    GeneratePresignedUrlUseCase,
    {
      provide: STORAGE_SERVICE,
      useClass: S3StorageService,
    },
  ],
})
export class UploadModule {}
