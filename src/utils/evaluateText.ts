import OpenAI from 'openai';
import { ModerationResult, AIProvider, OpenAIResponse, PerspectiveResponse, ImageData, ImageModerationResult, OpenAIImageResponse } from '../types';

export class TextEvaluator {
  private openai: OpenAI;
  private aiProvider: AIProvider;
  private perspectiveApiKey: string;
  private perspectiveApiUrl: string;

  constructor(
    openaiApiKey: string,
    perspectiveApiKey: string,
    aiProvider: AIProvider = 'openai'
  ) {
    this.openai = new OpenAI({ apiKey: openaiApiKey });
    this.perspectiveApiKey = perspectiveApiKey;
    this.perspectiveApiUrl = process.env.PERSPECTIVE_API_URL || 'https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze';
    this.aiProvider = aiProvider;
  }

  async evaluateText(text: string, images?: ImageData[]): Promise<ModerationResult> {
    try {
      let textResult: ModerationResult;

      if (this.aiProvider === 'openai') {
        textResult = await this.evaluateWithOpenAI(text);
      } else {
        textResult = await this.evaluateWithPerspective(text);
      }

      // If no images, return text result only
      if (!images || images.length === 0) {
        return textResult;
      }

      // Evaluate images if provided
      const imageResults: ImageModerationResult[] = [];
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        if (image) {
          const imageResult = await this.evaluateImage(image, i);
          imageResults.push(imageResult);
        }
      }

      // Combine results - if any image is unsafe, the whole content is unsafe
      const unsafeImages = imageResults.filter(result => !result.isSafe);
      const isOverallSafe = textResult.isSafe && unsafeImages.length === 0;

      const result: ModerationResult = {
        isSafe: isOverallSafe,
        confidence: Math.max(
          textResult.confidence || 0,
          ...imageResults.map(r => r.confidence || 0)
        ),
        flags: [
          ...(textResult.flags || []),
          ...imageResults.flatMap(r => r.flags || [])
        ],
        imageResults
      };

      if (!isOverallSafe) {
        result.reason = textResult.reason || unsafeImages[0]?.reason || 'inappropriate content detected';
      }

      return result;
    } catch (error) {
      console.error('Error evaluating content:', error);
      throw new Error('Failed to evaluate content');
    }
  }

  private async evaluateImage(image: ImageData, index: number): Promise<ImageModerationResult> {
    try {
      // Use OpenAI Vision API for image analysis
      const response = await this.openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this image for inappropriate content. Check for: 1) Adult/sexual content 2) Violence/gore 3) Hate symbols 4) Self-harm content 5) Illegal activities. Respond with JSON format: {\"isSafe\": boolean, \"reason\": string, \"confidence\": number, \"flags\": [string], \"detectedObjects\": [string], \"adultContent\": boolean, \"violence\": boolean, \"hate\": boolean}"
              },
              {
                type: "image_url",
                image_url: {
                  url: image.url || `data:${image.contentType || 'image/jpeg'};base64,${image.base64}`
                }
              }
            ]
          }
        ],
        max_tokens: 500
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI Vision API');
      }

      // Parse the JSON response
      const analysis = JSON.parse(content);

      return {
        imageIndex: index,
        isSafe: analysis.isSafe || false,
        reason: analysis.reason,
        confidence: analysis.confidence || 0.5,
        flags: analysis.flags || [],
        detectedObjects: analysis.detectedObjects || [],
        adultContent: analysis.adultContent || false,
        violence: analysis.violence || false,
        hate: analysis.hate || false
      };
    } catch (error) {
      console.error(`Error evaluating image ${index}:`, error);
      // Return safe by default if image analysis fails
      return {
        imageIndex: index,
        isSafe: true,
        reason: 'Image analysis failed, defaulting to safe',
        confidence: 0.5
      };
    }
  }

  private async evaluateWithOpenAI(text: string): Promise<ModerationResult> {
    const response = await this.openai.moderations.create({
      input: text,
    });

    const result = response.results[0];
    if (!result) {
      throw new Error('No moderation result received from OpenAI');
    }
    const categories = result.categories;
    const categoryScores = result.category_scores;

    // Check if any category is flagged
    const flaggedCategories = Object.entries(categories)
      .filter(([_, isFlagged]) => isFlagged)
      .map(([category, _]) => category);

    if (flaggedCategories.length === 0) {
      return {
        isSafe: true,
        confidence: 1.0,
      };
    }

    // Get the highest score among flagged categories
    const maxScore = Math.max(...flaggedCategories.map(cat => categoryScores[cat as keyof typeof categoryScores] || 0));

    // Map category names to human-readable reasons
    const reasonMap: Record<string, string> = {
      hate: 'hate speech',
      'hate/threatening': 'threatening hate speech',
      'self-harm': 'self-harm content',
      sexual: 'sexual content',
      'sexual/minors': 'sexual content involving minors',
      violence: 'violent content',
      'violence/graphic': 'graphic violent content',
    };

    const primaryReason = flaggedCategories[0];
    if (!primaryReason) {
      throw new Error('No flagged categories found');
    }
    const reason = reasonMap[primaryReason] || primaryReason;

    return {
      isSafe: false,
      reason,
      confidence: maxScore,
      flags: flaggedCategories,
    };
  }

  private async evaluateWithPerspective(text: string): Promise<ModerationResult> {
    const requestBody = {
      comment: {
        text: text,
      },
      requestedAttributes: {
        TOXICITY: {},
        SEVERE_TOXICITY: {},
        IDENTITY_ATTACK: {},
        THREAT: {},
        SEXUALLY_EXPLICIT: {},
      },
    };

    const response = await fetch(`${this.perspectiveApiUrl}?key=${this.perspectiveApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Perspective API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as PerspectiveResponse;
    const scores = data.attributeScores;

    // Define thresholds for different categories
    const thresholds = {
      TOXICITY: 0.7,
      SEVERE_TOXICITY: 0.5,
      IDENTITY_ATTACK: 0.6,
      THREAT: 0.5,
      SEXUALLY_EXPLICIT: 0.7,
    };

    const flaggedCategories: string[] = [];
    let maxScore = 0;

    // Check each category against its threshold
    Object.entries(scores).forEach(([category, scoreData]) => {
      const score = scoreData.summaryScore.value;
      const threshold = thresholds[category as keyof typeof thresholds] || 0.5;

      if (score > threshold) {
        flaggedCategories.push(category.toLowerCase().replace('_', ' '));
        maxScore = Math.max(maxScore, score);
      }
    });

    if (flaggedCategories.length === 0) {
      return {
        isSafe: true,
        confidence: 1.0,
      };
    }

    // Map category names to human-readable reasons
    const reasonMap: Record<string, string> = {
      'toxicity': 'toxic content',
      'severe toxicity': 'severely toxic content',
      'identity attack': 'identity attack',
      'threat': 'threatening content',
      'sexually explicit': 'sexually explicit content',
    };

    const primaryReason = flaggedCategories[0];
    if (!primaryReason) {
      throw new Error('No flagged categories found');
    }
    const reason = reasonMap[primaryReason] || primaryReason;

    return {
      isSafe: false,
      reason,
      confidence: maxScore,
      flags: flaggedCategories,
    };
  }
}