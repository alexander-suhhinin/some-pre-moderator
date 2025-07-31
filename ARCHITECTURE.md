# Architecture Documentation

## Overview

This document describes the architecture of the Content Moderation API, a Fastify-based service that provides content moderation capabilities using OpenAI API and integrates with X (Twitter) for posting approved content.

## Core Components

### 1. Server (`src/server.ts`)
- Main Fastify server instance
- Plugin registration and route handling
- Global service decoration

### 2. Plugins

#### Moderation Plugin (`src/plugins/moderation.ts`)
- Registers ModerationService as a Fastify decoration
- Provides moderation capabilities to routes
- Handles service availability checks

#### Rate Limit Plugin (`src/plugins/rate-limit.ts`)
- Implements IP-based rate limiting
- Configurable limits via environment variables
- Uses `@fastify/rate-limit`

#### X API Plugin (`src/plugins/xApi.ts`)
- Registers XApiService for Twitter integration
- Handles credential validation
- Provides fallback mock service for testing

### 3. Services

#### ModerationService (`src/services/moderationService.ts`)
- Singleton service for content moderation
- Orchestrates text, image, and video analysis
- Uses TextEvaluator for OpenAI integration

#### XApiService (`src/services/xApiService.ts`)
- Handles Twitter API interactions
- Supports OAuth 1.0a authentication
- Manages media uploads and tweet posting

### 4. Utils

#### TextEvaluator (`src/utils/evaluateText.ts`)
- Evaluates text content using OpenAI Moderation API
- Analyzes images using OpenAI Vision API
- Combines results from multiple content types

#### VideoAnalyzer (`src/utils/videoAnalyzer.ts`)
- Processes video content for moderation
- Extracts frames for image analysis
- Transcribes audio using OpenAI Whisper API

### 5. Routes

#### Moderation Route (`src/routes/moderate.ts`)
- Handles `/api/v1/moderate` endpoint
- Processes text, image, and video moderation requests
- Returns comprehensive moderation results

#### X Post Route (`src/routes/x-post.ts`)
- Handles `/api/v1/x-post` endpoint
- Posts content to X after moderation
- Integrates with ModerationService and XApiService

#### Health Route (`src/routes/health.ts`)
- Provides health check endpoint
- Returns service status information

## Data Flow

### Content Moderation Flow

1. **Request Reception**: Route receives moderation request
2. **Service Validation**: Checks ModerationService availability
3. **Content Processing**:
   - Text: Direct OpenAI Moderation API call
   - Images: OpenAI Vision API analysis
   - Videos: Frame extraction + audio transcription
4. **Result Aggregation**: Combines all analysis results
5. **Response**: Returns comprehensive moderation report

### X Posting Flow

1. **Request Reception**: Route receives X post request
2. **Moderation Check**: Validates content through ModerationService
3. **Service Validation**: Checks XApiService availability
4. **Content Posting**: Posts approved content to X
5. **Response**: Returns posting result with moderation details

## Configuration

### Environment Variables

```bash
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

## Testing Strategy

### Unit Tests
- Service layer testing with mocked dependencies
- Utility class testing with isolated functionality
- Plugin testing with Fastify instance mocking

### Integration Tests
- End-to-end API testing
- Service integration testing
- Error handling validation

### Mock Strategy
- OpenAI API responses mocked for consistent testing
- Twitter API responses mocked for isolated testing
- External service failures simulated

## Error Handling

### Service Level
- Graceful degradation when services unavailable
- Comprehensive error logging
- User-friendly error messages

### Route Level
- Input validation with Fastify schemas
- HTTP status code mapping
- Error response standardization

## Performance Considerations

### Rate Limiting
- IP-based rate limiting prevents abuse
- Configurable limits for different environments
- Graceful handling of limit exceeded scenarios

### Video Processing
- Asynchronous video analysis
- Temporary file cleanup
- Memory-efficient frame extraction

### Caching
- Service instance caching (Singleton pattern)
- API response caching where appropriate
- Resource cleanup after processing

## Security

### API Key Management
- Environment variable configuration
- No hardcoded credentials
- Secure credential validation

### Input Validation
- Request schema validation
- Content type verification
- Size limits enforcement

### Error Information
- Sanitized error messages
- No sensitive data in logs
- Secure error handling

## Deployment

### Docker Support
- Multi-stage Dockerfile
- FFmpeg installation in container
- Environment variable configuration

### Health Checks
- Built-in health endpoint
- Service availability monitoring
- Graceful shutdown handling

## Monitoring and Logging

### Structured Logging
- JSON format logging
- Request/response correlation
- Performance metrics

### Error Tracking
- Comprehensive error logging
- Stack trace preservation
- Error categorization

This architecture provides a scalable, maintainable, and secure foundation for content moderation services with comprehensive testing and monitoring capabilities.