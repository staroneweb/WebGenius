import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ObjectId } from 'mongodb';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import { User, SubscriptionPlanType } from '../entities/user.entity';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(SubscriptionPlan)
    private subscriptionPlanRepository: Repository<SubscriptionPlan>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getAllPlans() {
    return this.subscriptionPlanRepository.find();
  }

  async upgradePlan(userId: string, planType: SubscriptionPlanType) {
    const user = await this.userRepository.findOne({
      where: { _id: new ObjectId(userId) } as any,
    });
    if (!user) {
      throw new Error('User not found');
    }
    user.subscriptionPlan = planType;
    return this.userRepository.save(user);
  }

  async initializeDefaultPlans() {
    const plans = [
      {
        name: 'Free',
        price: 0,
        features: ['10 prompts/month', 'Basic AI responses', 'Community support'],
      },
      {
        name: 'Basic',
        price: 9.99,
        features: ['100 prompts/month', 'Advanced AI responses', 'Email support', 'Priority queue'],
      },
      {
        name: 'Premium',
        price: 29.99,
        features: ['Unlimited prompts', 'Premium AI responses', '24/7 support', 'API access', 'Custom integrations'],
      },
      {
        name: 'Enterprise',
        price: 99.99,
        features: ['Everything in Premium', 'Dedicated support', 'Custom AI models', 'SLA guarantee', 'On-premise deployment'],
      },
    ];

    for (const planData of plans) {
      const existingPlan = await this.subscriptionPlanRepository.findOne({
        where: { name: planData.name },
      });
      if (!existingPlan) {
        const plan = this.subscriptionPlanRepository.create(planData);
        await this.subscriptionPlanRepository.save(plan);
      }
    }
  }
}

