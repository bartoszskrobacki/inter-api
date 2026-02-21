import { Injectable, Logger } from '@nestjs/common';
import { createCanvas } from '@napi-rs/canvas';

interface Meal {
  id: number;
  name: string;
  description?: string;
  price: number;
}

interface Promotion {
  name: string;
  meals: Meal[];
}

@Injectable()
export class ImageGeneratorService {
  private readonly logger = new Logger(ImageGeneratorService.name);

  async generatePromotionImage(promotion: Promotion): Promise<Buffer> {
    this.logger.log(`Generating image for promotion: ${promotion.name}`);

    const width = 1200;
    const height = 630;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Border
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, width - 40, height - 40);

    // Title
    ctx.fillStyle = '#1a1a1a';
    ctx.font = 'bold 56px Arial';
    ctx.fillText(promotion.name.toUpperCase(), 60, 120);

    // Underline
    ctx.strokeStyle = '#ff6b35';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(60, 140);
    ctx.lineTo(300, 140);
    ctx.stroke();

    // Meals list
    ctx.fillStyle = '#333333';
    ctx.font = '28px Arial';
    let yOffset = 220;

    promotion.meals.forEach((meal, index) => {
      // Meal name
      ctx.font = 'bold 32px Arial';
      ctx.fillText(`${index + 1}. ${meal.name}`, 60, yOffset);

      // Meal description
      if (meal.description) {
        ctx.font = '24px Arial';
        ctx.fillStyle = '#666666';
        ctx.fillText(meal.description, 80, yOffset + 35);
        ctx.fillStyle = '#333333';
      }

      // Price
      ctx.font = 'bold 28px Arial';
      ctx.fillStyle = '#ff6b35';
      ctx.fillText(`${meal.price} zł`, width - 200, yOffset);
      ctx.fillStyle = '#333333';

      yOffset += meal.description ? 100 : 70;

      // Prevent overflow
      if (yOffset > height - 100) {
        return;
      }
    });

    // Footer
    ctx.font = 'italic 20px Arial';
    ctx.fillStyle = '#999999';
    const timestamp = new Date().toLocaleString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    ctx.fillText(`Wygenerowano: ${timestamp}`, 60, height - 40);

    // Add invisible unique pixel to prevent Facebook duplicate detection
    const uniqueColor = Math.floor(Math.random() * 10);
    ctx.fillStyle = `rgba(255, 255, 255, 0.0${uniqueColor})`;
    ctx.fillRect(width - 1, height - 1, 1, 1);

    this.logger.log('Image generated successfully');
    return canvas.toBuffer('image/png');
  }
}
