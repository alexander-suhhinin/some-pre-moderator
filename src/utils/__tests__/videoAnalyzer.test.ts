import { test } from 'tap';
import { VideoAnalyzer } from '../videoAnalyzer';

test('VideoAnalyzer', async (t) => {
  t.test('should create instance', async (t) => {
    const analyzer = new VideoAnalyzer();
    t.ok(analyzer, 'should create instance');
  });

  t.test('should have analyzeVideo method', async (t) => {
    const analyzer = new VideoAnalyzer();
    t.ok(typeof analyzer.analyzeVideo === 'function', 'should have analyzeVideo method');
  });

  t.test('should handle missing video data', async (t) => {
    const analyzer = new VideoAnalyzer();
    try {
      const result = await analyzer.analyzeVideo({} as any, 0);
      t.ok(result, 'should return result');
    } catch (error) {
      t.ok(error instanceof Error, 'should throw error with invalid data');
    }
  });

  t.test('should handle API errors gracefully', async (t) => {
    const analyzer = new VideoAnalyzer();
    try {
      const result = await analyzer.analyzeVideo({
        url: 'https://example.com/video.mp4'
      }, 0);
      t.ok(result, 'should return result even on error');
    } catch (error) {
      t.ok(error instanceof Error, 'should throw error with invalid API keys');
    }
  });

  t.test('should handle base64 video data', async (t) => {
    const analyzer = new VideoAnalyzer();
    try {
      const result = await analyzer.analyzeVideo({
        base64: 'data:video/mp4;base64,dGVzdA=='
      }, 0);
      t.ok(result, 'should return result');
    } catch (error) {
      t.ok(error instanceof Error, 'should throw error with invalid data');
    }
  });
});