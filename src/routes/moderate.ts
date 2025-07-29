import { FastifyPluginAsync } from 'fastify';
import { ModerationRequest, ModerationResponse } from '../types';

const moderateSchema = {
  type: 'object',
  required: ['text'],
  properties: {
    text: {
      type: 'string',
      minLength: 1,
      maxLength: 10000,
      description: 'Text content to be moderated',
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
      maxItems: 4,
      description: 'Array of images to be moderated (max 4 images)',
    },
  },
};

const responseSchema = {
  type: 'object',
  properties: {
    result: {
      type: 'string',
      enum: ['ok', 'rejected'],
      description: 'Moderation result',
    },
    reason: {
      type: 'string',
      description: 'Reason for rejection (if applicable)',
    },
    confidence: {
      type: 'number',
      minimum: 0,
      maximum: 1,
      description: 'Confidence score of the moderation decision',
    },
    flags: {
      type: 'array',
      items: { type: 'string' },
      description: 'List of flagged categories',
    },
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
      description: 'Results of image moderation',
    },
  },
  required: ['result'],
};

export const moderateRoute: FastifyPluginAsync = async (fastify) => {

  fastify.post<{ Body: ModerationRequest; Reply: ModerationResponse }>(
    '/moderate',
    {
      schema: {
        body: moderateSchema,
        response: {
          200: responseSchema,
          400: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          500: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { text, images } = request.body;

      try {
        fastify.log.info({
          message: 'Processing moderation request',
          textLength: text.length,
          imageCount: images?.length || 0,
          ip: request.ip,
        });

        const result = await fastify.moderationService.moderateText(text, images);

        const response: ModerationResponse = {
          result: result.isSafe ? 'ok' : 'rejected',
          ...(result.reason && { reason: result.reason }),
          ...(result.confidence && { confidence: result.confidence }),
          ...(result.flags && { flags: result.flags }),
          ...(result.imageResults && { imageResults: result.imageResults }),
        };

        fastify.log.info({
          message: 'Moderation completed',
          result: response.result,
          reason: response.reason,
          confidence: response.confidence,
          imageResultsCount: response.imageResults?.length || 0,
          ip: request.ip,
        });

        return reply.send(response);
      } catch (error) {
        fastify.log.error({
          message: 'Moderation error',
          error: error instanceof Error ? error.message : 'Unknown error',
          ip: request.ip,
        });

        return reply.status(500).send({
          result: 'rejected' as const,
          reason: 'Failed to process moderation request',
        });
      }
    }
  );
};