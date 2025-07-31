import { test } from 'tap';
import Fastify from 'fastify';
import { moderateRoute } from '../moderate';
import { ModerationService } from '../../services/moderationService';
import { mockFetch } from '../../__mocks__/openai';

// Mock fetch globally
global.fetch = mockFetch as any;

test('moderate route', async (t) => {
  const fastify = Fastify();

  // Register moderation service
  fastify.decorate('moderationService', ModerationService.getInstance());

  // Register the route
  await fastify.register(moderateRoute);

  t.test('should handle text moderation request', async (t) => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/moderate',
      payload: {
        text: 'Hello world'
      }
    });

    t.equal(response.statusCode, 200, 'should be equal');
    const result = JSON.parse(response.payload);
    t.ok(result.result, 'should have result property');
    t.ok(typeof result.confidence === 'number', 'should have confidence property');
    t.ok(Array.isArray(result.flags), 'should have flags array');
    t.ok(Array.isArray(result.imageResults), 'should have imageResults array');
    t.ok(Array.isArray(result.videoResults), 'should have videoResults array');
    t.end();
  });


  t.test('should handle text with images (mocked)', async (t) => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/moderate',
      payload: {
        text: 'Check this image',
        images: [{ url: 'https://example.com/image.jpg', contentType: 'image/jpeg' }]
      }
    });

    t.equal(response.statusCode, 200, 'should be equal');
    const result = JSON.parse(response.payload);
    t.ok(Array.isArray(result.imageResults), 'should have imageResults array');
    t.ok(typeof result.confidence === 'number', 'should have confidence property');
    t.end();
  });

  t.test('should handle missing text', async (t) => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/moderate',
      payload: {
        text: ''
      }
    });

    t.equal(response.statusCode, 500, 'should be equal');
    const result = JSON.parse(response.payload);
    t.ok(result.result === 'rejected', 'should have rejected result');
    t.end();
  });

  t.test('should handle invalid payload', async (t) => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/moderate',
      payload: {}
    });

    t.equal(response.statusCode, 400, 'should be equal');
    t.end();
  });
});