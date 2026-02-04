import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebsiteService } from './website.service';
import { WebsiteController } from './website.controller';
import { Website } from '../entities/website.entity';
import { PromptHistory } from '../entities/prompt-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Website, PromptHistory])],
  controllers: [WebsiteController],
  providers: [WebsiteService],
  exports: [WebsiteService],
})
export class WebsiteModule {}

