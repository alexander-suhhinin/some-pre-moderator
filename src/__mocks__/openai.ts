// Mock responses for OpenAI API
export const mockOpenaiResponses = {
  // Moderation API responses
  moderation: {
    safe: {
      id: "modr-123456789",
      model: "text-moderation-007",
      results: [
        {
          flagged: false,
          categories: {
            sexual: false,
            hate: false,
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
            hate: 0.0001,
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
        }
      ]
    },
    unsafe: {
      id: "modr-123456789",
      model: "text-moderation-007",
      results: [
        {
          flagged: true,
          categories: {
            sexual: false,
            hate: true,
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
            hate: 0.95,
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
        }
      ]
    }
  },

  // Vision API responses
  vision: {
    safe: {
      id: "chatcmpl-123456789",
      object: "chat.completion",
      created: 1234567890,
      model: "gpt-4o",
      choices: [
        {
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
        }
      ],
      usage: {
        prompt_tokens: 100,
        completion_tokens: 20,
        total_tokens: 120
      }
    },
    unsafe: {
      id: "chatcmpl-123456789",
      object: "chat.completion",
      created: 1234567890,
      model: "gpt-4o",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: JSON.stringify({
              isSafe: false,
              reason: "Inappropriate content detected",
              confidence: 0.8,
              flags: ["violence"]
            })
          },
          finish_reason: "stop"
        }
      ],
      usage: {
        prompt_tokens: 100,
        completion_tokens: 25,
        total_tokens: 125
      }
    }
  },

  // Whisper API responses
  whisper: {
    transcription: {
      text: "This is a transcription of the audio content."
    }
  }
};

// Mock VideoAnalyzer class
export class MockVideoAnalyzer {
  async analyzeVideo(video: any, index: number): Promise<any> {
    // Simulate processing delay
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

  async evaluateImage(image: any, index: number): Promise<any> {
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

// Mock fetch function for OpenAI API calls
export const mockFetch = async (url: string, options: any) => {
  const { method, headers, body } = options;

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
      json: async () => isUnsafe ? mockOpenaiResponses.moderation.unsafe : mockOpenaiResponses.moderation.safe,
      text: async () => JSON.stringify(isUnsafe ? mockOpenaiResponses.moderation.unsafe : mockOpenaiResponses.moderation.safe)
    };
  }

  // Mock Vision API
  if (url.includes('/chat/completions') && headers['Content-Type']?.includes('multipart/form-data')) {
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => mockOpenaiResponses.vision.safe,
      text: async () => JSON.stringify(mockOpenaiResponses.vision.safe)
    };
  }

  // Mock Whisper API
  if (url.includes('/audio/transcriptions')) {
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => mockOpenaiResponses.whisper.transcription,
      text: async () => JSON.stringify(mockOpenaiResponses.whisper.transcription)
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

// Mock OpenAI client
export const mockOpenaiClient = {
  chat: {
    completions: {
      create: async (params: any) => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 10));

        if (params.messages?.some((msg: any) => msg.content?.some((content: any) => content.type === 'image_url'))) {
          return mockOpenaiResponses.vision.safe;
        }

        return {
          id: "chatcmpl-123456789",
          object: "chat.completion",
          created: 1234567890,
          model: "gpt-4o",
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                content: JSON.stringify({
                  isSafe: true,
                  reason: "Content analyzed",
                  confidence: 0.9,
                  flags: []
                })
              },
              finish_reason: "stop"
            }
          ],
          usage: {
            prompt_tokens: 50,
            completion_tokens: 10,
            total_tokens: 60
          }
        };
      }
    }
  },
  audio: {
    transcriptions: {
      create: async (params: any) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return mockOpenaiResponses.whisper.transcription;
      }
    }
  }
};