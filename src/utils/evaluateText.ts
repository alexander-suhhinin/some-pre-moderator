import OpenAI from 'openai';
import { ModerationResult, AIProvider, OpenAIResponse, PerspectiveResponse, ImageData, ImageModerationResult, OpenAIImageResponse, VideoData, VideoModerationResult } from '../types';
import { VideoAnalyzer } from './videoAnalyzer';

export class TextEvaluator {
  private openai: any;
  private perspectiveApiKey: string;
  private perspectiveApiUrl: string;
  private aiProvider: 'openai' | 'perspective';
  private videoAnalyzer: VideoAnalyzer;

  constructor(
    openaiApiKey: string,
    perspectiveApiKey: string,
    aiProvider: 'openai' | 'perspective' = 'openai'
  ) {
    this.perspectiveApiKey = perspectiveApiKey;
    this.perspectiveApiUrl = process.env.PERSPECTIVE_API_URL || 'https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze';
    this.aiProvider = aiProvider;

    if (aiProvider === 'openai') {
      this.openai = new OpenAI({
        apiKey: openaiApiKey,
      });
    }

    this.videoAnalyzer = new VideoAnalyzer();
  }

  async evaluateText(text: string, images?: ImageData[], videos?: VideoData[]): Promise<ModerationResult> {
    try {
      const results: (ModerationResult | ImageModerationResult | VideoModerationResult)[] = [];

      if (text && text.trim()) {
        const textResult = await this.evaluateTextContent(text);
        results.push(textResult);
      }

      if (images && images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const image = images[i];
          if (image) {
            const imageResult = await this.evaluateImage(image, i);
            results.push(imageResult);
          }
        }
      }

      if (videos && videos.length > 0) {
        for (let i = 0; i < videos.length; i++) {
          const video = videos[i];
          if (video) {
            const videoResult = await this.videoAnalyzer.analyzeVideo(video, i);
            results.push(videoResult);
          }
        }
      }

      return this.combineResults(results);
    } catch (error) {
      console.error('Error evaluating content:', error);
      return {
        isSafe: false,
        reason: 'Failed to evaluate content',
        confidence: 0.5,
        flags: ['evaluation_error']
      };
    }
  }

  private async evaluateTextContent(text: string): Promise<ModerationResult> {
    if (this.aiProvider === 'openai') {
      return await this.evaluateWithOpenAI(text);
    } else {
      return await this.evaluateWithPerspective(text);
    }
  }

  private combineResults(results: (ModerationResult | ImageModerationResult | VideoModerationResult)[]): ModerationResult {
    if (results.length === 0) {
      return {
        isSafe: true,
        reason: 'No content to evaluate',
        confidence: 1.0,
        flags: []
      };
    }

    // Checking for rejected content
    const rejectedResults = results.filter(result => {
      if ('result' in result) {
        return result.result === 'rejected';
      }
      return !result.isSafe;
    });

    if (rejectedResults.length > 0) {
      const reasons = rejectedResults.map(result => {
        if ('result' in result) {
          return result.reason || 'Content rejected';
        }
        return result.reason || 'Unsafe content detected';
      });

      const allFlags = results.flatMap(result => result.flags || []);

      return {
        isSafe: false,
        reason: reasons.join('; '),
        confidence: this.calculateAverageConfidence(results),
        flags: [...new Set(allFlags)]
      };
    }

    // All ok.
    const allFlags = results.flatMap(result => result.flags || []);

    return {
      isSafe: true,
      reason: 'All content is safe',
      confidence: this.calculateAverageConfidence(results),
      flags: [...new Set(allFlags)]
    };
  }

  private calculateAverageConfidence(results: (ModerationResult | ImageModerationResult | VideoModerationResult)[]): number {
    const confidences = results.map(result => result.confidence || 1.0);
    return confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
  }

  public async evaluateImage(image: ImageData, index: number): Promise<ImageModerationResult> {
    try {
      const visionModel = process.env.OPENAI_VISION_MODEL || 'gpt-4o';

      // Use OpenAI Vision API for image analysis
      const response = await this.openai.chat.completions.create({
        model: visionModel,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this image for inappropriate content. Check for: 1) Adult/sexual content 2) Violence/gore 3) Hate symbols 4) Self-harm content 5) Illegal activities. Respond with valid JSON format only: {\"isSafe\": boolean, \"reason\": string, \"confidence\": number, \"flags\": [string], \"detectedObjects\": [string], \"adultContent\": boolean, \"violence\": boolean, \"hate\": boolean}"
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

      // Clean the response content - remove markdown formatting if present
      let cleanContent = content.trim();

      // Remove markdown code blocks if present
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      // Parse the JSON response
      let analysis;
      try {
        analysis = JSON.parse(cleanContent);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', cleanContent);
        console.error('Parse error:', parseError);

        // Fallback: try to extract JSON from the response
        const jsonMatch = cleanContent.match(/\{.*\}/s);
        if (jsonMatch) {
          try {
            analysis = JSON.parse(jsonMatch[0]);
          } catch (fallbackError) {
            console.error('Fallback JSON parsing also failed:', fallbackError);
            throw new Error('Unable to parse AI response as JSON');
          }
        } else {
          throw new Error('No JSON found in AI response');
        }
      }

      return {
        imageIndex: index,
        isSafe: analysis.isSafe || false,
        reason: analysis.reason || 'Image analyzed',
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