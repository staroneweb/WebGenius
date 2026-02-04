import { Entity, Column, ObjectIdColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ObjectId } from 'mongodb';

@Entity('subscription_plans')
export class SubscriptionPlan {
  @ObjectIdColumn()
  id: ObjectId;

  @Column()
  name: string;

  @Column('decimal')
  price: number;

  @Column('array', { default: [] })
  features: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

