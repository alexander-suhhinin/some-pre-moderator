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
            content: "This image appears to be safe and appropriate content."
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
            content: "This image contains inappropriate content that violates content policies."
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

// Mock fetch function for OpenAI API calls
export const mockFetch = async (url: string, options: any) => {
  const { method, headers, body } = options;

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));

    // Mock Moderation API
  if (url.includes('/moderations')) {
    const bodyText = body || '';

    // Return error for empty text
    if (!bodyText.includes('"input"') || bodyText.includes('"input":""') || bodyText.includes('"input":"test text"')) {
      return {
        ok: false,
        status: 400,
        json: async () => ({
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
      json: async () => isUnsafe ? mockOpenaiResponses.moderation.unsafe : mockOpenaiResponses.moderation.safe
    };
  }

  // Mock Vision API
  if (url.includes('/chat/completions') && headers['Content-Type']?.includes('multipart/form-data')) {
    return {
      ok: true,
      status: 200,
      json: async () => mockOpenaiResponses.vision.safe
    };
  }

  // Mock Whisper API
  if (url.includes('/audio/transcriptions')) {
    return {
      ok: true,
      status: 200,
      json: async () => mockOpenaiResponses.whisper.transcription
    };
  }

  // Default error response
  return {
    ok: false,
    status: 400,
    json: async () => ({ error: { message: "Unknown endpoint" } })
  };
};

// Mock OpenAI client
export const mockOpenaiClient = {
  chat: {
    completions: {
      create: async (params: any) => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 100));

        if (params.messages?.some((msg: any) => msg.content?.includes('image'))) {
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
                content: "This is a safe response."
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
        await new Promise(resolve => setTimeout(resolve, 100));
        return mockOpenaiResponses.whisper.transcription;
      }
    }
  }
};