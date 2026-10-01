import { Test, TestingModule } from '@nestjs/testing';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';
import { RebuildService } from '../common/rebuild.service';

describe('MenuController', () => {
  let controller: MenuController;
  let rebuildService: { trigger: jest.Mock };

  beforeEach(async () => {
    rebuildService = { trigger: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MenuController],
      providers: [
        { provide: MenuService, useValue: {} },
        { provide: RebuildService, useValue: rebuildService },
      ],
    }).compile();

    controller = module.get<MenuController>(MenuController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('rebuild triggers RebuildService', () => {
    expect(controller.rebuild()).toEqual({
      success: true,
      message: 'Rebuild triggered',
    });
    expect(rebuildService.trigger).toHaveBeenCalledTimes(1);
  });
});
