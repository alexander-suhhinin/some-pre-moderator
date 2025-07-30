import { TextEvaluator } from '../utils/evaluateText';
import { ModerationRequest, ModerationResult, ImageData, VideoData } from '../types';

export class ModerationService {
  private static instance: ModerationService;
  private textEvaluator: TextEvaluator;

  private constructor() {
    this.textEvaluator = new TextEvaluator(
      process.env.OPENAI_API_KEY || '',
      process.env.PERSPECTIVE_API_KEY || '',
      (process.env.AI_PROVIDER as 'openai' | 'perspective') || 'openai'
    );
  }

  public static getInstance(): ModerationService {
    if (!ModerationService.instance) {
      ModerationService.instance = new ModerationService();
    }
    return ModerationService.instance;
  }

  public async moderateText(text: string, images?: ImageData[], videos?: VideoData[]): Promise<ModerationResult> {
    return await this.textEvaluator.evaluateText(text, images, videos);
  }
}