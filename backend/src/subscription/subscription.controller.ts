import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, SubscriptionPlanType } from '../entities/user.entity';

@Controller('subscription')
@UseGuards(JwtAuthGuard)
export class SubscriptionController {
  constructor(private subscriptionService: SubscriptionService) {}

  @Get('list')
  async listPlans() {
    return this.subscriptionService.getAllPlans();
  }

  @Post('upgrade')
  async upgrade(
    @CurrentUser() user: User,
    @Body('planType') planType: SubscriptionPlanType,
  ) {
    return this.subscriptionService.upgradePlan(user.id.toString(), planType);
  }
}

