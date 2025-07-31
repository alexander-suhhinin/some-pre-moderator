import { test } from 'tap';
import Fastify from 'fastify';
import { moderationPlugin } from '../moderation';
import { rateLimitPlugin } from '../rate-limit';
import { xApiPlugin } from '../xApi';

test('basic plugin functionality', async (t) => {
  t.test('should register moderation plugin without errors', async (t) => {
    const fastify = Fastify();
    try {
      await fastify.register(moderationPlugin);
      t.pass('moderationPlugin registered successfully');
    } catch (error) {
      t.fail(`moderationPlugin registration failed: ${error}`);
    }
    await fastify.close();
  });

  t.test('should register rate limit plugin without errors', async (t) => {
    const fastify = Fastify();
    try {
      await fastify.register(rateLimitPlugin);
      t.pass('rateLimitPlugin registered successfully');
    } catch (error) {
      t.fail(`rateLimitPlugin registration failed: ${error}`);
    }
    await fastify.close();
  });

  t.test('should register xApi plugin without errors', async (t) => {
    const fastify = Fastify();
    try {
      await fastify.register(xApiPlugin);
      t.pass('xApiPlugin registered successfully');
    } catch (error) {
      t.fail(`xApiPlugin registration failed: ${error}`);
    }
    await fastify.close();
  });

  t.test('should register all plugins together without errors', async (t) => {
    const fastify = Fastify();
    try {
      await fastify.register(moderationPlugin);
      await fastify.register(rateLimitPlugin);
      await fastify.register(xApiPlugin);
      t.pass('All plugins registered successfully');
    } catch (error) {
      t.fail(`Plugin registration failed: ${error}`);
    }
    await fastify.close();
  });

  t.test('should handle rate limiting configuration', async (t) => {
    const fastify = Fastify();
    await fastify.register(rateLimitPlugin);
    fastify.get('/test', async () => ({ message: 'test' }));
    const response = await fastify.inject({ method: 'GET', url: '/test' });
    t.equal(response.statusCode, 200);
    await fastify.close();
  });

  t.test('should handle environment variables for rate limiting', async (t) => {
    const originalMax = process.env.RATE_LIMIT_MAX;
    const originalTimeWindow = process.env.RATE_LIMIT_TIME_WINDOW;
    process.env.RATE_LIMIT_MAX = '3';
    process.env.RATE_LIMIT_TIME_WINDOW = '1000';
    const fastify = Fastify();
    try {
      await fastify.register(rateLimitPlugin);
      t.pass('rateLimitPlugin registered with custom environment variables');
    } catch (error) {
      t.fail(`rateLimitPlugin registration failed: ${error}`);
    }
    if (originalMax) process.env.RATE_LIMIT_MAX = originalMax;
    if (originalTimeWindow) process.env.RATE_LIMIT_TIME_WINDOW = originalTimeWindow;
    await fastify.close();
  });
});