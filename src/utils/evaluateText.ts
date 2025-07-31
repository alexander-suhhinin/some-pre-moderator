import OpenAI from 'openai';
import { ModerationResult, AIProvider, OpenAIResponse, ImageData, ImageModerationResult, OpenAIImageResponse, VideoData, VideoModerationResult } from '../types';
import { VideoAnalyzer } from '../utils/videoAnalyzer';

export class TextEvaluator {
  private openai: any;
  private openaiApiKey: string;
  private openaiApiUrl: string;
  private aiProvider: 'openai';
  private videoAnalyzer: VideoAnalyzer;

  constructor(
    openaiApiKey: string,
    aiProvider: 'openai' = 'openai'
  ) {
    this.openaiApiKey = openaiApiKey;
    this.openaiApiUrl = process.env.OPENAI_API_URL || 'https://api.openai.com/v1';
    this.aiProvider = aiProvider;

    if (aiProvider === 'openai') {
      this.openai = new OpenAI({
        apiKey: openaiApiKey,
      });
    } else {
      throw new Error(`Unsupported AI provider: ${aiProvider}`);
    }

    this.videoAnalyzer = new VideoAnalyzer();
  }

  async evaluateText(
    text: string,
    images: ImageData[] = [],
    videos: VideoData[] = []
  ): Promise<ModerationResult> {
    try {
      // Evaluate text content
      const textResult = await this.evaluateTextContent(text);

      // Evaluate images if provided
      const imageResults: ImageModerationResult[] = [];
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        if (image) {
          try {
            const imageResult = await this.evaluateImage(image, i);
            imageResults.push(imageResult);
          } catch (error) {
            console.error(`Error evaluating image ${i}:`, error);
            imageResults.push({
              imageIndex: i,
              isSafe: true,
              confidence: 0,
              flags: ['error']
            });
          }
        }
      }

      // Evaluate videos if provided
      const videoResults: VideoModerationResult[] = [];
      if (videos.length > 0) {
        const videoAnalyzer = new VideoAnalyzer();
        for (let i = 0; i < videos.length; i++) {
          const video = videos[i];
          if (video) {
            try {
              const videoResult = await videoAnalyzer.analyzeVideo(video, i);
              videoResults.push(videoResult);
            } catch (error) {
              console.error(`Error analyzing video ${i}:`, error);
              videoResults.push({
                videoIndex: i,
                isSafe: true,
                reason: 'Video analysis failed',
                confidence: 0,
                flags: ['error'],
                frameResults: [],
                metadata: {
                  duration: 0,
                  frameCount: 0,
                  resolution: 'unknown',
                  size: 0
                }
              });
            }
          }
        }
      }

      // Combine all results
      return this.combineResults(textResult, imageResults, videoResults);
    } catch (error) {
      console.error('Error evaluating content:', error);
      throw error;
    }
  }

  private async evaluateTextContent(text: string): Promise<ModerationResult> {
    if (this.aiProvider === 'openai') {
      return await this.evaluateWithOpenAI(text);
    }

    throw new Error(`Unsupported AI provider: ${this.aiProvider}`);
  }

  private combineResults(textResult: ModerationResult, imageResults: ImageModerationResult[], videoResults: VideoModerationResult[]): ModerationResult {
    const allResults = [textResult, ...imageResults, ...videoResults];

    if (allResults.length === 0) {
      return {
        isSafe: true,
        reason: 'No content to evaluate',
        confidence: 1.0,
        flags: [],
        imageResults: [],
        videoResults: []
      };
    }

    // Checking for rejected content
    const rejectedResults = allResults.filter(result => {
      if ('isFlagged' in result) {
        return result.isFlagged;
      }
      return !result.isSafe;
    });

    if (rejectedResults.length > 0) {
      const reasons = rejectedResults.map(result => {
        if ('isFlagged' in result) {
          return result.reason || 'Content rejected';
        }
        return result.reason || 'Unsafe content detected';
      });

      const allFlags = allResults.flatMap(result => result.flags || []);

      return {
        isSafe: false,
        reason: reasons.join('; '),
        confidence: this.calculateAverageConfidence(allResults),
        flags: [...new Set(allFlags)],
        imageResults,
        videoResults
      };
    }

    // All ok.
    const allFlags = allResults.flatMap(result => result.flags || []);

    return {
      isSafe: true,
      reason: 'All content is safe',
      confidence: this.calculateAverageConfidence(allResults),
      flags: [...new Set(allFlags)],
      imageResults,
      videoResults
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
      console.error(`Error evaluating image:`, error);
      // Return safe by default if image analysis fails
      return {
        imageIndex: 0, // Default index
        isSafe: true,
        reason: 'Image analysis failed, defaulting to safe',
        confidence: 0.5
      };
    }
  }

  private async evaluateWithOpenAI(text: string): Promise<ModerationResult> {
    console.log('Sending request to OpenAI Moderation API:', {
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      apiUrl: this.openaiApiUrl
    });

    const response = await fetch(`${this.openaiApiUrl}/moderations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openaiApiKey}`
      },
      body: JSON.stringify({
        input: text,
        model: 'text-moderation-latest'
      })
    });

    console.log('OpenAI Moderation API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI Moderation API error response:', errorText);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json() as OpenAIResponse;
    console.log('OpenAI Moderation API response data:', JSON.stringify(data, null, 2));

    const results = data.results[0];
    if (!results) {
      throw new Error('No results received from OpenAI Moderation API');
    }
    const categories = results.categories;
    const categoryScores = results.category_scores;

    const flags: string[] = [];
    let maxConfidence = 0;

    // Check each category
    Object.entries(categories).forEach(([category, flagged]) => {
      if (flagged) {
        flags.push(category);
        const score = categoryScores[category as keyof typeof categoryScores];
        if (score > maxConfidence) {
          maxConfidence = score;
        }
      }
    });

    return {
      isSafe: flags.length === 0,
      confidence: maxConfidence,
      flags,
      reason: flags.length > 0 ? `Content flagged for: ${flags.join(', ')}` : 'Content is safe'
    };
  }
}