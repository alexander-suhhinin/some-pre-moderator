// Test environment setup
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.OPENAI_API_URL = 'https://api.openai.com/v1';
process.env.OPENAI_VISION_MODEL = 'gpt-4o';
process.env.TWITTER_BEARER_TOKEN = 'test-bearer-token';
process.env.TWITTER_API_KEY = 'test-api-key';
process.env.TWITTER_API_SECRET = 'test-api-secret';
process.env.TWITTER_ACCESS_TOKEN = 'test-access-token';
process.env.TWITTER_ACCESS_TOKEN_SECRET = 'test-access-token-secret';
process.env.AI_PROVIDER = 'openai';
process.env.RATE_LIMIT_MAX = '10';
process.env.RATE_LIMIT_TIME_WINDOW = '60000';

// Suppress console errors in tests
const originalConsoleError = console.error;
console.error = (...args) => {
  // Only suppress specific error messages that are expected in tests
  const message = args.join(' ');
  if (message.includes('OpenAI Moderation API error response') ||
      message.includes('Error evaluating image') ||
      message.includes('Error analyzing video') ||
      message.includes('Error evaluating content') ||
      message.includes('AuthenticationError') ||
      message.includes('Failed to download file')) {
    return; // Suppress these errors
  }
  originalConsoleError.apply(console, args);
};

// Aggressive mocks for all external dependencies
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function(id) {
  // Mock OpenAI and all submodules
  if (id === 'openai' || id.startsWith('openai/')) {
    class MockOpenAI {
      constructor(config) {
        this.config = config;
      }
      chat = {
        completions: {
          create: async (params) => ({
            choices: [{
              message: {
                content: JSON.stringify({
                  isSafe: true,
                  reason: 'Image analyzed',
                  confidence: 0.9,
                  flags: []
                })
              }
            }]
          })
        }
      };
      audio = {
        transcriptions: {
          create: async () => ({ text: 'This is a transcription of the audio content.' })
        }
      };
    }
    return { default: MockOpenAI, OpenAI: MockOpenAI };
  }

  // Mock TextEvaluator
  if (id.endsWith('evaluateText') || id.includes('evaluateText')) {
    return {
      TextEvaluator: class MockTextEvaluator {
        constructor() {}
        async evaluateText(text, images = [], videos = []) {
          return {
            isSafe: true,
            confidence: 0.9,
            flags: [],
            reason: 'Mocked evaluation result'
          };
        }
      }
    };
  }

  // Mock VideoAnalyzer
  if (id.endsWith('videoAnalyzer') || id.includes('videoAnalyzer')) {
    return {
      VideoAnalyzer: class MockVideoAnalyzer {
        constructor() {}
        async analyzeVideo(video, index) {
          return {
            videoIndex: index,
            isSafe: true,
            reason: 'Video analysis completed',
            confidence: 0.9,
            flags: [],
            frameResults: [],
            audioTranscription: 'Mock audio transcription',
            audioModerationResult: {
              isSafe: true,
              confidence: 0.9,
              flags: [],
              reason: 'Audio is safe'
            },
            metadata: {
              duration: 10,
              frameCount: 300,
              resolution: '1920x1080',
              size: 1024000
            }
          };
        }
      }
    };
  }

  // Mock http and https
  if (id === 'http' || id === 'https') {
    return {
      get: function(url, cb) {
        const stream = {
          statusCode: 200,
          on: function(event, handler) {
            if (event === 'data') setTimeout(() => handler(Buffer.from('mock data')), 5);
            if (event === 'end') setTimeout(handler, 10);
            return this;
          },
          pipe: function(dest) { setTimeout(() => dest.emit('finish'), 10); return this; }
        };
        setTimeout(() => cb(stream), 5);
        return { on: () => {}, end: () => {} };
      },
      request: function(options, cb) {
        const stream = {
          statusCode: 200,
          on: function(event, handler) {
            if (event === 'data') setTimeout(() => handler(Buffer.from('mock data')), 5);
            if (event === 'end') setTimeout(handler, 10);
            return this;
          },
          pipe: function(dest) { setTimeout(() => dest.emit('finish'), 10); return this; }
        };
        setTimeout(() => cb(stream), 5);
        return { on: () => {}, write: () => {}, end: () => {} };
      }
    };
  }

  // Mock fs
  if (id === 'fs') {
    const originalFs = originalRequire.apply(this, arguments);
    return {
      ...originalFs,
      createWriteStream: () => ({
        on: function(event, handler) { if (event === 'finish') setTimeout(handler, 10); return this; },
        write: () => this,
        end: () => this,
        close: () => this
      }),
      createReadStream: () => ({
        pipe: (dest) => dest
      })
    };
  }
  // Mock fs/promises
  if (id === 'fs/promises') {
    return {
      writeFile: async () => {},
      unlink: async () => {}
    };
  }
  // Mock fluent-ffmpeg
  if (id === 'fluent-ffmpeg') {
    const mockFfmpeg = function() {
      return {
        on: function(event, handler) { if (event === 'end') setTimeout(handler, 10); return this; },
        screenshots: function() { return this; },
        audioCodec: function() { return this; },
        audioChannels: function() { return this; },
        audioFrequency: function() { return this; },
        save: function() { return this; }
      };
    };
    mockFfmpeg.ffprobe = function(path, cb) {
      setTimeout(() => cb(null, {
        streams: [{ codec_type: 'video', width: 1920, height: 1080 }],
        format: { duration: 10, size: 1024000 }
      }), 10);
    };
    return mockFfmpeg;
  }
  return originalRequire.apply(this, arguments);
};

// Comprehensive global fetch mock
global.fetch = async (url, options) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 10));

  // Mock Twitter API
  if (url.includes('api.twitter.com') || url.includes('twitter.com')) {
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ data: { id: '123456789', text: 'Test tweet', created_at: '2023-01-01T00:00:00.000Z' } }),
      text: async () => JSON.stringify({ data: { id: '123456789', text: 'Test tweet', created_at: '2023-01-01T00:00:00.000Z' } })
    };
  }

  // Mock Moderation API
  if (url.includes('/moderations')) {
    const bodyText = options?.body || '';
    if (!bodyText.includes('"input"') || bodyText.includes('"input":""')) {
      return {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: { message: "Empty text is not allowed", type: "invalid_request_error" } }),
        text: async () => JSON.stringify({ error: { message: "Empty text is not allowed", type: "invalid_request_error" } })
      };
    }
    const isUnsafe = bodyText.includes('hate') || bodyText.includes('violence') || bodyText.includes('inappropriate');
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ id: "modr-123456789", model: "text-moderation-007", results: [{ flagged: isUnsafe, categories: {}, category_scores: {} }] }),
      text: async () => JSON.stringify({ id: "modr-123456789", model: "text-moderation-007", results: [{ flagged: isUnsafe, categories: {}, category_scores: {} }] })
    };
  }

  // Mock Vision API
  if (url.includes('/chat/completions') && options?.headers?.['Content-Type']?.includes('multipart/form-data')) {
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ choices: [{ message: { content: JSON.stringify({ isSafe: true, reason: "Image analyzed", confidence: 0.9, flags: [] }) } }] }),
      text: async () => JSON.stringify({ choices: [{ message: { content: JSON.stringify({ isSafe: true, reason: "Image analyzed", confidence: 0.9, flags: [] }) } }] })
    };
  }

  // Mock Whisper API
  if (url.includes('/audio/transcriptions')) {
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ text: "This is a transcription of the audio content." }),
      text: async () => JSON.stringify({ text: "This is a transcription of the audio content." })
    };
  }

  // Handle video/image downloads - return success for any URL
  if (url.includes('example.com') || url.includes('file://') || url.includes('http')) {
    return {
      ok: true,
      status: 200,
      arrayBuffer: async () => new ArrayBuffer(1024),
      json: async () => ({ success: true }),
      text: async () => 'Mock response text'
    };
  }

  // Default success response for any other URL
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => ({ success: true }),
    text: async () => JSON.stringify({ success: true })
  };
};