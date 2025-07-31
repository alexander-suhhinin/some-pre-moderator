import { test } from 'tap';
import Fastify from 'fastify';
import { healthRoute } from '../health';

test('health route', async (t) => {
  t.test('should return health status', async (t) => {
    const fastify = Fastify();
    await fastify.register(healthRoute);

    const response = await fastify.inject({
      method: 'GET',
      url: '/health'
    });

    t.equal(response.statusCode, 200);
    const result = JSON.parse(response.payload);
    t.equal(result.status, 'ok');
    t.ok(result.timestamp, 'should have timestamp');

    await fastify.close();
  });

  t.test('should handle multiple requests', async (t) => {
    const fastify = Fastify();
    await fastify.register(healthRoute);

    // Make multiple requests to ensure stability
    for (let i = 0; i < 5; i++) {
      const response = await fastify.inject({
        method: 'GET',
        url: '/health'
      });

      t.equal(response.statusCode, 200);
      const result = JSON.parse(response.payload);
      t.equal(result.status, 'ok');
    }

    await fastify.close();
  });
});