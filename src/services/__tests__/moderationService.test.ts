import { test } from 'tap';
import { ModerationService } from '../moderationService';
import { mockFetch } from '../../__mocks__/openai';

// Mock fetch globally
global.fetch = mockFetch as any;

test('ModerationService', async (t) => {
  t.test('should be a singleton', async (t) => {
    const instance1 = ModerationService.getInstance();
    const instance2 = ModerationService.getInstance();
    t.equal(instance1, instance2, 'should return same instance');
    t.end();
  });

  t.test('should have moderateText method', async (t) => {
    const service = ModerationService.getInstance();
    t.ok(typeof service.moderateText === 'function', 'should have moderateText method');
    t.end();
  });

  t.test('should moderate text successfully', async (t) => {
    const service = ModerationService.getInstance();
    const result = await service.moderateText('Hello world');
    t.ok(result, 'should return result');
    t.ok(typeof result.isSafe === 'boolean', 'should have isSafe property');
    t.ok(typeof result.confidence === 'number', 'should have confidence property');
    t.ok(Array.isArray(result.flags), 'should have flags array');
    t.end();
  });

  t.test('should handle empty text', async (t) => {
    const service = ModerationService.getInstance();
    try {
      await service.moderateText('');
      t.fail('should throw error for empty text');
    } catch (error) {
      t.ok(error instanceof Error, 'should throw error');
    }
    t.end();
  });

  t.test('should handle text with images', async (t) => {
    const service = ModerationService.getInstance();
    const result = await service.moderateText('Check this image', [
      { url: 'https://example.com/image.jpg', contentType: 'image/jpeg' }
    ]);
    t.ok(result, 'should return result');
    t.ok(typeof result.isSafe === 'boolean', 'should have isSafe property');
    t.ok(typeof result.confidence === 'number', 'should have confidence property');
    t.ok(Array.isArray(result.flags), 'should have flags array');
    t.end();
  });
});