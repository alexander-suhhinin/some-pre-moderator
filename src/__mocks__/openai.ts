// Mock OpenAI API responses
export const mockOpenAIResponses = {
  moderation: {
    results: [
      {
        flagged: false,
        categories: {
          hate: false,
          'hate/threatening': false,
          self_harm: false,
          sexual: false,
          'sexual/minors': false,
          violence: false,
          'violence/graphic': false
        },
        category_scores: {
          hate: 0.1,
          'hate/threatening': 0.05,
          self_harm: 0.02,
          sexual: 0.03,
          'sexual/minors': 0.01,
          violence: 0.08,
          'violence/graphic': 0.04
        }
      }
    ]
  },
  vision: {
    choices: [
      {
        message: {
          content: 'This image appears to be safe and appropriate content.'
        }
      }
    ],
    usage: {
      prompt_tokens: 100,
      completion_tokens: 20,
      total_tokens: 120
    }
  },
  whisper: {
    text: 'This is a transcription of the audio content.'
  }
};

export const mockOpenAIError = {
  status: 401,
  error: {
    message: 'Incorrect API key provided',
    type: 'invalid_request_error',
    code: 'invalid_api_key'
  }
};