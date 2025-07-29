import { TextEvaluator } from '../utils/evaluateText';
import { ModerationRequest, ModerationResult } from '../types';

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

  public async moderateContent(request: ModerationRequest): Promise<ModerationResult> {
    return await this.textEvaluator.evaluateText(request.text, request.images);
  }

  public async moderateText(text: string, images?: any[]): Promise<ModerationResult> {
    return await this.textEvaluator.evaluateText(text, images);
  }
}