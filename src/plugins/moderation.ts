import { FastifyPluginAsync } from 'fastify';
import { ModerationService } from '../services/moderationService';

export const moderationPlugin: FastifyPluginAsync = async (fastify) => {
  // Register moderation service if not already registered
  if (!fastify.moderationService) {
    fastify.decorate('moderationService', ModerationService.getInstance());
  }

  // Check service availability
  const hasModerationService = !!fastify.moderationService;
  const hasModerateText = typeof fastify.moderationService?.moderateText === 'function';

  fastify.log.info({
    message: 'Moderation plugin status',
    hasModerationService,
    hasModerateText,
  });

  if (!hasModerationService) {
    fastify.log.warn('ModerationService is not available');
  }
};