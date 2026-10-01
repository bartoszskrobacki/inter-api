import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateMenuCategoryDto,
  MenuItemDto,
} from './dto/create-menu-category.dto';
import { UpdateMenuCategoryDto } from './dto/update-menu-category.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { Menu } from './entities/menu.entity';
import { MenuCategory } from './entities/menu-category.entity';
import { MenuItem } from './entities/menu-item.entity';

const MENU_ORDER = {
  categories: { position: 'ASC', items: { position: 'ASC' } },
} as const;

@Injectable()
export class MenuService {
  private readonly logger = new Logger(MenuService.name);

  constructor(
    @InjectRepository(Menu)
    private menuRepository: Repository<Menu>,
    @InjectRepository(MenuCategory)
    private categoryRepository: Repository<MenuCategory>,
    @InjectRepository(MenuItem)
    private itemRepository: Repository<MenuItem>,
  ) {}

  async getAllMenus(): Promise<Menu[]> {
    return this.menuRepository.find({
      relations: { categories: { items: true } },
      order: { tag: 'ASC', ...MENU_ORDER },
    });
  }

  async getMenu(tag: string): Promise<Menu> {
    const menu = await this.menuRepository.findOne({
      where: { tag },
      relations: { categories: { items: true } },
      order: MENU_ORDER,
    });

    if (!menu) {
      throw new NotFoundException(`Menu with tag "${tag}" not found`);
    }

    return menu;
  }

  async deleteMenu(tag: string): Promise<void> {
    const menu = await this.getMenu(tag);
    await this.menuRepository.remove(menu);
    this.logger.log(`Menu "${tag}" deleted`);
  }

  async findCategoryById(id: number): Promise<MenuCategory> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['items'],
    });

    if (!category) {
      throw new NotFoundException(`Menu category with id "${id}" not found`);
    }

    return category;
  }

  async createCategory(
    tag: string,
    createDto: CreateMenuCategoryDto,
  ): Promise<MenuCategory> {
    this.logger.log(`Creating menu category in menu "${tag}"`);

    // Menu is created on first category for a given tag
    let menu = await this.menuRepository.findOne({ where: { tag } });
    if (!menu) {
      menu = await this.menuRepository.save(
        this.menuRepository.create({ tag, categories: [] }),
      );
    }

    const category = this.categoryRepository.create({
      name: createDto.name,
      description: createDto.description,
      position: createDto.position ?? 0,
      menu,
      items: [],
    });
    category.items = this.createItems(createDto.items ?? [], category);

    const saved = await this.categoryRepository.save(category);
    return this.findCategoryById(saved.id);
  }

  async updateCategory(
    id: number,
    updateDto: UpdateMenuCategoryDto,
  ): Promise<MenuCategory> {
    this.logger.log(`Updating menu category ${id}`);

    const category = await this.findCategoryById(id);

    if (updateDto.name !== undefined) {
      category.name = updateDto.name;
    }
    if (updateDto.description !== undefined) {
      category.description = updateDto.description;
    }
    if (updateDto.position !== undefined) {
      category.position = updateDto.position;
    }
    category.updatedAt = new Date();

    // Replace items only when a new list is provided
    if (updateDto.items) {
      if (category.items && category.items.length > 0) {
        await this.itemRepository.remove(category.items);
      }
      category.items = this.createItems(updateDto.items, category);
    }

    await this.categoryRepository.save(category);
    return this.findCategoryById(id);
  }

  async deleteCategory(id: number): Promise<void> {
    const category = await this.findCategoryById(id);
    await this.categoryRepository.remove(category);
    this.logger.log(`Menu category ${id} deleted`);
  }

  async findItemById(id: number): Promise<MenuItem> {
    const item = await this.itemRepository.findOne({ where: { id } });

    if (!item) {
      throw new NotFoundException(`Menu item with id "${id}" not found`);
    }

    return item;
  }

  async createItem(
    categoryId: number,
    createDto: MenuItemDto,
  ): Promise<MenuItem> {
    this.logger.log(`Adding item to menu category ${categoryId}`);

    const category = await this.findCategoryById(categoryId);
    // New items go to the end unless a position is given
    const lastPosition = Math.max(
      -1,
      ...(category.items ?? []).map((item) => item.position),
    );

    const item = this.itemRepository.create({
      name: createDto.name,
      description: createDto.description,
      price: createDto.price,
      position: createDto.position ?? lastPosition + 1,
      category,
    });

    const saved = await this.itemRepository.save(item);
    return this.findItemById(saved.id);
  }

  async updateItem(
    id: number,
    updateDto: UpdateMenuItemDto,
  ): Promise<MenuItem> {
    this.logger.log(`Updating menu item ${id}`);

    const item = await this.findItemById(id);

    if (updateDto.name !== undefined) {
      item.name = updateDto.name;
    }
    if (updateDto.description !== undefined) {
      item.description = updateDto.description;
    }
    if (updateDto.price !== undefined) {
      item.price = updateDto.price;
    }
    if (updateDto.position !== undefined) {
      item.position = updateDto.position;
    }

    await this.itemRepository.save(item);
    return this.findItemById(id);
  }

  async deleteItem(id: number): Promise<void> {
    const item = await this.findItemById(id);
    await this.itemRepository.remove(item);
    this.logger.log(`Menu item ${id} deleted`);
  }

  private createItems(
    itemDtos: MenuItemDto[],
    category: MenuCategory,
  ): MenuItem[] {
    return itemDtos.map((itemDto, index) =>
      this.itemRepository.create({
        name: itemDto.name,
        description: itemDto.description,
        price: itemDto.price,
        position: index,
        category,
      }),
    );
  }
}
