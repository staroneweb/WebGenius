import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromptService } from './prompt.service';
import { PromptController } from './prompt.controller';
import { PromptHistory } from '../entities/prompt-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PromptHistory])],
  controllers: [PromptController],
  providers: [PromptService],
  exports: [PromptService],
})
export class PromptModule {}

