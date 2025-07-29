# Content Moderation API Usage Examples

## 🖼️ **Image Moderation**

### Example 1: Moderation with Image URL

```bash
curl -X POST http://localhost:3000/api/v1/moderate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Check out this beautiful landscape!",
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
        "contentType": "image/jpeg"
      }
    ]
  }'
```

**Response:**
```json
{
  "result": "ok",
  "confidence": 0.95,
  "imageResults": [
    {
      "imageIndex": 0,
      "isSafe": true,
      "confidence": 0.95,
      "detectedObjects": ["mountain", "landscape", "nature"],
      "adultContent": false,
      "violence": false,
      "hate": false
    }
  ]
}
```

### Example 2: Moderation with Base64 Image

```bash
curl -X POST http://localhost:3000/api/v1/moderate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "My profile picture",
    "images": [
      {
        "base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
        "filename": "profile.jpg",
        "contentType": "image/jpeg"
      }
    ]
  }'
```

### Example 3: Moderation with Multiple Images

```bash
curl -X POST http://localhost:3000/api/v1/moderate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Photos from my trip",
    "images": [
      {
        "url": "https://example.com/photo1.jpg",
        "contentType": "image/jpeg"
      },
      {
        "url": "https://example.com/photo2.jpg",
        "contentType": "image/jpeg"
      }
    ]
  }'
```

## 🐦 **X (Twitter) API Integration**

### Example 1: Post Safe Content

```bash
curl -X POST http://localhost:3000/api/v1/x-post \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Just had an amazing day! #happy #life",
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
        "contentType": "image/jpeg"
      }
    ]
  }'
```

**Response:**
```json
{
  "success": true,
  "tweetId": "1234567890123456789",
  "moderationResult": {
    "result": "ok",
    "confidence": 0.95,
    "imageResults": [
      {
        "imageIndex": 0,
        "isSafe": true,
        "confidence": 0.95,
        "detectedObjects": ["mountain", "landscape"],
        "adultContent": false,
        "violence": false,
        "hate": false
      }
    ]
  }
}
```

### Example 2: Reject Harmful Content

```bash
curl -X POST http://localhost:3000/api/v1/x-post \
  -H "Content-Type: application/json" \
  -d '{
    "text": "I hate everyone and want to hurt them",
    "images": [
      {
        "url": "https://example.com/violent-image.jpg",
        "contentType": "image/jpeg"
      }
    ]
  }'
```

**Response:**
```json
{
  "success": false,
  "moderationResult": {
    "result": "rejected",
    "reason": "hate speech",
    "confidence": 0.92,
    "flags": ["hate", "violence"],
    "imageResults": [
      {
        "imageIndex": 0,
        "isSafe": false,
        "reason": "violent content detected",
        "confidence": 0.88,
        "flags": ["violence"],
        "violence": true
      }
    ]
  },
  "error": "Content rejected: hate speech"
}
```

### Example 3: Reply to Tweet

```bash
curl -X POST http://localhost:3000/api/v1/x-post \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Great point! I agree with you.",
    "replyTo": "1234567890123456789"
  }'
```

## 🔧 **JavaScript/Node.js Examples**

### Image Moderation

```javascript
const axios = require('axios');

async function moderateContent(text, images) {
  try {
    const response = await axios.post('http://localhost:3000/api/v1/moderate', {
      text,
      images
    });

    console.log('Moderation result:', response.data);
    return response.data;
  } catch (error) {
    console.error('Moderation failed:', error.response?.data || error.message);
    throw error;
  }
}

// Usage example
moderateContent(
  "Check out this photo!",
  [
    {
      url: "https://example.com/image.jpg",
      contentType: "image/jpeg"
    }
  ]
);
```

### Post to X

```javascript
const axios = require('axios');

async function postToX(text, images, replyTo = null) {
  try {
    const response = await axios.post('http://localhost:3000/api/v1/x-post', {
      text,
      images,
      replyTo
    });

    if (response.data.success) {
      console.log('Tweet posted successfully:', response.data.tweetId);
      return response.data.tweetId;
    } else {
      console.log('Tweet rejected:', response.data.error);
      return null;
    }
  } catch (error) {
    console.error('X post failed:', error.response?.data || error.message);
    throw error;
  }
}

// Usage example
postToX(
  "Amazing sunset! #photography",
  [
    {
      url: "https://example.com/sunset.jpg",
      contentType: "image/jpeg"
    }
  ]
);
```

## 📊 **Response Analysis**

### Image Results Structure

```json
{
  "imageResults": [
    {
      "imageIndex": 0,           // Image index in array
      "isSafe": true,            // Whether image is safe
      "reason": "string",        // Rejection reason (if unsafe)
      "confidence": 0.95,        // Confidence score (0-1)
      "flags": ["violence"],     // Problematic content flags
      "detectedObjects": ["person", "car"], // Detected objects
      "adultContent": false,     // Adult content
      "violence": false,         // Violence
      "hate": false              // Hate symbols
    }
  ]
}
```

### Flag Types

- `adultContent` - Adult/sexual content
- `violence` - Violence/gore
- `hate` - Hate symbols
- `self-harm` - Self-harm content
- `illegal` - Illegal activities

## 🚀 **Production Usage**

### Environment Variables Setup

```bash
# OpenAI API for text and image moderation
OPENAI_API_KEY=your_openai_api_key_here
AI_PROVIDER=openai

# Logging settings
LOG_LEVEL=info
LOG_PRETTY_PRINT=false

# Rate limiting
RATE_LIMIT_MAX=10
RATE_LIMIT_TIME_WINDOW=60000
```

### Monitoring

```bash
# Health check
curl http://localhost:3000/health

# JSON logs
tail -f logs/app.log | jq
```

### Docker Deployment

```bash
# Build image
docker build -t content-moderation-api .

# Run with environment variables
docker run -p 3000:3000 \
  -e OPENAI_API_KEY=your_key \
  -e AI_PROVIDER=openai \
  -e LOG_LEVEL=info \
  content-moderation-api
```