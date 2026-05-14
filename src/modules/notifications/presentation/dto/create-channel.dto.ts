import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateChannelDto {
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  memberIds: string[];

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsOptional()
  photoUrl?: string;

  @IsOptional()
  isEncrypted?: boolean;

  @IsOptional()
  encryptedKeys?: Record<string, string>;
}
