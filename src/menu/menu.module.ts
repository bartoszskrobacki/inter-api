import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';
import { RebuildService } from '../common/rebuild.service';
import { Menu } from './entities/menu.entity';
import { MenuCategory } from './entities/menu-category.entity';
import { MenuItem } from './entities/menu-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Menu, MenuCategory, MenuItem])],
  controllers: [MenuController],
  providers: [MenuService, RebuildService],
})
export class MenuModule {}
