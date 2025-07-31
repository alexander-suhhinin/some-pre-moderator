# Content Moderation API

A production-ready Fastify-based API service for content moderation using OpenAI API, with support for text, image, and video moderation, plus Twitter (X) integration.

## Features

- **Text Moderation**: Real-time text content analysis using OpenAI Moderation API
- **Image Moderation**: Image analysis using OpenAI Vision API
- **Video Moderation**: Video frame extraction and analysis with audio transcription
- **Twitter Integration**: Post content to Twitter (X) with automatic moderation
- **Rate Limiting**: Built-in rate limiting with configurable limits
- **Health Monitoring**: Health check endpoints
- **Comprehensive Testing**: 131 tests with 66.76% code coverage
- **TypeScript**: Full TypeScript support with strict type checking
- **ESLint**: Code quality enforcement with ESLint

## Quick Start

### Prerequisites

- Node.js 18+
- FFmpeg (for video processing)
- OpenAI API key
- Twitter API credentials (optional)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd content-moderation-api

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your API keys
```

### Environment Variables

```bash
# Server Configuration
PORT=8000
HOST=0.0.0.0
NODE_ENV=development

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_API_URL=https://api.openai.com/v1

# Twitter API Configuration (optional)
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_ACCESS_TOKEN=your_twitter_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_twitter_access_token_secret
TWITTER_BEARER_TOKEN=your_twitter_bearer_token

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=900000
```

### Running the Application

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

## API Endpoints

### Health Check
```
GET /health
```

### Content Moderation
```
POST /api/v1/moderate
Content-Type: application/json

{
  "text": "Text to moderate",
  "images": ["https://example.com/image.jpg"],
  "videos": ["https://example.com/video.mp4"]
}
```

### Twitter Post
```
POST /api/v1/x-post
Content-Type: application/json

{
  "text": "Tweet content",
  "images": ["https://example.com/image.jpg"],
  "videos": ["https://example.com/video.mp4"]
}
```

## Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm start               # Start production server

# Testing
npm test                # Run all tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues
npm run type-check      # Run TypeScript type checking
```

### Testing

The project includes comprehensive tests:
- **131 total tests** with 66.76% code coverage
- Unit tests for services and utilities
- Integration tests for routes and plugins
- Mock implementations for external APIs

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage
```

## GitHub Actions

This project includes automated CI/CD with GitHub Actions that runs on every pull request and push to main branches.

### Workflow Features

- **Multi-Node Testing**: Tests against Node.js 18.x and 20.x
- **Linting**: ESLint code quality checks
- **Type Checking**: TypeScript compilation verification
- **Test Execution**: Full test suite with coverage
- **Caching**: npm dependency caching for faster builds

### Workflow Triggers

- Pull requests to `main`, `master`, or `develop` branches
- Direct pushes to `main`, `master`, or `develop` branches

### Workflow Steps

1. **Checkout**: Clone the repository
2. **Setup Node.js**: Install specified Node.js version
3. **Install Dependencies**: Run `npm ci` with caching
4. **Lint**: Run ESLint checks
5. **Type Check**: Verify TypeScript compilation
6. **Test**: Execute test suite
7. **Coverage Upload**: Upload coverage reports to Codecov (optional)

### Status Badge

Add this badge to your README:

```markdown
![CI](https://github.com/your-username/your-repo/workflows/CI%20-%20Lint%20%26%20Test/badge.svg)
```

## Docker

```bash
# Build image
docker build -t content-moderation-api .

# Run container
docker run -p 8000:8000 --env-file .env content-moderation-api
```

## Architecture

### Project Structure

```
src/
├── plugins/           # Fastify plugins
│   ├── moderation.ts  # Moderation service plugin
│   ├── rate-limit.ts  # Rate limiting plugin
│   └── xApi.ts        # Twitter API plugin
├── routes/            # API routes
│   ├── health.ts      # Health check endpoint
│   ├── moderate.ts    # Content moderation endpoint
│   └── x-post.ts      # Twitter posting endpoint
├── services/          # Business logic services
│   ├── moderationService.ts
│   └── xApiService.ts
├── utils/             # Utility functions
│   ├── evaluateText.ts
│   └── videoAnalyzer.ts
├── types/             # TypeScript type definitions
└── __mocks__/         # Test mocks
```

### Key Components

- **ModerationService**: Singleton service for content moderation
- **XApiService**: Twitter API integration with OAuth 1.0a
- **TextEvaluator**: OpenAI API integration for text/image analysis
- **VideoAnalyzer**: Video processing with FFmpeg integration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass: `npm test`
6. Run linting: `npm run lint`
7. Submit a pull request

## License

MIT License - see LICENSE file for details.