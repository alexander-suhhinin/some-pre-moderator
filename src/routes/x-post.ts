import { FastifyPluginAsync } from 'fastify';
import { XPostRequest, XPostResponse, ModerationResponse } from '../types';

const xPostSchema = {
  type: 'object',
  required: ['text'],
  properties: {
    text: {
      type: 'string',
      minLength: 1,
      maxLength: 280, // Twitter character limit
      description: 'Tweet text content',
    },
    images: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            format: 'uri',
            description: 'URL of the image',
          },
          base64: {
            type: 'string',
            description: 'Base64 encoded image data',
          },
          filename: {
            type: 'string',
            description: 'Original filename of the image',
          },
          contentType: {
            type: 'string',
            description: 'MIME type of the image (e.g., image/jpeg)',
          },
        },
        oneOf: [
          { required: ['url'] },
          { required: ['base64'] }
        ],
      },
      maxItems: 4, // Twitter allows max 4 images
      description: 'Array of images to be posted (max 4 images)',
    },
    replyTo: {
      type: 'string',
      description: 'Tweet ID to reply to',
    },
    quoteTweet: {
      type: 'string',
      description: 'Tweet ID to quote',
    },
  },
};

const xPostResponseSchema = {
  type: 'object',
  properties: {
    success: {
      type: 'boolean',
      description: 'Whether the post was successful',
    },
    tweetId: {
      type: 'string',
      description: 'ID of the posted tweet (if successful)',
    },
    moderationResult: {
      type: 'object',
      properties: {
        result: {
          type: 'string',
          enum: ['ok', 'rejected'],
        },
        reason: { type: 'string' },
        confidence: { type: 'number' },
        flags: { type: 'array', items: { type: 'string' } },
        imageResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              imageIndex: { type: 'number' },
              isSafe: { type: 'boolean' },
              reason: { type: 'string' },
              confidence: { type: 'number' },
              flags: { type: 'array', items: { type: 'string' } },
              detectedObjects: { type: 'array', items: { type: 'string' } },
              adultContent: { type: 'boolean' },
              violence: { type: 'boolean' },
              hate: { type: 'boolean' },
            },
          },
        },
      },
    },
    error: {
      type: 'string',
      description: 'Error message (if not successful)',
    },
  },
  required: ['success', 'moderationResult'],
};

export const xPostRoute: FastifyPluginAsync = async (fastify) => {

  fastify.post<{ Body: XPostRequest; Reply: XPostResponse }>(
    '/x-post',
    {
      schema: {
        body: xPostSchema,
        response: {
          200: xPostResponseSchema,
          400: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
              moderationResult: { type: 'object' },
            },
          },
          500: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
              moderationResult: { type: 'object' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { text, images, replyTo, quoteTweet } = request.body;

      try {
        fastify.log.info({
          message: 'Processing X post request',
          textLength: text.length,
          imageCount: images?.length || 0,
          ip: request.ip,
        });

        // Проверяем, что сервисы доступны
        if (!fastify.moderationService) {
          fastify.log.error('ModerationService is not available');
          return reply.status(500).send({
            success: false,
            error: 'Moderation service not available',
            moderationResult: {
              result: 'rejected' as const,
              reason: 'Moderation service not available',
            },
          });
        }

        if (!fastify.xApiService) {
          fastify.log.error('XApiService is not available');
          return reply.status(500).send({
            success: false,
            error: 'X API service not available',
            moderationResult: {
              result: 'rejected' as const,
              reason: 'X API service not available',
            },
          });
        }

        const moderationResult = await fastify.moderationService.moderateText(text, images);

        if (!moderationResult.isSafe) {
          fastify.log.info({
            message: 'Content rejected by moderation',
            reason: moderationResult.reason,
            flags: moderationResult.flags,
            ip: request.ip,
          });

          const moderationResponse: ModerationResponse = {
            result: 'rejected' as const,
            ...(moderationResult.reason && { reason: moderationResult.reason }),
            ...(moderationResult.confidence && { confidence: moderationResult.confidence }),
            ...(moderationResult.flags && { flags: moderationResult.flags }),
            ...(moderationResult.imageResults && { imageResults: moderationResult.imageResults }),
          };

          return reply.status(400).send({
            success: false,
            error: 'Content rejected by moderation',
            moderationResult: moderationResponse,
          });
        }

        const xApiResponse = await fastify.xApiService.postTweet({
          text,
          ...(images && { images }),
          ...(replyTo && { replyTo }),
          ...(quoteTweet && { quoteTweet })
        });

        if (!xApiResponse.success) {
          throw new Error(xApiResponse.error || 'Failed to post to X');
        }

        const moderationResponse: ModerationResponse = { result: 'ok' };
        if (moderationResult.confidence) {
          moderationResponse.confidence = moderationResult.confidence;
        }
        if (moderationResult.flags) {
          moderationResponse.flags = moderationResult.flags;
        }
        if (moderationResult.imageResults) {
          moderationResponse.imageResults = moderationResult.imageResults;
        }

        const response: XPostResponse = {
          success: true,
          ...(xApiResponse.tweetId && { tweetId: xApiResponse.tweetId }),
          moderationResult: moderationResponse,
        };

        fastify.log.info({
          message: 'X post completed successfully',
          tweetId: xApiResponse.tweetId,
          ip: request.ip,
        });

        return reply.send(response);
      } catch (error) {
        fastify.log.error({
          message: 'X post error',
          error: error instanceof Error ? error.message : 'Unknown error',
          ip: request.ip,
        });

        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to process X post request',
          moderationResult: {
            result: 'rejected' as const,
            reason: 'Failed to process X post request',
          },
        });
      }
    }
  );
};