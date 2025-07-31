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

// Global mock for fetch to prevent all HTTP requests
global.fetch = async (url, options) => {
  const { method, headers, body } = options || {};

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 10));

  // Mock Moderation API
  if (url.includes('/moderations')) {
    const bodyText = body || '';

    // Return error for empty text
    if (!bodyText.includes('"input"') || bodyText.includes('"input":""')) {
      return {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({
          error: {
            message: "Empty text is not allowed",
            type: "invalid_request_error"
          }
        }),
        text: async () => JSON.stringify({
          error: {
            message: "Empty text is not allowed",
            type: "invalid_request_error"
          }
        })
      };
    }

    const isUnsafe = bodyText.includes('hate') || bodyText.includes('violence') || bodyText.includes('inappropriate');

    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({
        id: "modr-123456789",
        model: "text-moderation-007",
        results: [{
          flagged: isUnsafe,
          categories: {
            sexual: false,
            hate: isUnsafe,
            harassment: false,
            "self-harm": false,
            "sexual/minors": false,
            "hate/threatening": false,
            "violence/graphic": false,
            "self-harm/intent": false,
            "self-harm/instructions": false,
            "harassment/threatening": false,
            violence: false
          },
          category_scores: {
            sexual: 0.0001,
            hate: isUnsafe ? 0.95 : 0.0001,
            harassment: 0.0001,
            "self-harm": 0.0001,
            "sexual/minors": 0.0001,
            "hate/threatening": 0.0001,
            "violence/graphic": 0.0001,
            "self-harm/intent": 0.0001,
            "self-harm/instructions": 0.0001,
            "harassment/threatening": 0.0001,
            violence: 0.0001
          }
        }]
      }),
      text: async () => JSON.stringify({
        id: "modr-123456789",
        model: "text-moderation-007",
        results: [{
          flagged: isUnsafe,
          categories: {
            sexual: false,
            hate: isUnsafe,
            harassment: false,
            "self-harm": false,
            "sexual/minors": false,
            "hate/threatening": false,
            "violence/graphic": false,
            "self-harm/intent": false,
            "self-harm/instructions": false,
            "harassment/threatening": false,
            violence: false
          },
          category_scores: {
            sexual: 0.0001,
            hate: isUnsafe ? 0.95 : 0.0001,
            harassment: 0.0001,
            "self-harm": 0.0001,
            "sexual/minors": 0.0001,
            "hate/threatening": 0.0001,
            "violence/graphic": 0.0001,
            "self-harm/intent": 0.0001,
            "self-harm/instructions": 0.0001,
            "harassment/threatening": 0.0001,
            violence: 0.0001
          }
        }]
      })
    };
  }

  // Mock Vision API
  if (url.includes('/chat/completions') && headers?.['Content-Type']?.includes('multipart/form-data')) {
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({
        id: "chatcmpl-123456789",
        object: "chat.completion",
        created: 1234567890,
        model: "gpt-4o",
        choices: [{
          index: 0,
          message: {
            role: "assistant",
            content: JSON.stringify({
              isSafe: true,
              reason: "Image analyzed",
              confidence: 0.9,
              flags: []
            })
          },
          finish_reason: "stop"
        }],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 20,
          total_tokens: 120
        }
      }),
      text: async () => JSON.stringify({
        id: "chatcmpl-123456789",
        object: "chat.completion",
        created: 1234567890,
        model: "gpt-4o",
        choices: [{
          index: 0,
          message: {
            role: "assistant",
            content: JSON.stringify({
              isSafe: true,
              reason: "Image analyzed",
              confidence: 0.9,
              flags: []
            })
          },
          finish_reason: "stop"
        }],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 20,
          total_tokens: 120
        }
      })
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
      arrayBuffer: async () => new ArrayBuffer(1024), // Mock video/image data
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

// Mock OpenAI module
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function(id) {
  // Mock OpenAI - handle all possible import paths
  if (id === 'openai' || id.includes('openai')) {
    const MockOpenAI = class MockOpenAI {
      constructor(config) {
        this.config = config;
      }

      chat = {
        completions: {
          create: async (params) => {
            await new Promise(resolve => setTimeout(resolve, 10));

            // Check if this is an image analysis request
            const hasImage = params.messages?.some(msg =>
              msg.content?.some(content => content.type === 'image_url')
            );

            if (hasImage) {
              return {
                choices: [{
                  message: {
                    content: JSON.stringify({
                      isSafe: true,
                      reason: "Image analyzed",
                      confidence: 0.9,
                      flags: []
                    })
                  }
                }]
              };
            }

            return {
              choices: [{
                message: {
                  content: JSON.stringify({
                    isSafe: true,
                    reason: "Content analyzed",
                    confidence: 0.9,
                    flags: []
                  })
                }
              }]
            };
          }
        }
      };

      audio = {
        transcriptions: {
          create: async (params) => {
            await new Promise(resolve => setTimeout(resolve, 10));
            return { text: "This is a transcription of the audio content." };
          }
        }
      };
    };

    // Return both default export and named export
    MockOpenAI.default = MockOpenAI;
    return MockOpenAI;
  }

  if (id.endsWith('videoAnalyzer')) {
    return {
      VideoAnalyzer: class MockVideoAnalyzer {
        constructor() {}

        async analyzeVideo(video, index) {
          await new Promise(resolve => setTimeout(resolve, 10));
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

        async evaluateImage(image, index) {
          await new Promise(resolve => setTimeout(resolve, 5));
          return {
            imageIndex: index,
            isSafe: true,
            reason: 'Image analyzed',
            confidence: 0.9,
            flags: []
          };
        }
      }
    };
  }

  // Mock http and https modules to prevent real HTTP requests
  if (id === 'http' || id === 'https') {
    return {
      get: function(url, callback) {
        // Simulate successful response
        const mockResponse = {
          statusCode: 200,
          pipe: function(writeStream) {
            // Simulate data streaming
            setTimeout(() => {
              writeStream.emit('finish');
            }, 10);
            return mockResponse;
          },
          on: function(event, handler) {
            if (event === 'data') {
              // Simulate data chunks
              setTimeout(() => handler(Buffer.from('mock data')), 5);
            } else if (event === 'end') {
              setTimeout(handler, 15);
            }
            return mockResponse;
          }
        };

        setTimeout(() => callback(mockResponse), 5);

        return {
          on: function(event, handler) {
            return this;
          }
        };
      }
    };
  }

  // Mock fs module to prevent file system operations
  if (id === 'fs') {
    const originalFs = originalRequire.apply(this, arguments);
    return {
      ...originalFs,
      createWriteStream: function(path) {
        return {
          on: function(event, handler) {
            if (event === 'finish') {
              setTimeout(handler, 10);
            }
            return this;
          },
          write: function(data) {
            return this;
          },
          end: function() {
            return this;
          },
          close: function() {
            return this;
          }
        };
      },
      createReadStream: function(path) {
        return {
          pipe: function(dest) {
            return dest;
          }
        };
      }
    };
  }

  // Mock fs/promises
  if (id === 'fs/promises') {
    return {
      writeFile: async function(path, data) {
        await new Promise(resolve => setTimeout(resolve, 10));
        return undefined;
      },
      unlink: async function(path) {
        await new Promise(resolve => setTimeout(resolve, 5));
        return undefined;
      }
    };
  }

  // Mock fluent-ffmpeg
  if (id === 'fluent-ffmpeg') {
    const mockFfmpeg = function(input) {
      return {
        on: function(event, handler) {
          if (event === 'end') {
            setTimeout(handler, 20);
          }
          return this;
        },
        screenshots: function(options) {
          return this;
        },
        audioCodec: function(codec) {
          return this;
        },
        audioChannels: function(channels) {
          return this;
        },
        audioFrequency: function(freq) {
          return this;
        },
        save: function(output) {
          return this;
        }
      };
    };

    mockFfmpeg.ffprobe = function(path, callback) {
      setTimeout(() => {
        callback(null, {
          streams: [{ codec_type: 'video', width: 1920, height: 1080 }],
          format: { duration: 10, size: 1024000 }
        });
      }, 10);
    };

    return mockFfmpeg;
  }

  return originalRequire.apply(this, arguments);
};