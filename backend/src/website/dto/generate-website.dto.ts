import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class GenerateWebsiteDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @IsString()
  websiteName: string;

  @IsString()
  @IsOptional()
  userId?: string;
}

