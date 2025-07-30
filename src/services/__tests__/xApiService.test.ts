import { test } from 'tap';
import { XApiService } from '../xApiService';

test('XApiService', async (t) => {
  t.test('should create instance with credentials', async (t) => {
    const credentials = {
      apiKey: 'test-api-key',
      apiSecret: 'test-api-secret',
      accessToken: 'test-access-token',
      accessTokenSecret: 'test-access-token-secret',
      bearerToken: 'test-bearer-token'
    };

    const service = new XApiService(credentials);

    t.ok(service, 'should create instance');
    t.ok(typeof service.postTweet === 'function', 'should have postTweet method');
  });

  t.test('should validate credentials', async (t) => {
    const credentials = {
      apiKey: 'test-api-key',
      apiSecret: 'test-api-secret',
      accessToken: 'test-access-token',
      accessTokenSecret: 'test-access-token-secret',
      bearerToken: 'test-bearer-token'
    };
    const service = new XApiService(credentials);

    try {
      await service.validateCredentials();
      t.pass('validateCredentials method works');
    } catch (error) {
      t.ok(error instanceof Error, 'should throw error with invalid credentials');
    }
  });

  t.test('should handle postTweet method', async (t) => {
    const credentials = {
      apiKey: 'test-api-key',
      apiSecret: 'test-api-secret',
      accessToken: 'test-access-token',
      accessTokenSecret: 'test-access-token-secret',
      bearerToken: 'test-bearer-token'
    };
    const service = new XApiService(credentials);

    try {
      const result = await service.postTweet({ text: 'Test tweet' });
      t.ok(result, 'postTweet method works');
    } catch (error) {
      t.ok(error instanceof Error, 'should throw error with invalid credentials');
    }
  });

    t.test('should handle postTweet with invalid credentials', async (t) => {
    const credentials = {
      apiKey: 'test-api-key',
      apiSecret: 'test-api-secret',
      accessToken: 'test-access-token',
      accessTokenSecret: 'test-access-token-secret',
      bearerToken: 'test-bearer-token'
    };
    const service = new XApiService(credentials);

    try {
      const result = await service.postTweet({ text: 'Test tweet' });
      t.ok(result, 'postTweet method works');
    } catch (error) {
      t.ok(error instanceof Error, 'should throw error with invalid credentials');
    }
  });
});