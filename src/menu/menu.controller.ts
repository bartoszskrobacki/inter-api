import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  CreateMenuCategoryDto,
  MenuItemDto,
} from './dto/create-menu-category.dto';
import { UpdateMenuCategoryDto } from './dto/update-menu-category.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { MenuService } from './menu.service';
import { RebuildService } from '../common/rebuild.service';
import { HybridAuthGuard } from '../auth/guards/hybrid-auth.guard';

@Controller('menu')
export class MenuController {
  private readonly logger = new Logger(MenuController.name);

  constructor(
    private readonly menuService: MenuService,
    private readonly rebuildService: RebuildService,
  ) {}

  @Get()
  async getAllMenus() {
    this.logger.log('GET /menu - Fetching all menus');
    return this.menuService.getAllMenus();
  }

  @Get(':tag')
  async getMenu(@Param('tag') tag: string) {
    this.logger.log(`GET /menu/${tag} - Fetching menu`);
    return this.menuService.getMenu(tag);
  }

  @Post('rebuild')
  @UseGuards(HybridAuthGuard)
  rebuild() {
    this.logger.log('POST /menu/rebuild - Triggering rebuild');
    this.rebuildService.trigger();
    return { success: true, message: 'Rebuild triggered' };
  }

  @Delete(':tag')
  @UseGuards(HybridAuthGuard)
  async deleteMenu(@Param('tag') tag: string) {
    this.logger.log(`DELETE /menu/${tag} - Deleting menu`);
    await this.menuService.deleteMenu(tag);
    return { success: true, message: 'Menu deleted' };
  }

  @Post(':tag/categories')
  @UseGuards(HybridAuthGuard)
  async createCategory(
    @Param('tag') tag: string,
    @Body() createDto: CreateMenuCategoryDto,
  ) {
    this.logger.log(`POST /menu/${tag}/categories - Creating menu category`);
    const category = await this.menuService.createCategory(tag, createDto);
    return { success: true, category };
  }

  @Put('categories/:id')
  @UseGuards(HybridAuthGuard)
  async updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateMenuCategoryDto,
  ) {
    this.logger.log(`PUT /menu/categories/${id} - Updating menu category`);
    const category = await this.menuService.updateCategory(id, updateDto);
    return { success: true, category };
  }

  @Delete('categories/:id')
  @UseGuards(HybridAuthGuard)
  async deleteCategory(@Param('id', ParseIntPipe) id: number) {
    this.logger.log(`DELETE /menu/categories/${id} - Deleting menu category`);
    await this.menuService.deleteCategory(id);
    return { success: true, message: 'Menu category deleted' };
  }

  @Post('categories/:id/items')
  @UseGuards(HybridAuthGuard)
  async createItem(
    @Param('id', ParseIntPipe) categoryId: number,
    @Body() createDto: MenuItemDto,
  ) {
    this.logger.log(`POST /menu/categories/${categoryId}/items - Adding item`);
    const item = await this.menuService.createItem(categoryId, createDto);
    return { success: true, item };
  }

  @Put('items/:id')
  @UseGuards(HybridAuthGuard)
  async updateItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateMenuItemDto,
  ) {
    this.logger.log(`PUT /menu/items/${id} - Updating menu item`);
    const item = await this.menuService.updateItem(id, updateDto);
    return { success: true, item };
  }

  @Delete('items/:id')
  @UseGuards(HybridAuthGuard)
  async deleteItem(@Param('id', ParseIntPipe) id: number) {
    this.logger.log(`DELETE /menu/items/${id} - Deleting menu item`);
    await this.menuService.deleteItem(id);
    return { success: true, message: 'Menu item deleted' };
  }
}
