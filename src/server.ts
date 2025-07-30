import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import dotenv from 'dotenv';
import { rateLimitPlugin } from './plugins/rate-limit';
import { moderationPlugin } from './plugins/moderation';
import { xApiPlugin } from './plugins/xApi';
import { moderateRoute } from './routes/moderate';
import { xPostRoute } from './routes/x-post';
import { healthRoute } from './routes/health';
import { ModerationService } from './services/moderationService';

// Load environment variables
dotenv.config();

// Extend Fastify instance type
declare module 'fastify' {
  interface FastifyInstance {
    moderationService: ModerationService;
  }
}

const server = Fastify({
  logger: process.env.NODE_ENV === 'development'
    ? {
        level: process.env.LOG_LEVEL || 'info',
        transport: { target: 'pino-pretty' },
      }
    : {
        level: process.env.LOG_LEVEL || 'info',
      },
  trustProxy: true, // Trust proxy for proper IP detection
});

// Register moderation service as decorator at server level
server.decorate('moderationService', ModerationService.getInstance());

// Register security plugins
async function registerPlugins() {
  await server.register(helmet, {
    contentSecurityPolicy: false, // Disable CSP for API
  });

  await server.register(cors, {
    origin: true, // Allow all origins in development
    credentials: true,
  });

  await server.register(rateLimitPlugin);
  await server.register(moderationPlugin);
  await server.register(xApiPlugin);
}

// Register routes
async function registerRoutes() {
  await server.register(moderateRoute, { prefix: '/api/v1' });
  await server.register(xPostRoute, { prefix: '/api/v1' });
  await server.register(healthRoute);
}

// Error handling
server.setErrorHandler((error, request, reply) => {
  server.log.error({
    message: 'Unhandled error',
    error: error.message,
    stack: error.stack,
    url: request.url,
    method: request.method,
    ip: request.ip,
  });

  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  reply.status(error.statusCode || 500).send({
    error: error.name || 'Internal Server Error',
    message: isDevelopment ? error.message : 'An unexpected error occurred',
    ...(isDevelopment && { stack: error.stack }),
  });
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  server.log.info(`Received ${signal}. Starting graceful shutdown...`);

  try {
    await server.close();
    server.log.info('Server closed successfully');
    process.exit(0);
  } catch (error) {
    server.log.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
async function start() {
  try {
    await registerPlugins();
    await registerRoutes();

    const port = parseInt(process.env.PORT || '3000');
    const host = process.env.HOST || '0.0.0.0';

    await server.listen({ port, host });

    server.log.info({
      message: 'Content Moderation API started successfully',
      port,
      host,
      environment: process.env.NODE_ENV || 'development',
      aiProvider: process.env.AI_PROVIDER || 'openai',
    });
  } catch (error) {
    server.log.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Only start if this file is run directly
if (require.main === module) {
  start();
}

export default server;