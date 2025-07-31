import { test } from 'tap';
import Fastify from 'fastify';
import { xApiPlugin } from '../xApi';
import { XApiService } from '../../services/xApiService';

// Extend Fastify instance type for tests
declare module 'fastify' {
  interface FastifyInstance {
    xApiService: XApiService;
  }
}

test('xApi plugin', async (t) => {
  t.test('should register plugin without errors when credentials are provided', async (t) => {
    const originalCredentials = {
      TWITTER_BEARER_TOKEN: process.env.TWITTER_BEARER_TOKEN,
      TWITTER_API_KEY: process.env.TWITTER_API_KEY,
      TWITTER_API_SECRET: process.env.TWITTER_API_SECRET,
      TWITTER_ACCESS_TOKEN: process.env.TWITTER_ACCESS_TOKEN,
      TWITTER_ACCESS_TOKEN_SECRET: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    };

    // Set test credentials
    process.env.TWITTER_BEARER_TOKEN = 'test_bearer_token';
    process.env.TWITTER_API_KEY = 'test_api_key';
    process.env.TWITTER_API_SECRET = 'test_api_secret';
    process.env.TWITTER_ACCESS_TOKEN = 'test_access_token';
    process.env.TWITTER_ACCESS_TOKEN_SECRET = 'test_access_token_secret';

    const fastify = Fastify();
    try {
      await fastify.register(xApiPlugin);
      t.pass('xApiPlugin registered successfully with credentials');
    } catch (error) {
      t.fail(`xApiPlugin registration failed: ${error}`);
    }

    // Restore original credentials
    Object.entries(originalCredentials).forEach(([key, value]) => {
      if (value) {
        process.env[key] = value;
      } else {
        delete process.env[key];
      }
    });

    await fastify.close();
  });

  t.test('should register plugin without errors when credentials are missing', async (t) => {
    const originalCredentials = {
      TWITTER_BEARER_TOKEN: process.env.TWITTER_BEARER_TOKEN,
      TWITTER_API_KEY: process.env.TWITTER_API_KEY,
      TWITTER_API_SECRET: process.env.TWITTER_API_SECRET,
      TWITTER_ACCESS_TOKEN: process.env.TWITTER_ACCESS_TOKEN,
      TWITTER_ACCESS_TOKEN_SECRET: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    };

    // Remove all credentials
    delete process.env.TWITTER_BEARER_TOKEN;
    delete process.env.TWITTER_API_KEY;
    delete process.env.TWITTER_API_SECRET;
    delete process.env.TWITTER_ACCESS_TOKEN;
    delete process.env.TWITTER_ACCESS_TOKEN_SECRET;

    const fastify = Fastify();
    try {
      await fastify.register(xApiPlugin);
      t.pass('xApiPlugin registered successfully without credentials');
    } catch (error) {
      t.fail(`xApiPlugin registration failed: ${error}`);
    }

    // Restore original credentials
    Object.entries(originalCredentials).forEach(([key, value]) => {
      if (value) {
        process.env[key] = value;
      } else {
        delete process.env[key];
      }
    });

    await fastify.close();
  });

  t.test('should register plugin without errors when some credentials are missing', async (t) => {
    const originalCredentials = {
      TWITTER_BEARER_TOKEN: process.env.TWITTER_BEARER_TOKEN,
      TWITTER_API_KEY: process.env.TWITTER_API_KEY,
      TWITTER_API_SECRET: process.env.TWITTER_API_SECRET,
      TWITTER_ACCESS_TOKEN: process.env.TWITTER_ACCESS_TOKEN,
      TWITTER_ACCESS_TOKEN_SECRET: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    };

    // Set only some credentials
    process.env.TWITTER_BEARER_TOKEN = 'test_bearer_token';
    process.env.TWITTER_API_KEY = 'test_api_key';
    delete process.env.TWITTER_API_SECRET;
    delete process.env.TWITTER_ACCESS_TOKEN;
    delete process.env.TWITTER_ACCESS_TOKEN_SECRET;

    const fastify = Fastify();
    try {
      await fastify.register(xApiPlugin);
      t.pass('xApiPlugin registered successfully with partial credentials');
    } catch (error) {
      t.fail(`xApiPlugin registration failed: ${error}`);
    }

    // Restore original credentials
    Object.entries(originalCredentials).forEach(([key, value]) => {
      if (value) {
        process.env[key] = value;
      } else {
        delete process.env[key];
      }
    });

    await fastify.close();
  });
});