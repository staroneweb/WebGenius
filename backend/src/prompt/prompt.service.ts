import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PromptHistory } from '../entities/prompt-history.entity';
import { ObjectId } from 'mongodb';

@Injectable()
export class PromptService {
  constructor(
    @InjectRepository(PromptHistory)
    private promptRepository: Repository<PromptHistory>,
  ) {}

  async create(userId: string, prompt: string, aiResponse: string) {
    const promptHistory = this.promptRepository.create({
      userId,
      prompt,
      aiResponse,
    });
    return this.promptRepository.save(promptHistory);
  }

  async getHistory(userId: string, limit: number = 50) {
    const history = await this.promptRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
    
    // Convert ObjectId to string for frontend compatibility
    return history.map((item) => ({
      ...item,
      id: item.id.toString(),
    }));
  }

  async deletePromptHistory(id: string, userId: string) {
    const promptHistory = await this.promptRepository.findOne({
      where: { _id: new ObjectId(id) } as any,
    });

    if (!promptHistory || promptHistory.userId !== userId) {
      throw new Error('Prompt history not found or access denied');
    }

    await this.promptRepository.remove(promptHistory);
    return { message: 'Prompt history deleted successfully' };
  }
}

