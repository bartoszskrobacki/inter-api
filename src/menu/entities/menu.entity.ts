import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MenuCategory } from './menu-category.entity';

@Entity('menus')
export class Menu {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  tag: string;

  @OneToMany(() => MenuCategory, (category) => category.menu, {
    cascade: true,
    eager: true,
  })
  categories: MenuCategory[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
