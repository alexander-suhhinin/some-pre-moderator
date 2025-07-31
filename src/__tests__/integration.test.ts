import { test } from 'tap';
import Fastify from 'fastify';
import { rateLimitPlugin } from '../plugins/rate-limit';
import { moderationPlugin } from '../plugins/moderation';
import { xApiPlugin } from '../plugins/xApi';
import { moderateRoute } from '../routes/moderate';
import { xPostRoute } from '../routes/x-post';
import { healthRoute } from '../routes/health';
import { ModerationService } from '../services/moderationService';
import { XApiService } from '../services/xApiService';

test('Full API Integration', async (t) => {




  t.test('should handle error scenarios', async (t) => {
    const fastify = Fastify();

    // Register all plugins and services
    fastify.decorate('moderationService', ModerationService.getInstance());
    fastify.decorate('xApiService', new XApiService({
      apiKey: 'test-api-key',
      apiSecret: 'test-api-secret',
      accessToken: 'test-access-token',
      accessTokenSecret: 'test-access-token-secret',
      bearerToken: 'test-bearer-token'
    }));
    await fastify.register(rateLimitPlugin);
    await fastify.register(moderationPlugin);
    await fastify.register(xApiPlugin);

    // Register all routes
    await fastify.register(moderateRoute, { prefix: '/api/v1' });
    await fastify.register(xPostRoute, { prefix: '/api/v1' });
    await fastify.register(healthRoute);

    // Test invalid JSON
    const invalidResponse = await fastify.inject({
      method: 'POST',
      url: '/api/v1/moderate',
      payload: 'invalid json'
    });
    t.equal(invalidResponse.statusCode, 415);

    // Test missing required fields
    const missingFieldsResponse = await fastify.inject({
      method: 'POST',
      url: '/api/v1/x-post',
      payload: {}
    });
    t.equal(missingFieldsResponse.statusCode, 400);

    await fastify.close();
  });
});