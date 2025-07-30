import { test } from 'tap';
import Fastify from 'fastify';
import { xPostRoute } from '../x-post';
import { ModerationService } from '../../services/moderationService';
import { XApiService } from '../../services/xApiService';

test('x-post route', async (t) => {
    t.test('should handle X post request with text only', async (t) => {
    const fastify = Fastify();

    // Register required services
    fastify.decorate('moderationService', ModerationService.getInstance());
    fastify.decorate('xApiService', new XApiService({
      apiKey: 'test-api-key',
      apiSecret: 'test-api-secret',
      accessToken: 'test-access-token',
      accessTokenSecret: 'test-access-token-secret',
      bearerToken: 'test-bearer-token'
    }));
    await fastify.register(xPostRoute, { prefix: '/api/v1' });

    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/x-post',
      payload: {
        text: 'Hello Twitter!'
      }
    });

    t.equal(response.statusCode, 400);
    const result = JSON.parse(response.payload);
    t.ok(result.success === false, 'should have success false');
    t.ok(result.error, 'should have error message');
    t.ok(result.moderationResult, 'should have moderationResult');

    await fastify.close();
  });

    t.test('should handle X post request with images', async (t) => {
    const fastify = Fastify();

    // Register required services
    fastify.decorate('moderationService', ModerationService.getInstance());
    fastify.decorate('xApiService', new XApiService({
      apiKey: 'test-api-key',
      apiSecret: 'test-api-secret',
      accessToken: 'test-access-token',
      accessTokenSecret: 'test-access-token-secret',
      bearerToken: 'test-bearer-token'
    }));
    await fastify.register(xPostRoute, { prefix: '/api/v1' });

    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/x-post',
      payload: {
        text: 'Check out this image!',
        images: [
          {
            url: 'https://example.com/image.jpg'
          }
        ]
      }
    });

    t.equal(response.statusCode, 400);
    const result = JSON.parse(response.payload);
    t.ok(result.success === false, 'should have success false');
    t.ok(result.error, 'should have error message');
    t.ok(result.moderationResult, 'should have moderationResult');

    await fastify.close();
  });

    t.test('should handle X post request with videos', async (t) => {
    const fastify = Fastify();

    // Register required services
    fastify.decorate('moderationService', ModerationService.getInstance());
    fastify.decorate('xApiService', new XApiService({
      apiKey: 'test-api-key',
      apiSecret: 'test-api-secret',
      accessToken: 'test-access-token',
      accessTokenSecret: 'test-access-token-secret',
      bearerToken: 'test-bearer-token'
    }));
    await fastify.register(xPostRoute, { prefix: '/api/v1' });

    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/x-post',
      payload: {
        text: 'Check out this video!',
        videos: [
          {
            url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
          }
        ]
      }
    });

    t.equal(response.statusCode, 400);
    const result = JSON.parse(response.payload);
    t.ok(result.success === false, 'should have success false');
    t.ok(result.error, 'should have error message');
    t.ok(result.moderationResult, 'should have moderationResult');

    await fastify.close();
  });

  t.test('should handle missing text', async (t) => {
    const fastify = Fastify();

    // Register required services
    fastify.decorate('moderationService', ModerationService.getInstance());
    fastify.decorate('xApiService', new XApiService({
      apiKey: 'test-api-key',
      apiSecret: 'test-api-secret',
      accessToken: 'test-access-token',
      accessTokenSecret: 'test-access-token-secret',
      bearerToken: 'test-bearer-token'
    }));
    await fastify.register(xPostRoute, { prefix: '/api/v1' });

    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/x-post',
      payload: {}
    });

    t.equal(response.statusCode, 400);

    await fastify.close();
  });

  t.test('should handle invalid payload', async (t) => {
    const fastify = Fastify();

    // Register required services
    fastify.decorate('moderationService', ModerationService.getInstance());
    fastify.decorate('xApiService', new XApiService({
      apiKey: 'test-api-key',
      apiSecret: 'test-api-secret',
      accessToken: 'test-access-token',
      accessTokenSecret: 'test-access-token-secret',
      bearerToken: 'test-bearer-token'
    }));
    await fastify.register(xPostRoute, { prefix: '/api/v1' });

    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/x-post',
      payload: 'invalid json'
    });

    t.equal(response.statusCode, 415);

    await fastify.close();
  });
});