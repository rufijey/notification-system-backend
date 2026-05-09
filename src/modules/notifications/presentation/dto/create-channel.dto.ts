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
}
