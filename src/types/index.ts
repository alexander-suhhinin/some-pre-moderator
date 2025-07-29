export interface ModerationRequest {
  text: string;
  images?: ImageData[];
}

export interface ImageData {
  url?: string;
  base64?: string;
  filename?: string;
  contentType?: string;
}

export interface ModerationResponse {
  result: 'ok' | 'rejected';
  reason?: string;
  confidence?: number;
  flags?: string[];
  imageResults?: ImageModerationResult[];
}

export interface ModerationResult {
  isSafe: boolean;
  reason?: string;
  confidence?: number;
  flags?: string[];
  imageResults?: ImageModerationResult[];
}

export interface ImageModerationResult {
  imageIndex: number;
  isSafe: boolean;
  reason?: string;
  confidence?: number;
  flags?: string[];
  detectedObjects?: string[];
  adultContent?: boolean;
  violence?: boolean;
  hate?: boolean;
}

export interface XPostRequest {
  text: string;
  images?: ImageData[];
  replyTo?: string;
  quoteTweet?: string;
}

export interface XPostResponse {
  success: boolean;
  tweetId?: string;
  moderationResult: ModerationResponse;
  error?: string;
}

export type AIProvider = 'openai' | 'perspective';

export interface OpenAIResponse {
  id: string;
  model: string;
  results: Array<{
    flagged: boolean;
    categories: {
      hate: boolean;
      'hate/threatening': boolean;
      'self-harm': boolean;
      sexual: boolean;
      'sexual/minors': boolean;
      violence: boolean;
      'violence/graphic': boolean;
    };
    category_scores: {
      hate: number;
      'hate/threatening': number;
      'self-harm': number;
      sexual: number;
      'sexual/minors': number;
      violence: number;
      'violence/graphic': number;
    };
  }>;
}

export interface OpenAIImageResponse {
  id: string;
  model: string;
  data: Array<{
    object: string;
    confidence: number;
    name: string;
  }>;
}

export interface PerspectiveResponse {
  attributeScores: {
    TOXICITY: {
      summaryScore: {
        value: number;
        type: string;
      };
    };
    SEVERE_TOXICITY: {
      summaryScore: {
        value: number;
        type: string;
      };
    };
    IDENTITY_ATTACK: {
      summaryScore: {
        value: number;
        type: string;
      };
    };
    THREAT: {
      summaryScore: {
        value: number;
        type: string;
      };
    };
    SEXUALLY_EXPLICIT: {
      summaryScore: {
        value: number;
        type: string;
      };
    };
  };
  languages: string[];
  detectedLanguages: string[];
}