import { FastifyPluginAsync } from 'fastify';
import { ModerationRequest, ModerationResponse, VideoModerationRequest, VideoModerationResponse } from '../types';

const moderateSchema = {
  type: 'object',
  properties: {
    text: { type: 'string' },
    images: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          url: { type: 'string' },
          base64: { type: 'string' },
          contentType: { type: 'string' }
        }
      }
    },
    videos: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          url: { type: 'string' },
          base64: { type: 'string' },
          contentType: { type: 'string' },
          duration: { type: 'number' },
          frameRate: { type: 'number' },
          resolution: {
            type: 'object',
            properties: {
              width: { type: 'number' },
              height: { type: 'number' }
            }
          },
          size: { type: 'number' }
        }
      }
    }
  },
  required: ['text']
};

const responseSchema = {
  type: 'object',
  properties: {
    result: { type: 'string', enum: ['ok', 'rejected'] },
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
          flags: { type: 'array', items: { type: 'string' } }
        }
      }
    },
    videoResults: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          videoIndex: { type: 'number' },
          isSafe: { type: 'boolean' },
          reason: { type: 'string' },
          confidence: { type: 'number' },
          flags: { type: 'array', items: { type: 'string' } },
          frameResults: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                imageIndex: { type: 'number' },
                isSafe: { type: 'boolean' },
                reason: { type: 'string' },
                confidence: { type: 'number' },
                flags: { type: 'array', items: { type: 'string' } }
              }
            }
          },
          audioTranscription: { type: 'string' },
          metadata: {
            type: 'object',
            properties: {
              duration: { type: 'number' },
              frameCount: { type: 'number' },
              resolution: { type: 'string' },
              size: { type: 'number' }
            }
          }
        }
      }
    },
    metadata: {
      type: 'object',
      properties: {
        totalFrames: { type: 'number' },
        totalDuration: { type: 'number' },
        totalSize: { type: 'number' }
      }
    }
  }
};

export const moderateRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post<{ Body: VideoModerationRequest; Reply: VideoModerationResponse }>(
    '/moderate',
    {
      schema: {
        body: moderateSchema,
        response: {
          200: responseSchema,
          500: responseSchema
        }
      },
    },
    async (request, reply) => {
      const { text, images, videos } = request.body;

      try {
        fastify.log.info({
          message: 'Processing moderation request',
          textLength: text?.length || 0,
          imageCount: images?.length || 0,
          videoCount: videos?.length || 0,
          ip: request.ip,
        });

        // Проверяем, что сервис модерации доступен
        if (!fastify.moderationService) {
          fastify.log.error('ModerationService is not available');
          return reply.status(500).send({
            result: 'rejected' as const,
            reason: 'Moderation service not available',
            confidence: 0,
            flags: ['service_unavailable'],
            metadata: {
              totalFrames: 0,
              totalDuration: 0,
              totalSize: 0
            }
          });
        }

        const result = await fastify.moderationService.moderateText(text || '', images, videos);

        const response: VideoModerationResponse = {
          result: result.isSafe ? 'ok' : 'rejected',
          reason: result.reason || 'No reason provided',
          confidence: result.confidence || 0.5,
          flags: result.flags || [],
          imageResults: result.imageResults || [],
          videoResults: result.videoResults || [],
          metadata: {
            totalFrames: (result.imageResults?.length || 0) + (result.videoResults?.reduce((sum: number, v: any) => sum + v.metadata.frameCount, 0) || 0),
            totalDuration: result.videoResults?.reduce((sum: number, v: any) => sum + v.metadata.duration, 0) || 0,
            totalSize: result.videoResults?.reduce((sum: number, v: any) => sum + v.metadata.size, 0) || 0
          }
        };

        fastify.log.info({
          message: 'Moderation completed',
          result: response.result,
          confidence: response.confidence,
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
          reason: 'Internal server error during moderation',
          confidence: 0,
          flags: ['internal_error'],
          metadata: {
            totalFrames: 0,
            totalDuration: 0,
            totalSize: 0
          }
        });
      }
    }
  );
};