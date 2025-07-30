import { VideoData, VideoModerationResult, ImageModerationResult, ModerationResult, ImageData } from '../types';
import ffmpeg from 'fluent-ffmpeg';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

export class VideoAnalyzer {
  private openai: any;
  private perspectiveApiKey: string;
  private perspectiveApiUrl: string;
  private aiProvider: 'openai' | 'perspective';

  constructor() {
    this.perspectiveApiKey = process.env.PERSPECTIVE_API_KEY || '';
    this.perspectiveApiUrl = process.env.PERSPECTIVE_API_URL || 'https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze';
    this.aiProvider = (process.env.AI_PROVIDER as 'openai' | 'perspective') || 'openai';

    if (this.aiProvider === 'openai') {
      const { OpenAI } = require('openai');
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  async analyzeVideo(video: VideoData, index: number): Promise<VideoModerationResult> {
    try {
      // Download video once and use for all operations
      const videoPath = await this.saveVideoToTemp(video);

      try {
        const frames = await this.extractFrames(videoPath, video);
        const audioTranscription = await this.extractAudio(videoPath);

        const frameResults: ImageModerationResult[] = [];
        for (let i = 0; i < frames.length; i++) {
          const frame = frames[i];
          if (frame) {
            const frameResult = await this.evaluateImage(frame, i);
            frameResults.push(frameResult);
          }
        }

        let audioModerationResult: ModerationResult | undefined;

        if (audioTranscription) {
          audioModerationResult = await this.evaluateText(audioTranscription);
        }

              const unsafeFrames = frameResults.filter(frame => !frame.isSafe);
        const isSafe = unsafeFrames.length === 0 && (!audioModerationResult || audioModerationResult.isSafe);

        const flags = [
          ...frameResults.flatMap(frame => frame.flags || []),
          ...(audioModerationResult?.flags || [])
        ].filter(Boolean) as string[];

        const confidence = this.calculateConfidence(frameResults, audioModerationResult);

        const result: VideoModerationResult = {
          videoIndex: index,
          isSafe,
          reason: this.generateReason(unsafeFrames, audioModerationResult),
          confidence,
          flags: [...new Set(flags)], // Remove duplicates
          frameResults,
          metadata: {
            duration: video.duration || 0,
            frameCount: frames.length,
            resolution: video.resolution ? `${video.resolution.width}x${video.resolution.height}` : 'unknown',
            size: video.size || 0
          }
        };

        if (audioTranscription) {
          result.audioTranscription = audioTranscription;
        }

        if (audioModerationResult) {
          result.audioModerationResult = audioModerationResult;
        }

        return result;
      } finally {
        // Delete temporary video file
        await unlink(videoPath);
      }
    } catch (error) {
      console.error(`Error analyzing video ${index}:`, error);
      return {
        videoIndex: index,
        isSafe: true, // Default to safe on error
        reason: 'Video analysis failed, defaulting to safe',
        confidence: 0.5,
        flags: [],
        frameResults: [],
        metadata: {
          duration: video.duration || 0,
          frameCount: 0,
          resolution: 'unknown',
          size: video.size || 0
        }
      };
    }
  }

  private async extractFrames(videoPath: string, video: VideoData): Promise<ImageData[]> {
    const frames: ImageData[] = [];
    const tempDir = tmpdir();

    try {
      // Extract frames every 2 seconds
      const frameInterval = 2;
      const duration = video.duration || 10;
      const frameCount = Math.min(Math.ceil(duration / frameInterval), 10); // Maximum 10 frames

      for (let i = 0; i < frameCount; i++) {
        const timestamp = i * frameInterval;
        const framePath = join(tempDir, `frame_${i}.jpg`);

        await this.extractFrame(videoPath, framePath, timestamp);
        const frameData = await this.readFrameAsBase64(framePath);

        frames.push({
          base64: frameData,
          contentType: 'image/jpeg'
        });

        // Delete temporary frame file
        await unlink(framePath);
      }
    } catch (error) {
      console.error('Error extracting frames:', error);
      throw error;
    }

    return frames;
  }

  /**
   * Extracts audio and transcribes it
   */
  private async extractAudio(videoPath: string): Promise<string | null> {
    try {
      const tempDir = tmpdir();
      const audioPath = join(tempDir, 'audio.wav');

      try {
        // Extract audio
        await this.extractAudioFromVideo(videoPath, audioPath);

        // Transcribe audio using OpenAI Whisper
        const transcription = await this.transcribeAudio(audioPath);

        return transcription;
      } finally {
        // Delete temporary audio file
        await unlink(audioPath);
      }
    } catch (error) {
      console.error('Error extracting audio:', error);
      return null;
    }
  }

  /**
   * Saves video to a temporary file
   */
  private async saveVideoToTemp(video: VideoData): Promise<string> {
    const tempDir = tmpdir();
    const videoPath = join(tempDir, `video_${Date.now()}.mp4`);

    try {
      if (video.base64) {
        console.log(`Saving base64 video to ${videoPath}`);
        const buffer = Buffer.from(video.base64, 'base64');
        await writeFile(videoPath, buffer);
        console.log(`Base64 video saved successfully, size: ${buffer.length} bytes`);
      } else if (video.url) {
        console.log(`Downloading video from URL: ${video.url}`);
        const response = await fetch(video.url);

        if (!response.ok) {
          throw new Error(`Failed to download video: ${response.status} ${response.statusText}`);
        }

        const buffer = await response.arrayBuffer();
        await writeFile(videoPath, Buffer.from(buffer));
        console.log(`Video downloaded successfully, size: ${buffer.byteLength} bytes`);
      } else {
        throw new Error('No video data provided (neither base64 nor url)');
      }

      // Check that the file was actually created
      const fs = await import('fs/promises');
      const stats = await fs.stat(videoPath);
      console.log(`Video file created: ${videoPath}, size: ${stats.size} bytes`);

      return videoPath;
    } catch (error) {
      console.error('Error saving video to temp:', error);
      throw error;
    }
  }

  /**
   * Extracts a frame from video at a specific timestamp
   */
  private extractFrame(videoPath: string, outputPath: string, timestamp: number): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // Check that the input file exists
        const fs = await import('fs/promises');
        await fs.access(videoPath);
        console.log(`Extracting frame at ${timestamp}s from: ${videoPath}`);

        ffmpeg(videoPath)
          .seekInput(timestamp)
          .frames(1)
          .output(outputPath)
          .on('end', () => {
            console.log(`Frame extracted successfully to: ${outputPath}`);
            resolve();
          })
          .on('error', (err) => {
            console.error(`FFmpeg error extracting frame:`, err);
            reject(err);
          })
          .run();
      } catch (error) {
        console.error(`Error accessing video file: ${videoPath}`, error);
        reject(error);
      }
    });
  }

  /**
   * Extracts audio from video
   */
  private extractAudioFromVideo(videoPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .outputOptions('-vn') // No video
        .outputOptions('-acodec', 'pcm_s16le') // PCM audio
        .outputOptions('-ar', '16000') // 16kHz sample rate
        .outputOptions('-ac', '1') // Mono
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', reject)
        .run();
    });
  }

  /**
   * Transcribes audio using OpenAI Whisper
   */
  private async transcribeAudio(audioPath: string): Promise<string> {
    try {
      const { OpenAI } = await import('openai');
      const { createReadStream, statSync } = await import('fs');
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // Get audio file size
      const audioStats = statSync(audioPath);
      console.log(`🎵 OpenAI Whisper API Request:`, {
        model: 'whisper-1',
        audioPath,
        audioSize: `${Math.round(audioStats.size / 1024)}KB`
      });

      // Create file read stream
      const transcription = await openai.audio.transcriptions.create({
        file: createReadStream(audioPath),
        model: 'whisper-1',
      });

      console.log(`✅ OpenAI Whisper API Response:`, {
        model: 'whisper-1',
        transcriptionLength: transcription.text.length,
        transcription: transcription.text.substring(0, 100) + (transcription.text.length > 100 ? '...' : '')
      });

      return transcription.text;
    } catch (error) {
      console.error('❌ Error transcribing audio:', error);
      return '';
    }
  }

  /**
   * Evaluates image for inappropriate content
   */
  private async evaluateImage(image: ImageData, index: number): Promise<ImageModerationResult> {
    try {
      const visionModel = process.env.OPENAI_VISION_MODEL || 'gpt-4o';

      const requestPayload = {
        model: visionModel,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this image for inappropriate content. Return a JSON response with: {"isSafe": boolean, "reason": string, "confidence": number, "flags": string[]}. Check for: violence, hate speech, adult content, self-harm, or other harmful content.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: image.url || `data:${image.contentType};base64,${image.base64}`
                }
              }
            ]
          }
        ],
        max_tokens: 500
      };

      console.log(`🔍 OpenAI Vision API Request for frame ${index}:`, {
        model: visionModel,
        imageType: image.url ? 'url' : 'base64',
        imageSize: image.base64 ? `${Math.round(image.base64.length / 1024)}KB` : 'unknown'
      });

      const response = await this.openai.chat.completions.create(requestPayload);

      console.log(`✅ OpenAI Vision API Response for frame ${index}:`, {
        model: response.model,
        usage: response.usage,
        contentLength: response.choices[0]?.message?.content?.length || 0
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response content from OpenAI Vision API');
      }

      console.log(`📝 Raw OpenAI response for frame ${index}:`, content);

      // Пытаемся извлечь JSON из ответа
      let jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (!jsonMatch) {
        jsonMatch = content.match(/\{[\s\S]*\}/);
      }

      if (!jsonMatch) {
        throw new Error('Could not extract JSON from response');
      }

      const result = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      console.log(`🎯 Parsed result for frame ${index}:`, result);

      return {
        imageIndex: index,
        isSafe: result.isSafe !== false,
        reason: result.reason || 'Image analysis completed',
        confidence: result.confidence || 0.8,
        flags: result.flags || []
      };
    } catch (error) {
      console.error(`❌ Error evaluating image ${index}:`, error);
      return {
        imageIndex: index,
        isSafe: true,
        reason: 'Image evaluation failed, defaulting to safe',
        confidence: 0.5,
        flags: ['evaluation_error']
      };
    }
  }

  /**
   * Evaluates text for inappropriate content
   */
  private async evaluateText(text: string): Promise<ModerationResult> {
    try {
      if (this.aiProvider === 'openai') {
        return await this.evaluateWithOpenAI(text);
      } else {
        return await this.evaluateWithPerspective(text);
      }
    } catch (error) {
      console.error('Error evaluating text:', error);
      return {
        isSafe: true,
        reason: 'Text evaluation failed, defaulting to safe',
        confidence: 0.5,
        flags: ['evaluation_error']
      };
    }
  }

  /**
   * Evaluates text using OpenAI
   */
  private async evaluateWithOpenAI(text: string): Promise<ModerationResult> {
    console.log(`🔍 OpenAI Moderation API Request:`, {
      textLength: text.length,
      textPreview: text.substring(0, 100) + (text.length > 100 ? '...' : '')
    });

    const response = await this.openai.moderations.create({
      input: text
    });

    console.log(`✅ OpenAI Moderation API Response:`, {
      flagged: response.results[0]?.flagged,
      categories: response.results[0]?.categories,
      categoryScores: response.results[0]?.category_scores
    });

    const result = response.results[0];
    if (!result) {
      throw new Error('No moderation result from OpenAI');
    }

    const categories = result.categories;
    const categoryScores = result.category_scores;

    const flags: string[] = [];
    let primaryReason: string | undefined;

    // Check categories
    if (categories.hate) {
      flags.push('hate');
      if (!primaryReason) primaryReason = 'hate speech';
    }
    if (categories['hate/threatening']) {
      flags.push('hate_threatening');
      if (!primaryReason) primaryReason = 'threatening hate speech';
    }
    if (categories['self-harm']) {
      flags.push('self_harm');
      if (!primaryReason) primaryReason = 'self-harm content';
    }
    if (categories.sexual) {
      flags.push('sexual');
      if (!primaryReason) primaryReason = 'sexual content';
    }
    if (categories['sexual/minors']) {
      flags.push('sexual_minors');
      if (!primaryReason) primaryReason = 'sexual content involving minors';
    }
    if (categories.violence) {
      flags.push('violence');
      if (!primaryReason) primaryReason = 'violent content';
    }
    if (categories['violence/graphic']) {
      flags.push('violence_graphic');
      if (!primaryReason) primaryReason = 'graphic violence';
    }

    const isSafe = !result.flagged;
    const confidence = Math.max(...Object.values(categoryScores).map(score => Number(score) || 0));

    const moderationResult = {
      isSafe,
      reason: primaryReason || (isSafe ? 'Content is safe' : 'Content flagged as inappropriate'),
      confidence,
      flags
    };

    console.log(`🎯 OpenAI Moderation Result:`, moderationResult);

    return moderationResult;
  }

  /**
   * Evaluates text using Perspective API
   */
  private async evaluateWithPerspective(text: string): Promise<ModerationResult> {
    const response = await fetch(this.perspectiveApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        comment: { text },
        languages: ['en'],
        requestedAttributes: {
          TOXICITY: {},
          SEVERE_TOXICITY: {},
          IDENTITY_ATTACK: {},
          THREAT: {},
          SEXUALLY_EXPLICIT: {}
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Perspective API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as any;
    const attributes = data.attributeScores;

    const flags: string[] = [];
    let primaryReason: string | undefined;
    let maxScore = 0;

    // Check attributes
    if (attributes.TOXICITY?.summaryScore?.value > 0.7) {
      flags.push('toxicity');
      if (attributes.TOXICITY.summaryScore.value > maxScore) {
        maxScore = attributes.TOXICITY.summaryScore.value;
        primaryReason = 'toxic content';
      }
    }
    if (attributes.SEVERE_TOXICITY?.summaryScore?.value > 0.7) {
      flags.push('severe_toxicity');
      if (attributes.SEVERE_TOXICITY.summaryScore.value > maxScore) {
        maxScore = attributes.SEVERE_TOXICITY.summaryScore.value;
        primaryReason = 'severely toxic content';
      }
    }
    if (attributes.IDENTITY_ATTACK?.summaryScore?.value > 0.7) {
      flags.push('identity_attack');
      if (attributes.IDENTITY_ATTACK.summaryScore.value > maxScore) {
        maxScore = attributes.IDENTITY_ATTACK.summaryScore.value;
        primaryReason = 'identity attack';
      }
    }
    if (attributes.THREAT?.summaryScore?.value > 0.7) {
      flags.push('threat');
      if (attributes.THREAT.summaryScore.value > maxScore) {
        maxScore = attributes.THREAT.summaryScore.value;
        primaryReason = 'threatening content';
      }
    }
    if (attributes.SEXUALLY_EXPLICIT?.summaryScore?.value > 0.7) {
      flags.push('sexually_explicit');
      if (attributes.SEXUALLY_EXPLICIT.summaryScore.value > maxScore) {
        maxScore = attributes.SEXUALLY_EXPLICIT.summaryScore.value;
        primaryReason = 'sexually explicit content';
      }
    }

    const isSafe = flags.length === 0;

    return {
      isSafe,
      reason: primaryReason || (isSafe ? 'Content is safe' : 'Content flagged as inappropriate'),
      confidence: maxScore || 0.5,
      flags
    };
  }

  /**
   * Reads frame as base64
   */
  private async readFrameAsBase64(framePath: string): Promise<string> {
    const fs = await import('fs/promises');
    const buffer = await fs.readFile(framePath);
    return buffer.toString('base64');
  }

  /**
   * Calculates overall confidence score
   */
  private calculateConfidence(frameResults: ImageModerationResult[], audioResult?: ModerationResult): number {
    const frameConfidences = frameResults.map(frame => frame.confidence || 1.0);
    const audioConfidence = audioResult?.confidence || 1.0;

    const allConfidences = [...frameConfidences, audioConfidence];
    return allConfidences.reduce((sum, conf) => (sum || 0) + (conf || 0), 0) / allConfidences.length;
  }

  /**
   * Generates reason for moderation result
   */
  private generateReason(unsafeFrames: ImageModerationResult[], audioResult?: ModerationResult): string {
    const reasons = [];

    if (unsafeFrames.length > 0) {
      reasons.push(`${unsafeFrames.length} unsafe frames detected`);
    }

    if (audioResult && !audioResult.isSafe) {
      reasons.push(`Audio content: ${audioResult.reason}`);
    }

    if (reasons.length === 0) {
      return 'Video content is safe';
    }

    return reasons.join('; ');
  }
}