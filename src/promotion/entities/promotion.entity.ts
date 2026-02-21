import {
  Entity,
  PrimaryColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Meal } from './meal.entity';

@Entity('promotions')
export class Promotion {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @OneToMany(() => Meal, (meal) => meal.promotion, {
    cascade: true,
    eager: true,
  })
  meals: Meal[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
