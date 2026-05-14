import { Injectable, Inject } from '@nestjs/common';
import { IStorageService, STORAGE_SERVICE } from './ports/storage.port';

@Injectable()
export class GeneratePresignedUrlUseCase {
  constructor(
    @Inject(STORAGE_SERVICE)
    private readonly storageService: IStorageService,
  ) {}

  async execute(fileName: string, contentType: string): Promise<{ uploadUrl: string; fileUrl: string }> {
    return this.storageService.generatePresignedUrl(fileName, contentType);
  }
}
