import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { GeneratePresignedUrlUseCase } from '../application/generate-presigned-url.use-case';
import { AtGuard } from '../../users/presentation/guards/at.guard';
import { GeneratePresignedUrlDto } from './dto/generate-presigned-url.dto';

@Controller('upload')
@UseGuards(AtGuard)
export class UploadController {
  constructor(private readonly generatePresignedUrlUseCase: GeneratePresignedUrlUseCase) {}

  @Post('presigned-url')
  async getPresignedUrl(@Body() body: GeneratePresignedUrlDto) {
    return this.generatePresignedUrlUseCase.execute(body.fileName, body.contentType);
  }
}
