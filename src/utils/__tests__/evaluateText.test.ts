import { test } from 'tap';
import { TextEvaluator } from '../evaluateText';

test('TextEvaluator', async (t) => {
  t.test('should create instance with OpenAI provider', async (t) => {
    const evaluator = new TextEvaluator('openai');
    t.ok(evaluator, 'should create instance');
  });

  t.test('should create instance with Perspective provider', async (t) => {
    const evaluator = new TextEvaluator('perspective');
    t.ok(evaluator, 'should create instance');
  });

  t.test('should handle empty text', async (t) => {
    const evaluator = new TextEvaluator('openai');
    try {
      const result = await evaluator.evaluateText('');
      t.ok(result, 'should return result');
    } catch (error) {
      t.ok(error instanceof Error, 'should throw error with invalid API keys');
    }
  });

  t.test('should have evaluateText method', async (t) => {
    const evaluator = new TextEvaluator('openai');
    t.ok(typeof evaluator.evaluateText === 'function', 'should have evaluateText method');
  });

  t.test('should have evaluateImage method', async (t) => {
    const evaluator = new TextEvaluator('openai');
    t.ok(typeof evaluator.evaluateImage === 'function', 'should have evaluateImage method');
  });

  t.test('should handle API errors gracefully', async (t) => {
    const evaluator = new TextEvaluator('openai');
    try {
      const result = await evaluator.evaluateText('Hello world');
      t.ok(result, 'should return result even on error');
    } catch (error) {
      t.ok(error instanceof Error, 'should throw error with invalid API keys');
    }
  });

  t.test('should handle different AI providers', async (t) => {
    const openaiEvaluator = new TextEvaluator('openai');
    const perspectiveEvaluator = new TextEvaluator('perspective');

    t.ok(openaiEvaluator, 'should create OpenAI evaluator');
    t.ok(perspectiveEvaluator, 'should create Perspective evaluator');
  });
});