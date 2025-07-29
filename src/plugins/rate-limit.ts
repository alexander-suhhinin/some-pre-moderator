import { FastifyPluginAsync } from 'fastify';
import rateLimit from '@fastify/rate-limit';

export const rateLimitPlugin: FastifyPluginAsync = async (fastify) => {
  const maxRequests = parseInt(process.env.RATE_LIMIT_MAX || '10');
  const timeWindow = parseInt(process.env.RATE_LIMIT_TIME_WINDOW || '60000'); // 1 minute in milliseconds

  await fastify.register(rateLimit, {
    max: maxRequests,
    timeWindow: timeWindow,
    allowList: (request) => {
      // Allow health check endpoints
      return request.url === '/health';
    },
    keyGenerator: (request) => {
      // Use IP address for rate limiting
      return request.ip;
    },
    errorResponseBuilder: (request, context) => {
      return {
        code: 429,
        error: 'Too Many Requests',
        message: `Rate limit exceeded, retry in ${Math.ceil(context.ttl / 1000)} seconds`,
        retryAfter: Math.ceil(context.ttl / 1000),
      };
    },
    onExceeded: (request, context) => {
      fastify.log.warn({
        message: 'Rate limit exceeded',
        ip: request.ip,
        url: request.url,
        method: request.method,
      });
    },
  });
};