import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';
import FormData from 'form-data';

@Injectable()
export class FacebookService {
  private readonly logger = new Logger(FacebookService.name);
  private readonly accessToken: string;
  private readonly pageId: string;
  private readonly retryAttempts: number;
  private readonly retryDelay: number;

  constructor(private configService: ConfigService) {
    this.accessToken =
      this.configService.get<string>('FACEBOOK_PAGE_ACCESS_TOKEN') || '';
    this.pageId = this.configService.get<string>('FACEBOOK_PAGE_ID') || '';
    this.retryAttempts =
      this.configService.get<number>('SOCIAL_MEDIA_RETRY_ATTEMPTS') || 3;
    this.retryDelay =
      this.configService.get<number>('SOCIAL_MEDIA_RETRY_DELAY_MS') || 1000;

    if (!this.accessToken || !this.pageId) {
      this.logger.warn(
        'Facebook credentials not configured. Please set FACEBOOK_PAGE_ACCESS_TOKEN and FACEBOOK_PAGE_ID in .env',
      );
    }
  }

  async publishPost(
    message: string,
    imageBuffer: Buffer,
  ): Promise<{ postId: string }> {
    if (!this.accessToken || !this.pageId) {
      throw new Error(
        'Facebook credentials not configured. Check FACEBOOK_PAGE_ACCESS_TOKEN and FACEBOOK_PAGE_ID in .env',
      );
    }

    this.logger.log('Publishing post to Facebook...');

    return this.retryWithBackoff(async () => {
      // Step 1: Upload photo
      const photoId = await this.uploadPhoto(imageBuffer);

      // Step 2: Create post with photo
      const postId = await this.createPost(message, photoId);

      this.logger.log(`Post published successfully: ${postId}`);
      return { postId };
    });
  }

  private async uploadPhoto(imageBuffer: Buffer): Promise<string> {
    const formData = new FormData();
    formData.append('source', imageBuffer, {
      filename: 'promotion.png',
      contentType: 'image/png',
    });
    formData.append('published', 'false'); // Don't publish immediately, wait for feed post
    formData.append('access_token', this.accessToken);

    try {
      this.logger.log('Uploading photo to Facebook...');
      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${this.pageId}/photos`,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: 30000,
        },
      );

      const photoId = response.data.id;
      this.logger.log(`Photo uploaded successfully: ${photoId}`);
      return photoId;
    } catch (error) {
      this.logger.error('Failed to upload photo to Facebook', error);
      throw this.handleError(error);
    }
  }

  private async createPost(message: string, photoId: string): Promise<string> {
    try {
      this.logger.log(`Creating Facebook post with photo ID: ${photoId}`);

      const requestBody = {
        message,
        attached_media: [{ media_fbid: photoId }],
        access_token: this.accessToken,
      };

      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${this.pageId}/feed`,
        requestBody,
        {
          timeout: 30000,
        },
      );

      this.logger.log(`✅ Post created successfully: ${response.data.id}`);
      return response.data.id;
    } catch (error) {
      this.logger.error('Failed to create Facebook post');
      if (axios.isAxiosError(error) && error.response) {
        this.logger.error(
          `Facebook API response: ${JSON.stringify(error.response.data)}`,
        );
        this.logger.error(`Status: ${error.response.status}`);
      }
      throw this.handleError(error);
    }
  }

  private async retryWithBackoff<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < this.retryAttempts; attempt++) {
      try {
        this.logger.log(
          `🔄 Retry attempt ${attempt + 1}/${this.retryAttempts}`,
        );
        const result = await fn();
        this.logger.log(`✅ Attempt ${attempt + 1} succeeded!`);
        return result;
      } catch (error) {
        lastError = error as Error;
        this.logger.error(
          `❌ Attempt ${attempt + 1} failed: ${(error as Error).message}`,
        );

        // Don't retry on 4xx errors (client errors)
        if (this.isClientError(error)) {
          this.logger.warn(
            `Client error (4xx), not retrying: ${(error as Error).message}`,
          );
          throw error;
        }

        if (attempt < this.retryAttempts - 1) {
          const delay = this.retryDelay * Math.pow(2, attempt);
          this.logger.warn(
            `⏱️  Retrying in ${delay}ms... (attempt ${attempt + 2}/${this.retryAttempts})`,
          );
          await this.sleep(delay);
        }
      }
    }

    this.logger.error(
      `All ${this.retryAttempts} attempts failed`,
      lastError?.stack || 'Unknown error',
    );
    throw lastError || new Error('All retry attempts failed');
  }

  private isClientError(error: any): boolean {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      return status !== undefined && status >= 400 && status < 500;
    }
    return false;
  }

  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<any>;
      const responseData = axiosError.response?.data;
      const errorMessage =
        (responseData &&
        typeof responseData === 'object' &&
        'error' in responseData
          ? (responseData.error as any)?.message
          : undefined) ||
        axiosError.message ||
        'Unknown Facebook API error';
      return new Error(`Facebook API error: ${errorMessage}`);
    }
    return error;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
