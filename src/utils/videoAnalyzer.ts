import { VideoData, VideoModerationResult, ImageModerationResult, ModerationResult, ImageData } from '../types';
import * as fs from 'fs';
import { writeFile, unlink } from 'fs/promises';
import * as path from 'path';
import { join } from 'path';
import * as os from 'os';
import { tmpdir } from 'os';
import * as https from 'https';
import * as http from 'http';
import ffmpeg from 'fluent-ffmpeg';
import OpenAI from 'openai';

export class VideoAnalyzer {
  private openaiApiKey: string;
  private openaiApiUrl: string;
  private aiProvider: 'openai';

  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY || '';
    this.openaiApiUrl = process.env.OPENAI_API_URL || 'https://api.openai.com/v1';
    this.aiProvider = 'openai';
  }

  /**
   * Analyzes video content for moderation
   * @param video Video data to analyze
   * @param index Video index for result tracking
   * @returns VideoModerationResult with analysis results
   */
  async analyzeVideo(video: VideoData, index: number): Promise<VideoModerationResult> {
    console.log(`🎬 Starting video analysis for video ${index}`);

    let videoPath: string | undefined;
    let audioPath: string | undefined;

    try {
      // Download video to temporary file
      videoPath = await this.saveVideoToTemp(video);
      console.log(`📥 Video downloaded to: ${videoPath}`);

      // Extract frames for analysis
      const frameResults = await this.extractFrames(videoPath, index);
      console.log(`🖼️ Extracted ${frameResults.length} frames for analysis`);

      // Extract and transcribe audio
      const audioResult = await this.extractAudio(videoPath, index);
      console.log(`🎵 Audio extracted and transcribed`);

      // Get video metadata
      const metadata = await this.getVideoMetadata(videoPath);

      // Combine results - only use frame results for confidence calculation
      const allResults = [...frameResults];

      // Calculate overall confidence and flags
      const confidence = this.calculateAverageConfidence(allResults);
      const flags = this.combineFlags(allResults);

      const isSafe = flags.length === 0;
      const reason = isSafe ? 'Video content is safe' : `Video flagged for: ${flags.join(', ')}`;

      return {
        videoIndex: index,
        isSafe,
        reason,
        confidence,
        flags,
        frameResults,
        audioTranscription: audioResult.audioTranscription,
        audioModerationResult: audioResult.audioModerationResult,
        metadata
      };

    } catch (error) {
      console.error(`❌ Error analyzing video ${index}:`, error);

      return {
        videoIndex: index,
        isSafe: true, // Default to safe on error
        reason: 'Video analysis failed, defaulting to safe',
        confidence: 0.5,
        flags: ['analysis_error'],
        frameResults: [],
        metadata: {
          duration: 0,
          frameCount: 0,
          resolution: 'unknown',
          size: 0
        }
      };
    } finally {
      // Clean up temporary files
      if (videoPath) {
        try {
          await unlink(videoPath);
          console.log(`🧹 Cleaned up video file: ${videoPath}`);
        } catch (error) {
          console.error(`❌ Error cleaning up video file: ${error}`);
        }
      }
      if (audioPath) {
        try {
          await unlink(audioPath);
          console.log(`🧹 Cleaned up audio file: ${audioPath}`);
        } catch (error) {
          console.error(`❌ Error cleaning up audio file: ${error}`);
        }
      }
    }
  }

  /**
   * Downloads video to temporary file
   */
  private async saveVideoToTemp(video: VideoData): Promise<string> {
    const tempDir = tmpdir();
    const filename = `video_${Date.now()}.mp4`;
    const filepath = join(tempDir, filename);

    if (video.base64) {
      // Handle base64 video
      const buffer = Buffer.from(video.base64, 'base64');
      await writeFile(filepath, buffer);
    } else if (video.url) {
      // Download from URL
      await this.downloadFile(video.url, filepath);
    } else {
      throw new Error('No video data provided (neither URL nor base64)');
    }

    return filepath;
  }

  /**
   * Downloads file from URL
   */
  private async downloadFile(url: string, filepath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https:') ? https : http;

      const file = fs.createWriteStream(filepath);

      protocol.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download file: ${response.statusCode}`));
          return;
        }

        response.pipe(file);

        file.on('finish', () => {
          file.close();
          resolve();
        });

        file.on('error', (err) => {
          fs.unlink(filepath, () => {}); // Delete file on error
          reject(err);
        });
      }).on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Extracts frames from video for analysis
   */
  private async extractFrames(videoPath: string, videoIndex: number): Promise<ImageModerationResult[]> {
    return new Promise((resolve, reject) => {
      const tempDir = tmpdir();
      const frameResults: ImageModerationResult[] = [];
      let frameCount = 0;
      const maxFrames = 10; // Maximum frames to extract
      const frameInterval = 2; // Extract frame every 2 seconds

      ffmpeg(videoPath)
        .on('end', async () => {
          console.log(`✅ Frame extraction completed. Extracted ${frameCount} frames`);

          // Analyze each frame
          for (let i = 0; i < frameCount && i < maxFrames; i++) {
            const framePath = join(tempDir, `frame_${videoIndex}_${i}.jpg`);

            try {
              const frameResult = await this.evaluateImage({
                url: `file://${framePath}`,
                contentType: 'image/jpeg'
              }, i);

              frameResults.push(frameResult);

              // Clean up frame file
              await unlink(framePath);
            } catch (error) {
              console.error(`❌ Error analyzing frame ${i}:`, error);
              frameResults.push({
                imageIndex: i,
                isSafe: true,
                reason: 'Frame analysis failed, defaulting to safe',
                confidence: 0.5,
                flags: ['frame_analysis_error']
              });
            }
          }

          resolve(frameResults);
        })
        .on('error', (err) => {
          console.error(`❌ Error extracting frames:`, err);
          reject(err);
        })
        .screenshots({
          count: maxFrames,
          folder: tempDir,
          filename: `frame_${videoIndex}_%i.jpg`,
          size: '640x480'
        });
    });
  }

  /**
   * Extracts audio from video and transcribes it
   */
  private async extractAudio(videoPath: string, videoIndex: number): Promise<{
    audioTranscription: string | null;
    audioModerationResult: ModerationResult | null;
  }> {
    return new Promise((resolve, reject) => {
      const tempDir = tmpdir();
      const audioPath = join(tempDir, `audio_${videoIndex}.mp3`);

      ffmpeg(videoPath)
        .on('end', async () => {
          console.log(`✅ Audio extraction completed: ${audioPath}`);

          try {
            // Transcribe audio
            const transcription = await this.transcribeAudio(audioPath);

            // Moderate transcribed text
            let audioModerationResult: ModerationResult | null = null;
            if (transcription) {
              audioModerationResult = await this.evaluateText(transcription);
            }

            resolve({
              audioTranscription: transcription,
              audioModerationResult
            });
          } catch (error) {
            console.error(`❌ Error processing audio:`, error);
            resolve({
              audioTranscription: null,
              audioModerationResult: null
            });
          } finally {
            // Clean up audio file
            try {
              await unlink(audioPath);
            } catch (error) {
              console.error(`❌ Error cleaning up audio file:`, error);
            }
          }
        })
        .on('error', (err) => {
          console.error(`❌ Error extracting audio:`, err);
          reject(err);
        })
        .audioCodec('mp3')
        .audioChannels(1)
        .audioFrequency(16000)
        .save(audioPath);
    });
  }

  /**
   * Transcribes audio using OpenAI Whisper API
   */
  private async transcribeAudio(audioPath: string): Promise<string | null> {
    try {
      const openai = new OpenAI({
        apiKey: this.openaiApiKey,
      });

      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(audioPath),
        model: 'whisper-1',
        language: 'en'
      });

      return transcription.text;
    } catch (error) {
      console.error(`❌ Error transcribing audio:`, error);
      return null;
    }
  }

  /**
   * Gets video metadata using FFmpeg
   */
  private async getVideoMetadata(videoPath: string): Promise<{
    duration: number;
    frameCount: number;
    resolution: string;
    size: number;
  }> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          console.error(`❌ Error getting video metadata:`, err);
          resolve({
            duration: 0,
            frameCount: 0,
            resolution: 'unknown',
            size: 0
          });
          return;
        }

        const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
        const duration = metadata.format.duration || 0;
        const size = metadata.format.size || 0;

        let resolution = 'unknown';
        if (videoStream && videoStream.width && videoStream.height) {
          resolution = `${videoStream.width}x${videoStream.height}`;
        }

        resolve({
          duration: Math.round(duration),
          frameCount: Math.round(duration * 30), // Estimate frame count
          resolution,
          size: parseInt(size.toString())
        });
      });
    });
  }

  /**
   * Evaluates image using OpenAI Vision API
   */
  public async evaluateImage(image: ImageData, index: number): Promise<ImageModerationResult> {
    try {
      const visionModel = process.env.OPENAI_VISION_MODEL || 'gpt-4o';
      const openai = new OpenAI({
        apiKey: this.openaiApiKey,
      });

      const analysis = await openai.chat.completions.create({
        model: visionModel,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this image for inappropriate content. Return a JSON response with: {"isSafe": boolean, "reason": string, "confidence": number, "flags": string[]}'
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
        max_tokens: 500,
        temperature: 0.1
      });

      const responseText = analysis.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error('No response from OpenAI Vision API');
      }

      let analysisResult;
      try {
        analysisResult = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', responseText);
        throw new Error('Invalid JSON response from OpenAI Vision API');
      }

      return {
        imageIndex: index,
        isSafe: analysisResult.isSafe || false,
        reason: analysisResult.reason || 'Image analyzed',
        confidence: analysisResult.confidence || 0.5,
        flags: analysisResult.flags || []
      };
    } catch (error) {
      console.error(`❌ Error evaluating image:`, error);
      return {
        imageIndex: index,
        isSafe: true,
        reason: 'Image analysis failed, defaulting to safe',
        confidence: 0.5,
        flags: ['analysis_error']
      };
    }
  }

  /**
   * Evaluates text using OpenAI Moderation API
   */
  private async evaluateText(text: string): Promise<ModerationResult> {
    if (this.aiProvider === 'openai') {
      return await this.evaluateWithOpenAI(text);
    }

    throw new Error(`Unsupported AI provider: ${this.aiProvider}`);
  }

  /**
   * Evaluates text using OpenAI Moderation API
   */
  private async evaluateWithOpenAI(text: string): Promise<ModerationResult> {
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

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as any;
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

  /**
   * Calculates average confidence from multiple results
   */
  private calculateAverageConfidence(results: (ModerationResult | ImageModerationResult)[]): number {
    if (results.length === 0) return 0;

    const totalConfidence = results.reduce((sum, result) => {
      return sum + (result.confidence || 0);
    }, 0);

    return totalConfidence / results.length;
  }

  /**
   * Combines flags from multiple results
   */
  private combineFlags(results: (ModerationResult | ImageModerationResult)[]): string[] {
    const allFlags = results.flatMap(result => result.flags || []);
    return [...new Set(allFlags)]; // Remove duplicates
  }
}