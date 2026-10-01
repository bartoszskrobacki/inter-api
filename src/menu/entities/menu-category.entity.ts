import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Menu } from './menu.entity';
import { MenuItem } from './menu-item.entity';

@Entity('menu_categories')
export class MenuCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: 0 })
  position: number;

  @ManyToOne(() => Menu, (menu) => menu.categories, {
    onDelete: 'CASCADE',
  })
  menu: Menu;

  @OneToMany(() => MenuItem, (item) => item.category, {
    cascade: true,
    eager: true,
  })
  items: MenuItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
