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
  videoResults?: VideoModerationResult[];
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

export type AIProvider = 'openai';

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

export interface VideoData {
  url?: string;
  base64?: string;
  contentType?: string;
  duration?: number; // в секундах
  frameRate?: number;
  resolution?: {
    width: number;
    height: number;
  };
  size?: number; // в байтах
}

export interface VideoModerationResult {
  videoIndex: number;
  isSafe: boolean;
  reason: string;
  confidence: number;
  flags: string[];
  frameResults: ImageModerationResult[];
  audioTranscription?: string | null;
  audioModerationResult?: ModerationResult | null;
  metadata: {
    duration: number;
    frameCount: number;
    resolution: string;
    size: number;
  };
}

export interface VideoModerationRequest {
  text?: string;
  images?: ImageData[];
  videos?: VideoData[];
}

export interface VideoModerationResponse {
  result: 'ok' | 'rejected';
  reason?: string;
  confidence: number;
  flags: string[];
  imageResults?: ImageModerationResult[];
  videoResults?: VideoModerationResult[];
  audioTranscription?: string;
  metadata: {
    totalFrames: number;
    totalDuration: number;
    totalSize: number;
  };
}