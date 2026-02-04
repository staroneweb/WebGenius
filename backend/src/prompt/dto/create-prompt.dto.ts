import { IsString, IsNotEmpty } from 'class-validator';

export class CreatePromptDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @IsString()
  @IsNotEmpty()
  aiResponse: string;
}

