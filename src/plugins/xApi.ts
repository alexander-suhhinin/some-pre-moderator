import { FastifyPluginAsync } from 'fastify';
import { XApiService, TwitterCredentials } from '../services/xApiService';

// Extend Fastify instance to include X API service
declare module 'fastify' {
  interface FastifyInstance {
    xApiService: XApiService;
  }
}

export const xApiPlugin: FastifyPluginAsync = async (fastify) => {
  // Get Twitter credentials from environment variables
  const credentials: TwitterCredentials = {
    bearerToken: process.env.TWITTER_BEARER_TOKEN || '',
    apiKey: process.env.TWITTER_API_KEY || '',
    apiSecret: process.env.TWITTER_API_SECRET || '',
    accessToken: process.env.TWITTER_ACCESS_TOKEN || '',
    accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET || ''
  };

  // Validate that all required credentials are provided
  const requiredFields = ['bearerToken', 'apiKey', 'apiSecret', 'accessToken', 'accessTokenSecret'];
  const missingFields = requiredFields.filter(field => !credentials[field as keyof TwitterCredentials]);

  if (missingFields.length > 0) {
    fastify.log.warn({
      message: 'Twitter API credentials are missing',
      missingFields,
      note: 'X API functionality will be disabled. Set environment variables to enable.'
    });

    // Create a mock service for development
    const mockService = {
      async postTweet() {
        throw new Error('Twitter API credentials not configured');
      },
      async validateCredentials() {
        return false;
      }
    };

    fastify.decorate('xApiService', mockService as unknown as XApiService);
  } else {
    // Create real X API service
    const xApiService = new XApiService(credentials);

    // Validate credentials on startup
    try {
      const isValid = await xApiService.validateCredentials();
      if (isValid) {
        fastify.log.info('Twitter API credentials validated successfully');
      } else {
        fastify.log.warn('Twitter API credentials validation failed');
      }
    } catch (error) {
      fastify.log.error('Error validating Twitter API credentials:', error);
    }

    fastify.decorate('xApiService', xApiService);
  }

  fastify.log.info('X API service plugin registered');
};