import { ModerationResult, ImageData, VideoData } from '../types';
import { TextEvaluator } from '../utils/evaluateText';

export class ModerationService {
  private static instance: ModerationService;
  private textEvaluator: TextEvaluator;

  private constructor() {
    this.textEvaluator = new TextEvaluator(
      process.env.OPENAI_API_KEY || '',
      'openai'
    );
  }

  public static getInstance(): ModerationService {
    if (!ModerationService.instance) {
      ModerationService.instance = new ModerationService();
    }
    return ModerationService.instance;
  }

  public async moderateText(
    text: string,
    images: ImageData[] = [],
    videos: VideoData[] = []
  ): Promise<ModerationResult> {
    return await this.textEvaluator.evaluateText(text, images, videos);
  }
}