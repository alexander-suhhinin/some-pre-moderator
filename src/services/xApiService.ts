import { XPostRequest, XPostResponse } from '../types';
import OAuth from 'oauth-1.0a';
import crypto from 'node:crypto';

export interface TwitterCredentials {
  bearerToken: string;
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessTokenSecret: string;
}

export interface TwitterMediaUpload {
  mediaId: string;
  processingInfo?: {
    state: 'pending' | 'in_progress' | 'succeeded' | 'failed';
    checkAfterSecs?: number;
    progressPercent?: number;
  };
}

export class XApiService {
  private readonly baseUrl = 'https://api.twitter.com/2';
  private readonly uploadUrl = 'https://upload.twitter.com/1.1';
  private credentials: TwitterCredentials;
  private oauth: OAuth;

  constructor(credentials: TwitterCredentials) {
    this.credentials = credentials;
    this.oauth = new OAuth({
      consumer: {
        key: credentials.apiKey,
        secret: credentials.apiSecret
      },
      signature_method: 'HMAC-SHA1',
      hash_function(base_string, key) {
        return crypto
          .createHmac('sha1', key)
          .update(base_string)
          .digest('base64');
      }
    });
  }

  /**
   * Post a tweet with optional media
   */
  async postTweet(request: XPostRequest): Promise<XPostResponse> {
    try {
      let mediaIds: string[] = [];

      // Upload images if provided
      if (request.images && request.images.length > 0) {
        mediaIds = await this.uploadImages(request.images);
      }

      // Prepare tweet data
      const tweetData: any = {
        text: request.text
      };

      // Add media if available
      if (mediaIds.length > 0) {
        tweetData.media = {
          media_ids: mediaIds
        };
      }

      // Add reply settings if replying to a tweet
      if (request.replyTo) {
        tweetData.reply = {
          in_reply_to_tweet_id: request.replyTo
        };
      }

      // Add quote tweet if provided
      if (request.quoteTweet) {
        tweetData.quote_tweet_id = request.quoteTweet;
      }

      // Make the API call
      const response = await this.makeRequest('POST', '/tweets', tweetData);

      return {
        success: true,
        tweetId: response.data.id,
        moderationResult: { result: 'ok' } // This will be set by the calling route
      };

    } catch (error) {
      console.error('Twitter API error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown Twitter API error',
        moderationResult: { result: 'rejected' }
      };
    }
  }

  /**
   * Upload images to Twitter
   */
  private async uploadImages(images: any[]): Promise<string[]> {
    const mediaIds: string[] = [];

    for (const image of images) {
      try {
        const mediaId = await this.uploadImage(image);
        mediaIds.push(mediaId);
      } catch (error) {
        console.error('Failed to upload image:', error);
        throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return mediaIds;
  }

  /**
   * Upload a single image to Twitter
   */
  private async uploadImage(image: any): Promise<string> {
    // Get image data
    let imageData: Buffer;
    let mimeType: string;

    if (image.url) {
      // Download image from URL
      const response = await fetch(image.url);
      if (!response.ok) {
        throw new Error(`Failed to download image from URL: ${response.statusText}`);
      }
      imageData = Buffer.from(await response.arrayBuffer());
      mimeType = response.headers.get('content-type') || 'image/jpeg';
    } else if (image.base64) {
      // Decode base64 image
      const base64Data = image.base64.replace(/^data:image\/[a-z]+;base64,/, '');
      imageData = Buffer.from(base64Data, 'base64');
      mimeType = image.contentType || 'image/jpeg';
    } else {
      throw new Error('Image must have either url or base64 data');
    }

    // Check file size (Twitter limit: 5MB for images)
    if (imageData.length > 5 * 1024 * 1024) {
      throw new Error('Image file size exceeds 5MB limit');
    }

    // Upload media
    const uploadResponse = await this.makeUploadRequest('POST', '/media/upload.json', {
      media_category: 'tweet_image',
      media_data: imageData.toString('base64')
    });

    const mediaId = uploadResponse.media_id_string;

    // Wait for processing to complete
    await this.waitForMediaProcessing(mediaId);

    return mediaId;
  }

  /**
   * Wait for media processing to complete
   */
  private async waitForMediaProcessing(mediaId: string): Promise<void> {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const status = await this.getMediaStatus(mediaId);

      if (status.processingInfo?.state === 'succeeded') {
        return;
      } else if (status.processingInfo?.state === 'failed') {
        throw new Error(`Media processing failed for media ID: ${mediaId}`);
      }

      // Wait before checking again
      const waitTime = status.processingInfo?.checkAfterSecs || 5;
      await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
      attempts++;
    }

    throw new Error(`Media processing timeout for media ID: ${mediaId}`);
  }

  /**
   * Get media processing status
   */
  private async getMediaStatus(mediaId: string): Promise<TwitterMediaUpload> {
    const response = await this.makeUploadRequest('GET', `/media/upload.json?command=STATUS&media_id=${mediaId}`);
    return response;
  }

  /**
   * Make authenticated request to Twitter API
   */
  private async makeRequest(method: string, endpoint: string, data?: any): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;

    // Use OAuth 1.0a for all Twitter API v2 requests
    const headers = await this.getOAuthHeaders(method, url, data);

    const options: RequestInit = {
      method,
      headers
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Twitter API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Make authenticated request to Twitter Upload API
   */
  private async makeUploadRequest(method: string, endpoint: string, data?: any): Promise<any> {
    const url = `${this.uploadUrl}${endpoint}`;

    // For upload API, we need to use OAuth 1.0a
    const headers = await this.getOAuthHeaders(method, url, data);

    const options: RequestInit = {
      method,
      headers
    };

    if (data && method !== 'GET') {
      if (data.media_data) {
        // For media upload, send as form data
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
          formData.append(key, value as string);
        });
        options.body = formData;
      } else {
        options.body = JSON.stringify(data);
        headers['Content-Type'] = 'application/json';
      }
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Twitter Upload API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  }

    /**
   * Generate OAuth 1.0a headers for upload API
   */
  private async getOAuthHeaders(method: string, url: string, data?: any): Promise<Record<string, string>> {
    const token = {
      key: this.credentials.accessToken,
      secret: this.credentials.accessTokenSecret
    };

    const request_data = {
      url,
      method,
      data
    };

    const authHeader = this.oauth.toHeader(this.oauth.authorize(request_data, token));

    return {
      'Authorization': authHeader.Authorization,
      'Content-Type': 'application/x-www-form-urlencoded'
    };
  }

  /**
   * Validate Twitter credentials
   */
  async validateCredentials(): Promise<boolean> {
    try {
      // Use OAuth 1.0a for user context validation
      const url = `${this.baseUrl}/users/me`;
      const headers = await this.getOAuthHeaders('GET', url);

      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Twitter API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return true;
    } catch (error) {
      console.error('Invalid Twitter credentials:', error);
      return false;
    }
  }
}