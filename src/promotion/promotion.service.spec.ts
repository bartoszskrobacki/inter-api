import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PromotionService } from './promotion.service';
import { Promotion } from './entities/promotion.entity';
import { Meal } from './entities/meal.entity';

describe('PromotionService', () => {
  let service: PromotionService;
  let promotionRepository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let mealRepository: { create: jest.Mock; remove: jest.Mock };

  beforeEach(async () => {
    promotionRepository = {
      findOne: jest.fn(),
      create: jest.fn((entity) => entity),
      save: jest.fn((entity) => Promise.resolve(entity)),
    };
    mealRepository = {
      create: jest.fn((entity) => entity),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromotionService,
        {
          provide: getRepositoryToken(Promotion),
          useValue: promotionRepository,
        },
        {
          provide: getRepositoryToken(Meal),
          useValue: mealRepository,
        },
      ],
    }).compile();

    service = module.get<PromotionService>(PromotionService);
    // Avoid side effects from unrelated behavior in tests.
    jest.spyOn(service as any, 'triggerRebuild').mockImplementation(() => {});
    jest.spyOn(service as any, 'deleteImage').mockResolvedValue(undefined);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updatePromotion', () => {
    it('bumps updatedAt even when name/tag are unchanged', async () => {
      const staleUpdatedAt = new Date('2020-01-01T00:00:00.000Z');
      const existing: Promotion = {
        id: 'promo-1',
        name: 'Same Name',
        tag: 'same-tag',
        meals: [],
        createdAt: staleUpdatedAt,
        updatedAt: staleUpdatedAt,
      };
      promotionRepository.findOne.mockResolvedValue(existing);

      const result = await service.updatePromotion('promo-1', {
        name: 'Same Name',
        tag: 'same-tag',
      } as any);

      expect(result.updatedAt.getTime()).toBeGreaterThan(
        staleUpdatedAt.getTime(),
      );
    });
  });
});
