import { test } from 'tap';
import Fastify from 'fastify';
import { moderationPlugin } from '../moderation';
import { rateLimitPlugin } from '../rate-limit';
import { xApiPlugin } from '../xApi';



test('plugin integration', async (t) => {
  t.test('should register all plugins successfully', async (t) => {
    const fastify = Fastify();
    await fastify.register(moderationPlugin);
    await fastify.register(rateLimitPlugin);
    await fastify.register(xApiPlugin);
    fastify.get('/test', async () => ({ message: 'test' }));
    fastify.get('/health', async () => ({ status: 'ok' }));
    const testResponse = await fastify.inject({ method: 'GET', url: '/test' });
    const healthResponse = await fastify.inject({ method: 'GET', url: '/health' });
    t.equal(testResponse.statusCode, 200);
    t.equal(healthResponse.statusCode, 200);
    await fastify.close();
  });

  t.test('should have moderation service available', async (t) => {
    const fastify = Fastify();
    // Register moderation service first (like in server.ts)
    const { ModerationService } = await import('../../services/moderationService');
    fastify.decorate('moderationService', ModerationService.getInstance());
    await fastify.register(moderationPlugin);
    await fastify.register(rateLimitPlugin);
    await fastify.register(xApiPlugin);
    t.ok(fastify.moderationService, 'moderationService should be available');
    await fastify.close();
  });

  t.test('should allow health endpoint to bypass rate limiting', async (t) => {
    const fastify = Fastify();
    await fastify.register(rateLimitPlugin);
    fastify.get('/health', async () => ({ status: 'ok' }));
    for (let i = 0; i < 20; i++) {
      const response = await fastify.inject({ method: 'GET', url: '/health' });
      t.equal(response.statusCode, 200, `Health request ${i} should be 200`);
    }
    await fastify.close();
  });
});