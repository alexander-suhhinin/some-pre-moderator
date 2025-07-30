import { test } from 'tap';
import Fastify from 'fastify';
import { moderateRoute } from '../moderate';
import { ModerationService } from '../../services/moderationService';

test('moderate route', async (t) => {
  t.test('should handle text moderation request', async (t) => {
    const fastify = Fastify();

    // Register moderation service
    fastify.decorate('moderationService', ModerationService.getInstance());
    await fastify.register(moderateRoute, { prefix: '/api/v1' });

    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/moderate',
      payload: {
        text: 'Hello world'
      }
    });

    t.equal(response.statusCode, 200);
    const result = JSON.parse(response.payload);
    t.ok(result.result, 'should have result property');
    t.ok(typeof result.confidence === 'number', 'should have confidence property');
    t.ok(Array.isArray(result.flags), 'should have flags array');
    t.ok(Array.isArray(result.imageResults), 'should have imageResults array');
    t.ok(Array.isArray(result.videoResults), 'should have videoResults array');

    await fastify.close();
  });

  t.test('should handle text with images', async (t) => {
    const fastify = Fastify();

    // Register moderation service
    fastify.decorate('moderationService', ModerationService.getInstance());
    await fastify.register(moderateRoute, { prefix: '/api/v1' });

    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/moderate',
      payload: {
        text: 'Check this image',
        images: [
          {
            url: 'https://example.com/image.jpg'
          }
        ]
      }
    });

    t.equal(response.statusCode, 200);
    const result = JSON.parse(response.payload);
    t.ok(Array.isArray(result.imageResults), 'should have imageResults array');
    t.ok(typeof result.confidence === 'number', 'should have confidence property');

    await fastify.close();
  });

  t.test('should handle text with videos', async (t) => {
    const fastify = Fastify();

    // Register moderation service
    fastify.decorate('moderationService', ModerationService.getInstance());
    await fastify.register(moderateRoute, { prefix: '/api/v1' });

    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/moderate',
      payload: {
        text: 'Check this video',
        videos: [
          {
            url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
          }
        ]
      }
    });

    t.equal(response.statusCode, 200);
    const result = JSON.parse(response.payload);
    t.ok(Array.isArray(result.videoResults), 'should have videoResults array');
    t.ok(typeof result.confidence === 'number', 'should have confidence property');

    await fastify.close();
  });

      t.test('should handle missing text', async (t) => {
    const fastify = Fastify();

    // Register moderation service
    fastify.decorate('moderationService', ModerationService.getInstance());
    await fastify.register(moderateRoute, { prefix: '/api/v1' });

    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/moderate',
      payload: { text: '' }
    });

    t.equal(response.statusCode, 200);
    const result = JSON.parse(response.payload);
    t.ok(result.result, 'should have result property');
    t.ok(typeof result.confidence === 'number', 'should have confidence property');

    await fastify.close();
  });

  t.test('should handle invalid payload', async (t) => {
    const fastify = Fastify();

    // Register moderation service
    fastify.decorate('moderationService', ModerationService.getInstance());
    await fastify.register(moderateRoute, { prefix: '/api/v1' });

    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/moderate',
      payload: 'invalid json'
    });

    t.equal(response.statusCode, 415);

    await fastify.close();
  });
});