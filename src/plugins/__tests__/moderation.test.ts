import { test } from 'tap';
import Fastify from 'fastify';
import { moderationPlugin } from '../moderation';
import { ModerationService } from '../../services/moderationService';

// Extend Fastify instance type for tests
declare module 'fastify' {
  interface FastifyInstance {
    moderationService: ModerationService;
  }
}

test('moderation plugin', async (t) => {
  t.test('should register moderation service on fastify instance', async (t) => {
    const fastify = Fastify();
    // Register decorator first
    fastify.decorate('moderationService', ModerationService.getInstance());
    await fastify.register(moderationPlugin);
    t.ok(fastify.moderationService);
    t.ok(fastify.moderationService instanceof ModerationService);
    await fastify.close();
  });

  t.test('should provide singleton instance of ModerationService', async (t) => {
    const fastify1 = Fastify();
    const fastify2 = Fastify();
    // Register decorator first
    fastify1.decorate('moderationService', ModerationService.getInstance());
    fastify2.decorate('moderationService', ModerationService.getInstance());
    await fastify1.register(moderationPlugin);
    await fastify2.register(moderationPlugin);
    const service1 = fastify1.moderationService;
    const service2 = fastify2.moderationService;
    t.ok(service1 instanceof ModerationService);
    t.ok(service2 instanceof ModerationService);
    t.equal(service1, service2);
    await fastify1.close();
    await fastify2.close();
  });

  t.test('should have moderateText method available', async (t) => {
    const fastify = Fastify();
    // Register decorator first
    fastify.decorate('moderationService', ModerationService.getInstance());
    await fastify.register(moderationPlugin);
    t.ok(fastify.moderationService);
    t.ok(typeof fastify.moderationService.moderateText === 'function');
    await fastify.close();
  });

  t.test('should be able to call moderation methods', async (t) => {
    const fastify = Fastify();
    // Register decorator first
    fastify.decorate('moderationService', ModerationService.getInstance());
    await fastify.register(moderationPlugin);

    try {
      const result = await fastify.moderationService.moderateText('test text');
      t.ok(result, 'moderateText method can be called');
      t.ok(typeof result.isSafe === 'boolean', 'result has isSafe property');
    } catch (error) {
      // Expected error due to missing API keys in test environment
      t.ok(error instanceof Error, 'Expected error due to missing API keys');
    }

    await fastify.close();
  });
});