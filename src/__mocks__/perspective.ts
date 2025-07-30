// Mock Perspective API responses
export const mockPerspectiveResponses = {
  safe: {
    attributeScores: {
      TOXICITY: {
        summaryScore: {
          value: 0.1,
          type: 'PROBABILITY'
        }
      },
      SEVERE_TOXICITY: {
        summaryScore: {
          value: 0.05,
          type: 'PROBABILITY'
        }
      },
      IDENTITY_ATTACK: {
        summaryScore: {
          value: 0.02,
          type: 'PROBABILITY'
        }
      },
      INSULT: {
        summaryScore: {
          value: 0.08,
          type: 'PROBABILITY'
        }
      },
      PROFANITY: {
        summaryScore: {
          value: 0.03,
          type: 'PROBABILITY'
        }
      },
      THREAT: {
        summaryScore: {
          value: 0.01,
          type: 'PROBABILITY'
        }
      }
    },
    languages: ['en'],
    detectedLanguages: ['en']
  },
  toxic: {
    attributeScores: {
      TOXICITY: {
        summaryScore: {
          value: 0.85,
          type: 'PROBABILITY'
        }
      },
      SEVERE_TOXICITY: {
        summaryScore: {
          value: 0.75,
          type: 'PROBABILITY'
        }
      },
      IDENTITY_ATTACK: {
        summaryScore: {
          value: 0.65,
          type: 'PROBABILITY'
        }
      },
      INSULT: {
        summaryScore: {
          value: 0.90,
          type: 'PROBABILITY'
        }
      },
      PROFANITY: {
        summaryScore: {
          value: 0.80,
          type: 'PROBABILITY'
        }
      },
      THREAT: {
        summaryScore: {
          value: 0.70,
          type: 'PROBABILITY'
        }
      }
    },
    languages: ['en'],
    detectedLanguages: ['en']
  }
};