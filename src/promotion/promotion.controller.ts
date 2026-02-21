import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { PromotionService } from './promotion.service';
import { FacebookService } from '../social-media/services/facebook.service';
import { ImageGeneratorService } from '../social-media/services/image-generator.service';
import { HybridAuthGuard } from '../auth/guards/hybrid-auth.guard';
import { getDailyMessage } from './constants/daily-messages.constants';
import { Promotion } from './entities/promotion.entity';
import { Meal } from './entities/meal.entity';

@Controller('promotion')
export class PromotionController {
  private readonly logger = new Logger(PromotionController.name);

  constructor(
    private readonly promotionService: PromotionService,
    private readonly facebookService: FacebookService,
    private readonly imageGeneratorService: ImageGeneratorService,
  ) {}

  @Get()
  async getAllPromotions() {
    this.logger.log('GET /promotion - Fetching all promotions');
    return this.promotionService.getAllPromotions();
  }

  @Get(':id')
  async getPromotion(@Param('id') id: string) {
    this.logger.log(`GET /promotion/${id} - Fetching promotion with image`);

    const promotion = await this.promotionService.getPromotion(id);

    let imageBuffer: Buffer;

    // Check if image exists on disk
    if (await this.promotionService.hasImage(id)) {
      this.logger.log('Loading image from disk...');
      imageBuffer = await this.promotionService.loadImage(id);
    } else {
      // Generate and save to disk
      this.logger.log('Generating and saving image to disk...');
      imageBuffer =
        await this.imageGeneratorService.generatePromotionImage(promotion);
      await this.promotionService.saveImage(id, imageBuffer);
    }

    const base64Image = imageBuffer.toString('base64');

    return {
      promotion,
      image: `data:image/png;base64,${base64Image}`,
    };
  }

  @Post()
  @UseGuards(HybridAuthGuard)
  async createPromotion(@Body() createPromotionDto: CreatePromotionDto) {
    this.logger.log('POST /promotion - Creating new promotion');
    const promotion =
      await this.promotionService.createPromotion(createPromotionDto);
    return { success: true, promotion };
  }

  @Put(':id')
  @UseGuards(HybridAuthGuard)
  async updatePromotion(
    @Param('id') id: string,
    @Body() updatePromotionDto: UpdatePromotionDto,
  ) {
    this.logger.log(`PUT /promotion/${id} - Updating promotion`);

    // Update promotion
    const updatedPromotion = await this.promotionService.updatePromotion(
      id,
      updatePromotionDto,
    );

    // Generate and save image (always needed for preview)
    this.logger.log('Generating promotion image...');
    const imageBuffer =
      await this.imageGeneratorService.generatePromotionImage(updatedPromotion);
    await this.promotionService.saveImage(id, imageBuffer);

    // Response object
    const response: any = {
      id,
      promotion: updatedPromotion,
    };

    // Publish to Facebook only if requested
    if (updatePromotionDto.publishToFacebook) {
      try {
        this.logger.log('Publishing to Facebook...');
        const message = this.formatPromotionMessage(updatedPromotion);
        const { postId } = await this.facebookService.publishPost(
          message,
          imageBuffer,
        );

        this.logger.log(`Successfully published to Facebook: ${postId}`);
        response.social = {
          facebook: {
            success: true,
            postId,
          },
        };
      } catch (error) {
        this.logger.error('Failed to publish to Facebook', error.stack);
        response.social = {
          facebook: {
            success: false,
            error: error.message,
          },
        };
      }
    }

    return response;
  }

  @Delete(':id')
  @UseGuards(HybridAuthGuard)
  async deletePromotion(@Param('id') id: string) {
    this.logger.log(`DELETE /promotion/${id} - Deleting promotion`);
    await this.promotionService.deletePromotion(id);
    return { success: true, message: 'Promotion deleted' };
  }

  private formatPromotionMessage(promotion: Promotion): string {
    const dailyMessage = getDailyMessage();
    let message = `${dailyMessage.message}\n\n`;

    promotion.meals.forEach((meal: Meal, index: number) => {
      message += `${index + 1}. ${meal.name}, ${meal.description} - ${meal.price} zł\n\n`;
    });

    message += dailyMessage.suffix;
    return message;
  }
}
