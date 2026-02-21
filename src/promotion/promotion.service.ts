import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { Promotion } from './entities/promotion.entity';
import { Meal } from './entities/meal.entity';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class PromotionService {
  private readonly logger = new Logger(PromotionService.name);
  private readonly imagesDir = path.join(
    process.cwd(),
    'public',
    'images',
    'promotions',
  );

  constructor(
    @InjectRepository(Promotion)
    private promotionRepository: Repository<Promotion>,
    @InjectRepository(Meal)
    private mealRepository: Repository<Meal>,
  ) {
    // Ensure images directory exists
    this.ensureImagesDir();
  }

  private async ensureImagesDir(): Promise<void> {
    try {
      await fs.mkdir(this.imagesDir, { recursive: true });
      this.logger.log(`Images directory ready: ${this.imagesDir}`);
    } catch (error) {
      this.logger.error('Failed to create images directory', error);
    }
  }

  async getPromotion(id: string): Promise<Promotion> {
    const promotion = await this.promotionRepository.findOne({
      where: { id },
      relations: ['meals'],
    });

    if (!promotion) {
      throw new NotFoundException(`Promotion ${id} not found`);
    }

    return promotion;
  }

  async getAllPromotions(): Promise<Promotion[]> {
    return this.promotionRepository.find({ relations: ['meals'] });
  }

  getImagePath(id: string): string {
    return path.join(this.imagesDir, `${id}.png`);
  }

  async hasImage(id: string): Promise<boolean> {
    try {
      await fs.access(this.getImagePath(id));
      return true;
    } catch {
      return false;
    }
  }

  async saveImage(id: string, imageBuffer: Buffer): Promise<void> {
    const imagePath = this.getImagePath(id);
    await fs.writeFile(imagePath, imageBuffer);
    this.logger.log(`Image saved to: ${imagePath}`);
  }

  async loadImage(id: string): Promise<Buffer> {
    const imagePath = this.getImagePath(id);
    return fs.readFile(imagePath);
  }

  async deleteImage(id: string): Promise<void> {
    try {
      const imagePath = this.getImagePath(id);
      await fs.unlink(imagePath);
      this.logger.log(`Image deleted: ${imagePath}`);
    } catch (error) {
      // Ignore if file doesn't exist
      if ((error as any).code !== 'ENOENT') {
        this.logger.error('Failed to delete image', error);
      }
    }
  }

  async createPromotion(
    createDto: UpdatePromotionDto,
  ): Promise<Promotion> {
    const id = crypto.randomUUID();
    this.logger.log(`Creating new promotion with id ${id}`);

    const promotion = this.promotionRepository.create({
      id,
      name: createDto.name || 'New Promotion',
      meals: [],
    });

    // Add meals
    if (createDto.meals) {
      promotion.meals = createDto.meals.map((mealDto) =>
        this.mealRepository.create({
          name: mealDto.name,
          description: mealDto.description,
          additionals: (mealDto as any).additionals,
          price: mealDto.price,
          promotion,
        }),
      );
    }

    return await this.promotionRepository.save(promotion);
  }

  async updatePromotion(
    id: string,
    updateDto: UpdatePromotionDto,
  ): Promise<Promotion> {
    this.logger.log(`Updating promotion ${id}`);

    let promotion = await this.promotionRepository.findOne({
      where: { id },
      relations: ['meals'],
    });

    if (!promotion) {
      // Create new promotion if doesn't exist
      promotion = this.promotionRepository.create({
        id,
        name: updateDto.name || 'New Promotion',
        meals: [],
      });
    } else {
      // Update existing
      if (updateDto.name) {
        promotion.name = updateDto.name;
      }

      // Remove old meals
      if (promotion.meals && promotion.meals.length > 0) {
        await this.mealRepository.remove(promotion.meals);
      }
    }

    // Add new meals
    if (updateDto.meals) {
      promotion.meals = updateDto.meals.map((mealDto) =>
        this.mealRepository.create({
          name: mealDto.name,
          description: mealDto.description,
          additionals: (mealDto as any).additionals,
          price: mealDto.price,
          promotion,
        }),
      );
    }

    const savedPromotion = await this.promotionRepository.save(promotion);

    // Delete old image - will be regenerated on next GET or PUT
    this.deleteImage(id).catch(() => {
      // Ignore errors
    });

    return savedPromotion;
  }

  async deletePromotion(id: string): Promise<void> {
    const promotion = await this.getPromotion(id);
    await this.promotionRepository.remove(promotion);
    await this.deleteImage(id);
    this.logger.log(`Promotion ${id} deleted`);
  }
}

