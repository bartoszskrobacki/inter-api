import { Injectable, Logger } from '@nestjs/common';

/**
 * Instagram Service - STUB Implementation
 *
 * TODO: Full implementation requires:
 * 1. Image storage solution (Cloudinary, AWS S3, or self-hosted)
 * 2. Instagram Business Account ID
 * 3. Instagram Access Token
 * 4. Public URL for image upload
 *
 * Instagram Graph API requires public URL for images, not raw binary data.
 * Facebook API accepts binary upload directly, but Instagram does not.
 */
@Injectable()
export class InstagramService {
  private readonly logger = new Logger(InstagramService.name);

  async publishPost(
    caption: string,
    imageBuffer: Buffer,
  ): Promise<{ mediaId: string }> {
    this.logger.warn(
      'Instagram publishing not implemented yet - requires image storage',
    );
    this.logger.debug(`Would publish to Instagram: ${caption}`);

    // TODO: Implement when image storage is available
    // Steps would be:
    // 1. Upload image to storage (S3/Cloudinary) → get public URL
    // 2. Create media container with Instagram API
    // 3. Publish container
    // 4. Return media ID

    return { mediaId: 'instagram-not-implemented' };
  }
}
