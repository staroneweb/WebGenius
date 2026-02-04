import { Controller, Post, Get, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PromptService } from './prompt.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { CreatePromptDto } from './dto/create-prompt.dto';

@Controller('prompt')
export class PromptController {
  constructor(private promptService: PromptService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentUser() user: any,
    @Body() createPromptDto: CreatePromptDto,
  ) {
    // JWT strategy ensures id is always a string
    const userId = user.id || (user._id?.toString());
    return this.promptService.create(
      userId,
      createPromptDto.prompt,
      createPromptDto.aiResponse,
    );
  }

  @Get('history')
  async getHistory(
    @Query('limit') limit?: string,
    @Query('userId') userId?: string,
  ) {
    // Use provided userId or default test userId for now
    const targetUserId = userId || '691df5ddac69fc46beca44b3';
    return this.promptService.getHistory(
      targetUserId,
      limit ? parseInt(limit) : 50,
    );
  }

  @Delete('history/:id')
  async deletePromptHistory(
    @Param('id') id: string,
    @Query('userId') userId?: string,
  ) {
    // Use provided userId or default test userId for now
    const targetUserId = userId || '691df5ddac69fc46beca44b3';
    return this.promptService.deletePromptHistory(id, targetUserId);
  }
}

