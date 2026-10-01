import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MenuService } from './menu.service';
import { Menu } from './entities/menu.entity';
import { MenuCategory } from './entities/menu-category.entity';
import { MenuItem } from './entities/menu-item.entity';

describe('MenuService', () => {
  let service: MenuService;
  let menuRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let categoryRepository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let itemRepository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    menuRepository = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      create: jest.fn((entity: object) => entity),
      save: jest.fn((entity: object) => Promise.resolve({ id: 1, ...entity })),
    };
    // Saved entities are returned by findOne, like a real repository
    let savedCategory: object | null = null;
    categoryRepository = {
      findOne: jest.fn(() => Promise.resolve(savedCategory)),
      create: jest.fn((entity: object) => entity),
      save: jest.fn((entity: object) => {
        savedCategory = { id: 1, ...entity };
        return Promise.resolve(savedCategory);
      }),
    };
    let savedItem: object | null = null;
    itemRepository = {
      findOne: jest.fn(() => Promise.resolve(savedItem)),
      create: jest.fn((entity: object) => entity),
      save: jest.fn((entity: object) => {
        savedItem = { id: 1, ...entity };
        return Promise.resolve(savedItem);
      }),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MenuService,
        { provide: getRepositoryToken(Menu), useValue: menuRepository },
        {
          provide: getRepositoryToken(MenuCategory),
          useValue: categoryRepository,
        },
        { provide: getRepositoryToken(MenuItem), useValue: itemRepository },
      ],
    }).compile();

    service = module.get<MenuService>(MenuService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMenu', () => {
    it('fetches menu by tag ordering categories and items by position', async () => {
      menuRepository.findOne.mockResolvedValue({ id: 1, tag: 'bar_u_piotra' });

      await service.getMenu('bar_u_piotra');

      expect(menuRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tag: 'bar_u_piotra' },
          order: {
            categories: { position: 'ASC', items: { position: 'ASC' } },
          },
        }),
      );
    });

    it('throws NotFoundException for unknown tag', async () => {
      menuRepository.findOne.mockResolvedValue(null);

      await expect(service.getMenu('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createCategory', () => {
    it('creates the menu for a new tag and assigns item positions', async () => {
      menuRepository.findOne.mockResolvedValue(null);

      const result = await service.createCategory('bar_u_piotra', {
        name: 'Zupy',
        items: [
          { name: 'Pomidorowa', price: 12 },
          { name: 'Żurek', price: 14 },
        ],
      });

      expect(menuRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ tag: 'bar_u_piotra' }),
      );
      expect(result.menu.tag).toBe('bar_u_piotra');
      expect(result.position).toBe(0);
      expect(result.items.map((i) => [i.name, i.position])).toEqual([
        ['Pomidorowa', 0],
        ['Żurek', 1],
      ]);
    });

    it('reuses an existing menu for the tag', async () => {
      const menu = { id: 5, tag: 'bar_u_piotra', categories: [] } as Menu;
      menuRepository.findOne.mockResolvedValue(menu);

      const result = await service.createCategory('bar_u_piotra', {
        name: 'Zupy',
        items: [],
      });

      expect(menuRepository.save).not.toHaveBeenCalled();
      expect(result.menu).toBe(menu);
    });
  });

  describe('updateCategory', () => {
    it('replaces items and bumps updatedAt', async () => {
      const staleUpdatedAt = new Date('2020-01-01T00:00:00.000Z');
      const oldItems = [{ id: 1, name: 'Old', price: 10 }] as MenuItem[];
      categoryRepository.findOne.mockResolvedValue({
        id: 1,
        name: 'Zupy',
        position: 0,
        items: oldItems,
        createdAt: staleUpdatedAt,
        updatedAt: staleUpdatedAt,
      } as MenuCategory);

      const result = await service.updateCategory(1, {
        items: [
          { name: 'A', price: 1 },
          { name: 'B', price: 2 },
        ],
      });

      expect(itemRepository.remove).toHaveBeenCalledWith(oldItems);
      expect(result.items.map((i) => [i.name, i.position])).toEqual([
        ['A', 0],
        ['B', 1],
      ]);
      expect(result.updatedAt.getTime()).toBeGreaterThan(
        staleUpdatedAt.getTime(),
      );
    });

    it('keeps items when no list is provided', async () => {
      const items = [{ id: 1, name: 'Old', price: 10 }] as MenuItem[];
      categoryRepository.findOne.mockResolvedValue({
        id: 1,
        name: 'Zupy',
        position: 0,
        items,
      } as MenuCategory);

      const result = await service.updateCategory(1, { name: 'Zupy dnia' });

      expect(itemRepository.remove).not.toHaveBeenCalled();
      expect(result.items).toBe(items);
      expect(result.name).toBe('Zupy dnia');
    });
  });

  describe('createItem', () => {
    it('appends the item after the last position by default', async () => {
      categoryRepository.findOne.mockResolvedValue({
        id: 1,
        items: [
          { id: 1, position: 0 },
          { id: 2, position: 3 },
        ],
      } as MenuCategory);

      const result = await service.createItem(1, { name: 'Bigos', price: 20 });

      expect(result.position).toBe(4);
      expect(result.name).toBe('Bigos');
    });

    it('starts at position 0 in an empty category', async () => {
      categoryRepository.findOne.mockResolvedValue({
        id: 1,
        items: [],
      } as unknown as MenuCategory);

      const result = await service.createItem(1, { name: 'Bigos', price: 20 });

      expect(result.position).toBe(0);
    });
  });

  describe('updateItem', () => {
    it('updates only provided fields', async () => {
      itemRepository.findOne.mockResolvedValue({
        id: 7,
        name: 'Schabowy',
        description: 'ziemniaki',
        price: 27.9,
        position: 2,
      } as MenuItem);

      const result = await service.updateItem(7, { price: 29.9 });

      expect(result).toMatchObject({
        name: 'Schabowy',
        description: 'ziemniaki',
        price: 29.9,
        position: 2,
      });
    });

    it('throws NotFoundException for unknown item', async () => {
      itemRepository.findOne.mockResolvedValue(null);

      await expect(service.updateItem(99, { price: 1 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
