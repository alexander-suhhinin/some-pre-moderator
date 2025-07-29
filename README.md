# Content Moderation API

A production-ready Fastify-based API service for filtering problematic content before posting to social media. The service uses AI-powered content moderation through OpenAI's Moderation API and Google's Perspective API.

## Features

- 🚀 **Fastify-based** - High-performance Node.js web framework
- 🤖 **AI-Powered Moderation** - Support for OpenAI and Perspective API
- 🖼️ **Image Moderation** - Analyze images for inappropriate content using OpenAI Vision API
- 🐦 **X (Twitter) Integration** - Post content to X with automatic moderation (Production-ready with real Twitter API)
- 🔄 **API Switching** - Easy switching between AI providers
- 🛡️ **Rate Limiting** - IP-based rate limiting with configurable limits
- 📊 **Structured Logging** - JSON logging with timestamps
- 🐳 **Docker Ready** - Production-ready Docker container
- 🔒 **Security** - Helmet.js security headers and CORS protection
- 📝 **OpenAPI Schema** - Auto-generated API documentation
- 🏥 **Health Checks** - Built-in health monitoring endpoint

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- OpenAI API key (optional)
- Google Perspective API key (optional)

### Local Development

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd content-moderation-api
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env
   # Edit .env with your API keys and configuration
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Test the API:**
   ```bash
   curl -X POST http://localhost:3000/api/v1/moderate \
     -H "Content-Type: application/json" \
     -d '{"text": "Hello, this is a test message!"}'
   ```

### 🐦 **Twitter API Setup (Production)**

For real X (Twitter) posting functionality, see [Twitter API Setup Guide](TWITTER_API_SETUP.md).

**Quick setup:**
```bash
# Add Twitter API credentials to .env
TWITTER_BEARER_TOKEN=your_bearer_token
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret
```

### Docker Deployment

1. **Build the Docker image:**
   ```bash
   docker build -t content-moderation-api .
   ```

2. **Run the container:**
   ```bash
   docker run -p 3000:3000 \
     -e OPENAI_API_KEY=your_openai_key \
     -e AI_PROVIDER=openai \
     content-moderation-api
   ```

3. **Using Docker Compose:**
   ```bash
   docker-compose up -d
   ```

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | `3000` | No |
| `HOST` | Server host | `0.0.0.0` | No |
| `NODE_ENV` | Environment | `development` | No |
| `RATE_LIMIT_MAX` | Max requests per window | `10` | No |
| `RATE_LIMIT_TIME_WINDOW` | Time window in ms | `60000` | No |
| `AI_PROVIDER` | AI provider (`openai` or `perspective`) | `openai` | No |
| `OPENAI_API_KEY` | OpenAI API key | - | Yes (if using OpenAI) |
| `PERSPECTIVE_API_KEY` | Perspective API key | - | Yes (if using Perspective) |
| `TWITTER_BEARER_TOKEN` | Twitter Bearer Token | - | Yes (for X posting) |
| `TWITTER_API_KEY` | Twitter API Key | - | Yes (for X posting) |
| `TWITTER_API_SECRET` | Twitter API Secret | - | Yes (for X posting) |
| `TWITTER_ACCESS_TOKEN` | Twitter Access Token | - | Yes (for X posting) |
| `TWITTER_ACCESS_TOKEN_SECRET` | Twitter Access Token Secret | - | Yes (for X posting) |
| `LOG_LEVEL` | Logging level | `info` | No |
| `LOG_PRETTY_PRINT` | Pretty print logs | `true` | No |

### AI Provider Configuration

#### OpenAI
- Uses OpenAI's Moderation API
- Detects: hate speech, violence, sexual content, self-harm
- Set `AI_PROVIDER=openai` and provide `OPENAI_API_KEY`

#### Perspective API
- Uses Google's Perspective API
- Detects: toxicity, severe toxicity, identity attack, threat, sexually explicit content
- Set `AI_PROVIDER=perspective` and provide `PERSPECTIVE_API_KEY`

## API Documentation

### POST /api/v1/moderate

Moderate text and image content for inappropriate or harmful content.

**Request:**
```json
{
  "text": "Text content to be moderated",
  "images": [
    {
      "url": "https://example.com/image.jpg",
      "contentType": "image/jpeg"
    },
    {
      "base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
      "filename": "image.jpg",
      "contentType": "image/jpeg"
    }
  ]
}
```

**Response:**
```json
{
  "result": "ok" | "rejected",
  "reason": "string (optional)",
  "confidence": "number (optional)",
  "flags": ["string"] (optional),
  "imageResults": [
    {
      "imageIndex": 0,
      "isSafe": true,
      "reason": "string (optional)",
      "confidence": 0.95,
      "flags": ["string"],
      "detectedObjects": ["person", "car"],
      "adultContent": false,
      "violence": false,
      "hate": false
    }
  ]
}
```

**Example Requests:**

```bash
# Safe content
curl -X POST http://localhost:3000/api/v1/moderate \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello, how are you today?"}'

# Response: {"result": "ok"}

# Harmful content
curl -X POST http://localhost:3000/api/v1/moderate \
  -H "Content-Type: application/json" \
  -d '{"text": "I hate you and want to hurt you"}'

# Response: {"result": "rejected", "reason": "hate speech", "confidence": 0.95}
```

### POST /api/v1/x-post

Post content to X (Twitter) with automatic moderation. Content is moderated before posting, and only safe content is published.

**Request:**
```json
{
  "text": "Tweet content (max 280 characters)",
  "images": [
    {
      "url": "https://example.com/image.jpg",
      "contentType": "image/jpeg"
    }
  ],
  "replyTo": "1234567890123456789",
  "quoteTweet": "1234567890123456789"
}
```

**Response:**
```json
{
  "success": true,
  "tweetId": "1234567890123456789",
  "moderationResult": {
    "result": "ok",
    "confidence": 0.95,
    "flags": [],
    "imageResults": []
  }
}
```

### GET /health

Health check endpoint for monitoring.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2023-12-01T10:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

## Rate Limiting

- **Limit:** 10 requests per minute per IP address
- **Response:** 429 Too Many Requests when exceeded
- **Headers:** `X-RateLimit-*` headers included in responses
- **Exemptions:** Health check endpoint (`/health`)

## Logging

The API uses structured JSON logging with the following levels:
- `error` - Application errors
- `warn` - Rate limit exceeded, warnings
- `info` - Request processing, moderation results
- `debug` - Detailed debugging information

## Development

### Available Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run start        # Start production server
npm run test         # Run tests
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
```

### Project Structure

```
src/
├── routes/          # API route handlers
│   ├── moderate.ts  # Main moderation endpoint
│   └── health.ts    # Health check endpoint
├── plugins/         # Fastify plugins
│   └── rate-limit.ts # Rate limiting configuration
├── utils/           # Utility functions
│   └── evaluateText.ts # Text evaluation logic
├── types/           # TypeScript type definitions
│   └── index.ts
└── server.ts        # Main server file
```

## Security

- **Helmet.js** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - IP-based request limiting
- **Input Validation** - JSON schema validation
- **Error Handling** - Secure error responses
- **Docker Security** - Non-root user, minimal base image

## Monitoring

- **Health Check** - `/health` endpoint for load balancers
- **Structured Logging** - JSON logs for log aggregation
- **Error Tracking** - Comprehensive error logging
- **Performance** - Request timing and metrics

## Production Deployment

### Docker Compose Example

```yaml
version: '3.8'
services:
  content-moderation-api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - AI_PROVIDER=openai
      - LOG_LEVEL=info
      - LOG_PRETTY_PRINT=false
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Kubernetes Example

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: content-moderation-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: content-moderation-api
  template:
    metadata:
      labels:
        app: content-moderation-api
    spec:
      containers:
      - name: api
        image: content-moderation-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: api-secrets
              key: openai-api-key
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run linting and tests
6. Submit a pull request

## License

MIT License - see LICENSE file for details.