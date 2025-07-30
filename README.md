# Content Moderation API

A production-ready Fastify-based API service for content moderation using TypeScript, with support for text, images, and video content.

## Features

- **Text Moderation**: Analyzes text content for safety and toxicity
- **Image Moderation**: Analyzes images for inappropriate content using OpenAI Vision API
- **Video Moderation**: Analyzes videos by extracting frames and audio for comprehensive content review
- **Multiple AI Providers**: Support for OpenAI and Google Perspective API
- **Rate Limiting**: IP-based rate limiting (10 requests/minute by default)
- **X (Twitter) Integration**: Post content to Twitter with automatic moderation
- **Comprehensive Logging**: Structured JSON logging with timestamps
- **Docker Support**: Complete containerization for easy deployment
- **TypeScript**: Full type safety and modern development experience

## Video Moderation Capabilities

The API can analyze video content through multiple approaches:

1. **Frame Analysis**: Extracts key frames from video (every 2 seconds, max 10 frames)
2. **Audio Transcription**: Uses OpenAI Whisper to transcribe audio content
3. **Content Analysis**: Analyzes both visual and audio content for inappropriate material
4. **Metadata Analysis**: Reviews video properties (duration, resolution, size)

### Supported Video Features

- **Format Support**: MP4, AVI, MOV, and other formats supported by FFmpeg
- **Frame Extraction**: Automatic key frame extraction for visual analysis
- **Audio Processing**: Audio extraction and transcription for text analysis
- **Comprehensive Results**: Detailed analysis results including confidence scores and flags

## API Endpoints

### POST /moderate

Moderates text, images, and video content.

**Request Body:**
```json
{
  "text": "Content to moderate",
  "images": [
    {
      "url": "https://example.com/image.jpg",
      "base64": "base64_encoded_image_data",
      "contentType": "image/jpeg"
    }
  ],
  "videos": [
    {
      "url": "https://example.com/video.mp4",
      "base64": "base64_encoded_video_data",
      "contentType": "video/mp4",
      "duration": 30,
      "frameRate": 30,
      "resolution": {
        "width": 1920,
        "height": 1080
      },
      "size": 10485760
    }
  ]
}
```

**Response:**
```json
{
  "result": "ok",
  "reason": "All content is safe",
  "confidence": 0.95,
  "flags": [],
  "imageResults": [
    {
      "imageIndex": 0,
      "isSafe": true,
      "reason": "Image content is appropriate",
      "confidence": 0.98,
      "flags": []
    }
  ],
  "videoResults": [
    {
      "videoIndex": 0,
      "isSafe": true,
      "reason": "Video content is safe",
      "confidence": 0.92,
      "flags": [],
      "frameResults": [
        {
          "imageIndex": 0,
          "isSafe": true,
          "reason": "Frame content is appropriate",
          "confidence": 0.95,
          "flags": []
        }
      ],
      "audioTranscription": "This is the transcribed audio content...",
      "metadata": {
        "duration": 30,
        "frameCount": 10,
        "resolution": "1920x1080",
        "size": 10485760
      }
    }
  ],
  "metadata": {
    "totalFrames": 11,
    "totalDuration": 30,
    "totalSize": 10485760
  }
}
```

### POST /x-post

Posts content to X (Twitter) with automatic moderation.

**Request Body:**
```json
{
  "text": "Tweet content",
  "images": [...],
  "videos": [...],
  "replyTo": "tweet_id_to_reply_to",
  "quoteTweet": "tweet_id_to_quote"
}
```

### GET /health

Health check endpoint.

## Environment Variables

```env
# API Keys
OPENAI_API_KEY=your_openai_api_key
PERSPECTIVE_API_KEY=your_perspective_api_key
OPENAI_VISION_MODEL=gpt-4o

# AI Provider (openai or perspective)
AI_PROVIDER=openai

# Rate Limiting
RATE_LIMIT_MAX=10
RATE_LIMIT_TIME_WINDOW=60000

# Twitter API (for X posting)
TWITTER_BEARER_TOKEN=your_twitter_bearer_token
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_ACCESS_TOKEN=your_twitter_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_twitter_access_token_secret

# Server Configuration
PORT=8000
HOST=0.0.0.0
```

## Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd content-moderation-api
```

2. **Install dependencies:**
```bash
npm install
```

3. **Install FFmpeg (required for video processing):**
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt update
sudo apt install ffmpeg

# Windows
# Download from https://ffmpeg.org/download.html
```

4. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your API keys
```

5. **Build the project:**
```bash
npm run build
```

6. **Start the server:**
```bash
npm start
```

## Development

```bash
# Start development server with hot reload
npm run dev

# Run tests
npm test

# Run linter
npm run lint
```

## Docker

```bash
# Build image
docker build -t content-moderation-api .

# Run container
docker run -p 8000:8000 --env-file .env content-moderation-api

# Using Docker Compose
docker-compose up -d
```

## Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:coverage
```

### API Testing with curl
```bash
# Test health endpoint
curl http://localhost:8000/health

# Test moderation
curl -X POST http://localhost:8000/api/v1/moderate \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world!"}'

# Test video moderation
./curl-simple-video-test.sh
```

### Examples
See `examples/` directory for usage examples.

## Architecture

The application follows a modular architecture with:

- **Plugins**: Rate limiting, moderation service, X API integration
- **Services**: ModerationService (Singleton), XApiService
- **Utils**: TextEvaluator, VideoAnalyzer
- **Routes**: API endpoints for moderation and X posting

See `ARCHITECTURE.md` for detailed architectural information.

## Production Features

- **Rate Limiting**: Prevents abuse with configurable limits
- **Error Handling**: Comprehensive error handling and logging
- **Health Checks**: Built-in health monitoring
- **Docker Support**: Production-ready containerization
- **Type Safety**: Full TypeScript coverage
- **Testing**: Unit and integration tests
- **Logging**: Structured JSON logging

## Video Processing Requirements

For video moderation to work properly, ensure:

1. **FFmpeg is installed** on the system
2. **Sufficient disk space** for temporary video processing
3. **Adequate memory** for video frame extraction
4. **Valid OpenAI API key** for audio transcription

## Limitations

- **Video Size**: Large videos may take longer to process
- **Frame Rate**: Maximum 10 frames extracted per video
- **Audio**: Only speech content is transcribed and analyzed
- **Formats**: Depends on FFmpeg support for video formats

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.