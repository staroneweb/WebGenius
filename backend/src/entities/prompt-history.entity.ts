import { Entity, Column, ObjectIdColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ObjectId } from 'mongodb';
import { User } from './user.entity';

@Entity('prompt_history')
export class PromptHistory {
  @ObjectIdColumn()
  id: ObjectId;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('text')
  prompt: string;

  @Column('text')
  aiResponse: string;

  @CreateDateColumn()
  createdAt: Date;
}

