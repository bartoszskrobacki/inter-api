import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as pureimage from 'pureimage';
import * as path from 'path';
import { PassThrough } from 'stream';

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
export class ImageGeneratorService implements OnModuleInit {
  private readonly logger = new Logger(ImageGeneratorService.name);

  async onModuleInit() {
    await this.loadFonts();
  }

  private async loadFonts(): Promise<void> {
    const fontDir = path.join(__dirname, '..', '..', 'assets', 'fonts');

    const regular = pureimage.registerFont(
      path.join(fontDir, 'Arial.ttf'),
      'Arial',
    );
    const bold = pureimage.registerFont(
      path.join(fontDir, 'Arial Bold.ttf'),
      'Arial Bold',
    );

    await regular.load();
    await bold.load();

    this.logger.log('Fonts loaded');
  }

  async generatePromotionImage(promotion: Promotion): Promise<Buffer> {
    this.logger.log(`Generating image for promotion: ${promotion.name}`);

    const width = 1200;
    const height = 630;
    const canvas = pureimage.make(width, height);
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
    ctx.font = '56px "Arial Bold"';
    ctx.fillText(promotion.name.toUpperCase(), 60, 120);

    // Underline
    ctx.strokeStyle = '#ff6b35';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(60, 140);
    ctx.lineTo(300, 140);
    ctx.stroke();

    // Meals list
    let yOffset = 220;

    for (const [index, meal] of promotion.meals.entries()) {
      ctx.font = '32px "Arial Bold"';
      ctx.fillStyle = '#333333';
      ctx.fillText(`${index + 1}. ${meal.name}`, 60, yOffset);

      if (meal.description) {
        ctx.font = '24px "Arial"';
        ctx.fillStyle = '#666666';
        ctx.fillText(meal.description, 80, yOffset + 35);
      }

      ctx.font = '28px "Arial Bold"';
      ctx.fillStyle = '#ff6b35';
      ctx.fillText(`${meal.price} zł`, width - 200, yOffset);

      yOffset += meal.description ? 100 : 70;

      if (yOffset > height - 100) break;
    }

    // Footer
    ctx.font = '20px "Arial"';
    ctx.fillStyle = '#999999';
    const timestamp = new Date().toLocaleString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    ctx.fillText(`Wygenerowano: ${timestamp}`, 60, height - 40);

    // Anti-duplicate pixel for Facebook
    const uniqueColor = Math.floor(Math.random() * 10);
    ctx.fillStyle = `rgba(255, 255, 255, 0.0${uniqueColor})`;
    ctx.fillRect(width - 1, height - 1, 1, 1);

    this.logger.log('Image generated successfully');
    return this.canvasToBuffer(canvas);
  }

  private async canvasToBuffer(canvas: ReturnType<typeof pureimage.make>): Promise<Buffer> {
    const chunks: Buffer[] = [];
    const stream = new PassThrough();
    stream.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
    await pureimage.encodePNGToStream(canvas, stream);
    return Buffer.concat(chunks);
  }
}
