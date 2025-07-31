import { test } from 'tap';
import { VideoAnalyzer } from '../videoAnalyzer'

test('VideoAnalyzer', async (t) => {
  t.test('should create instance', async (t) => {
    const analyzer = new VideoAnalyzer();
    t.ok(analyzer, 'should create instance');
    t.end();
  });

  t.test('should handle missing video data', async (t) => {
    const analyzer = new VideoAnalyzer();
    try {
      const result = await analyzer.analyzeVideo({}, 0);
      t.ok(result, 'should return result even with missing video data');
      t.ok(result.isSafe, 'should default to safe');
      t.equal(result.reason, 'Video analysis failed, defaulting to safe');
    } catch (error) {
      t.fail('should not throw error for missing video data');
    }
    t.end();
  });

  t.test('should handle base64 video', async (t) => {
    const analyzer = new VideoAnalyzer();
    try {
      const result = await analyzer.analyzeVideo({ base64: 'invalid-base64' }, 0);
      t.ok(result, 'should return result even with invalid base64');
      t.ok(result.isSafe, 'should default to safe');
    } catch (error) {
      t.fail('should not throw error for invalid base64');
    }
    t.end();
  });

  t.test('should handle image evaluation error', async (t) => {
    const analyzer = new VideoAnalyzer();
    try {
      await analyzer.evaluateImage({ url: 'invalid-url' }, 0);
      t.pass('should handle image evaluation error gracefully');
    } catch (error) {
      t.fail('should not throw error for image evaluation');
    }
    t.end();
  });
});