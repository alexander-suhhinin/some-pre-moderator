import { test } from 'tap';
import Fastify from 'fastify';
import { rateLimitPlugin } from '../rate-limit';

test('rate-limit plugin', async (t) => {
  t.test('should register rate limit plugin successfully', async (t) => {
    const fastify = Fastify();
    await fastify.register(rateLimitPlugin);
    fastify.get('/test', async () => ({ message: 'test' }));
    const response = await fastify.inject({ method: 'GET', url: '/test' });
    t.equal(response.statusCode, 200);
    await fastify.close();
  });

  t.test('should allow health endpoint to bypass rate limiting', async (t) => {
    const fastify = Fastify();
    await fastify.register(rateLimitPlugin);
    fastify.get('/health', async () => ({ status: 'ok' }));
    for (let i = 0; i < 15; i++) {
      const response = await fastify.inject({ method: 'GET', url: '/health' });
      t.equal(response.statusCode, 200, `Health request ${i} should be 200`);
    }
    await fastify.close();
  });

  t.test('should configure rate limit with environment variables', async (t) => {
    const originalMax = process.env.RATE_LIMIT_MAX;
    const originalTimeWindow = process.env.RATE_LIMIT_TIME_WINDOW;
    process.env.RATE_LIMIT_MAX = '5';
    process.env.RATE_LIMIT_TIME_WINDOW = '1000';
    const fastify = Fastify();
    await fastify.register(rateLimitPlugin);
    fastify.get('/test', async () => ({ message: 'test' }));

    // Just test that the plugin registers with custom settings
    const response = await fastify.inject({ method: 'GET', url: '/test' });
    t.equal(response.statusCode, 200, 'Should handle custom rate limit settings');

    if (originalMax) process.env.RATE_LIMIT_MAX = originalMax;
    if (originalTimeWindow) process.env.RATE_LIMIT_TIME_WINDOW = originalTimeWindow;
    await fastify.close();
  });
});