import { FastifyPluginAsync } from 'fastify';
import { ModerationService } from '../services/moderationService';

declare module 'fastify' {
  interface FastifyInstance {
    moderationService: ModerationService;
  }
}

export const moderationPlugin: FastifyPluginAsync = async (fastify) => {
  // Регистрируем сервис модерации как часть Fastify instance
  fastify.decorate('moderationService', ModerationService.getInstance());

  fastify.log.info('Moderation service plugin registered');
};