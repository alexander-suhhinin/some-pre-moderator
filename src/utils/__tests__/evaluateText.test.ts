import { test } from 'tap';
import { TextEvaluator } from '../evaluateText';
import { mockFetch } from '../../__mocks__/openai';

// Mock fetch globally
global.fetch = mockFetch as any;

test('TextEvaluator', async (t) => {
  t.test('should create instance with OpenAI provider', async (t) => {
    const evaluator = new TextEvaluator('test-openai-key');
    t.ok(evaluator, 'should create OpenAI evaluator');
    t.end();
  });

  t.test('should handle empty text', async (t) => {
    const evaluator = new TextEvaluator('test-openai-key');
    try {
      await evaluator.evaluateText('');
      t.fail('should throw error');
    } catch (error) {
      t.ok(error instanceof Error, 'should throw error');
    }
    t.end();
  });

  t.test('should handle text evaluation error', async (t) => {
    const evaluator = new TextEvaluator('test-openai-key');
    try {
      await evaluator.evaluateText('test text');
      t.fail('should throw error');
    } catch (error) {
      t.ok(error instanceof Error, 'should throw error');
    }
    t.end();
  });

  t.test('should handle image evaluation error', async (t) => {
    const evaluator = new TextEvaluator('test-openai-key');
    try {
      await evaluator.evaluateImage({ url: 'invalid-url' }, 0);
      t.pass('should handle image evaluation error gracefully');
    } catch (error) {
      t.fail('should not throw error for image evaluation');
    }
    t.end();
  });

  t.test('should handle unsupported AI provider', async (t) => {
    try {
      new TextEvaluator('test-key', 'unsupported' as any);
      t.fail('should throw error for unsupported provider');
    } catch (error) {
      t.ok(error instanceof Error, 'should throw error');
    }
    t.end();
  });
});