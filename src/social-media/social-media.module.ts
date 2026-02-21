import { Module } from '@nestjs/common';
import { FacebookService } from './services/facebook.service';
import { ImageGeneratorService } from './services/image-generator.service';
import { InstagramService } from './services/instagram.service';

@Module({
  providers: [FacebookService, ImageGeneratorService, InstagramService],
  exports: [FacebookService, ImageGeneratorService, InstagramService],
})
export class SocialMediaModule {}
