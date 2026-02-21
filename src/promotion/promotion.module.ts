import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromotionController } from './promotion.controller';
import { PromotionService } from './promotion.service';
import { SocialMediaModule } from '../social-media/social-media.module';
import { Promotion } from './entities/promotion.entity';
import { Meal } from './entities/meal.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Promotion, Meal]), SocialMediaModule],
  controllers: [PromotionController],
  providers: [PromotionService],
})
export class PromotionModule {}
