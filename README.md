# Content Moderation API

A production-ready Fastify-based API service for content moderation using OpenAI API. This service provides comprehensive content analysis including text, image, and video moderation with integration to X (Twitter) for posting approved content.

## Features

- **Multi-Modal Content Moderation**: Text, image, and video analysis
- **OpenAI Integration**: Uses OpenAI's Moderation API, Vision API, and Whisper API
- **X (Twitter) Integration**: Post approved content directly to X
- **Video Pre-moderation**: Frame extraction and audio transcription analysis
- **Rate Limiting**: Built-in rate limiting for API protection
- **Docker Support**: Containerized deployment
- **TypeScript**: Full type safety throughout the codebase
- **Comprehensive Testing**: Unit and integration tests with mocking

## API Endpoints

### POST `/api/v1/moderate`
Moderate text, images, and videos.

**Request Body:**
```json
{
  "text": "Content to moderate",
  "images": [
    {
      "url": "https://example.com/image.jpg"
    }
  ],
  "videos": [
    {
      "url": "https://example.com/video.mp4"
    }
  ]
}
```

**Response:**
```json
{
  "result": "ok",
  "confidence": 0.95,
  "flags": [],
  "imageResults": [...],
  "videoResults": [...]
}
```

### POST `/api/v1/x-post`
Post content to X (Twitter) after moderation.

**Request Body:**
```json
{
  "text": "Content to post",
  "images": [...]
}
```

### GET `/health`
Health check endpoint.

## Environment Variables

```bash
# Server Configuration
PORT=8000
HOST=0.0.0.0
NODE_ENV=development

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_API_URL=https://api.openai.com/v1
OPENAI_VISION_MODEL=gpt-4o

# AI Provider
AI_PROVIDER=openai

# Twitter API Configuration
TWITTER_BEARER_TOKEN=your_twitter_bearer_token
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_ACCESS_TOKEN=your_twitter_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_twitter_access_token_secret

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_TIME_WINDOW=60000
```

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd content-moderation-api
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env
# Edit .env with your API keys
```

4. Build the project:
```bash
npm run build
```

## Development

Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:8000`.

## Docker

Build and run with Docker Compose:
```bash
docker-compose up --build
```

## Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Video Moderation

The service supports comprehensive video moderation:

1. **Frame Extraction**: Extracts frames at regular intervals for image analysis
2. **Audio Transcription**: Uses OpenAI Whisper API to transcribe audio content
3. **Combined Analysis**: Aggregates results from visual and audio analysis

### Requirements

- FFmpeg must be installed for video processing
- OpenAI API key with access to Vision and Whisper APIs

### Example Video Moderation Request

```bash
curl -X POST http://localhost:8000/api/v1/moderate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Video description",
    "videos": [
      {
        "url": "https://example.com/video.mp4"
      }
    ]
  }'
```

## Architecture

The service uses a modular architecture with:

- **Fastify Plugins**: Modular functionality (moderation, rate limiting, X API)
- **Services**: Business logic encapsulation (ModerationService, XApiService)
- **Utils**: Utility classes for specific tasks (TextEvaluator, VideoAnalyzer)
- **Types**: TypeScript type definitions for API contracts

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

MIT License