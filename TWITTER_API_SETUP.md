# Twitter API Setup Guide

## 🐦 **Setting up Twitter API for Production**

This guide will help you set up the Twitter API v2 for real X (Twitter) posting functionality.

## 📋 **Prerequisites**

1. **Twitter Developer Account**
   - Visit [Twitter Developer Portal](https://developer.twitter.com/)
   - Sign up for a developer account
   - Complete the application process

2. **API Access Level**
   - Basic (Free) - Limited posting capabilities
   - Elevated - Enhanced posting capabilities
   - Enterprise - Full access (paid)

## 🔑 **Required API Keys**

You'll need the following credentials from your Twitter Developer Portal:

### **1. API Key and Secret**
- Go to your app in the Developer Portal
- Navigate to "Keys and Tokens"
- Copy the "API Key" and "API Key Secret"

### **2. Bearer Token**
- In the same "Keys and Tokens" section
- Generate a "Bearer Token" (v2)

### **3. Access Token and Secret**
- Create an "Access Token and Secret"
- Choose "Read and Write" permissions
- Copy both the "Access Token" and "Access Token Secret"

## ⚙️ **Environment Variables**

Add these variables to your `.env` file:

```bash
# Twitter API Configuration
TWITTER_BEARER_TOKEN=your_bearer_token_here
TWITTER_API_KEY=your_api_key_here
TWITTER_API_SECRET=your_api_secret_here
TWITTER_ACCESS_TOKEN=your_access_token_here
TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret_here
```

## 🔧 **Configuration Steps**

### **Step 1: Create Twitter App**
1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Click "Create App"
3. Fill in the required information
4. Select your app permissions

### **Step 2: Set App Permissions**
1. In your app settings, go to "App permissions"
2. Select "Read and Write" permissions
3. Save changes

### **Step 3: Generate Tokens**
1. Go to "Keys and Tokens" tab
2. Generate "Bearer Token" (v2)
3. Create "Access Token and Secret" with "Read and Write" permissions
4. Copy all credentials

### **Step 4: Test Credentials**
```bash
# Test your setup
curl -X POST http://localhost:3000/api/v1/x-post \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Test tweet from Content Moderation API! 🚀"
  }'
```

## 🚀 **Production Deployment**

### **Docker Deployment**
```bash
# Build with Twitter API credentials
docker build -t content-moderation-api .

# Run with environment variables
docker run -p 3000:3000 \
  -e TWITTER_BEARER_TOKEN=your_bearer_token \
  -e TWITTER_API_KEY=your_api_key \
  -e TWITTER_API_SECRET=your_api_secret \
  -e TWITTER_ACCESS_TOKEN=your_access_token \
  -e TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret \
  -e OPENAI_API_KEY=your_openai_key \
  content-moderation-api
```

### **Docker Compose**
```yaml
version: '3.8'
services:
  content-moderation-api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - TWITTER_BEARER_TOKEN=${TWITTER_BEARER_TOKEN}
      - TWITTER_API_KEY=${TWITTER_API_KEY}
      - TWITTER_API_SECRET=${TWITTER_API_SECRET}
      - TWITTER_ACCESS_TOKEN=${TWITTER_ACCESS_TOKEN}
      - TWITTER_ACCESS_TOKEN_SECRET=${TWITTER_ACCESS_TOKEN_SECRET}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
```

## 📊 **API Rate Limits**

### **Twitter API v2 Limits**
- **Tweets**: 300 per 15-minute window
- **Media Uploads**: 1000 per 24-hour window
- **User Lookups**: 900 per 15-minute window

### **Our Implementation**
- Rate limiting is handled by `@fastify/rate-limit`
- Default: 10 requests per minute per IP
- Configurable via environment variables

## 🔒 **Security Best Practices**

### **1. Environment Variables**
- Never commit API keys to version control
- Use `.env` files for local development
- Use secure environment variable management in production

### **2. API Key Rotation**
- Regularly rotate your API keys
- Monitor API usage for suspicious activity
- Use different keys for different environments

### **3. Error Handling**
- The service gracefully handles API errors
- Failed posts are logged with detailed error messages
- Content moderation still works even if Twitter API is unavailable

## 🧪 **Testing**

### **Development Mode**
- Without Twitter credentials, the service uses mock responses
- Perfect for development and testing
- No real tweets are posted

### **Production Mode**
- With valid credentials, real tweets are posted
- All content is moderated before posting
- Failed moderation prevents posting

## 📝 **Example Usage**

### **Post with Text Only**
```bash
curl -X POST http://localhost:3000/api/v1/x-post \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, Twitter! This post was moderated for safety. 🛡️"
  }'
```

### **Post with Image**
```bash
curl -X POST http://localhost:3000/api/v1/x-post \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Check out this amazing photo! 📸",
    "images": [
      {
        "url": "https://example.com/image.jpg",
        "contentType": "image/jpeg"
      }
    ]
  }'
```

### **Reply to Tweet**
```bash
curl -X POST http://localhost:3000/api/v1/x-post \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Great point! I agree with you.",
    "replyTo": "1234567890123456789"
  }'
```

## 🚨 **Troubleshooting**

### **Common Issues**

1. **"Twitter API credentials not configured"**
   - Check that all environment variables are set
   - Verify credentials in Twitter Developer Portal

2. **"Invalid Twitter credentials"**
   - Ensure API keys are correct
   - Check app permissions (Read and Write required)
   - Verify Bearer Token is valid

3. **"Media processing failed"**
   - Check image file size (max 5MB)
   - Ensure image format is supported (JPEG, PNG, GIF)
   - Verify image URL is accessible

4. **Rate limit exceeded**
   - Wait for rate limit window to reset
   - Consider upgrading Twitter API access level
   - Implement exponential backoff in your application

### **Debug Mode**
```bash
# Enable debug logging
LOG_LEVEL=debug npm run dev
```

## 📚 **Additional Resources**

- [Twitter API v2 Documentation](https://developer.twitter.com/en/docs/twitter-api)
- [Twitter API Rate Limits](https://developer.twitter.com/en/docs/twitter-api/rate-limits)
- [Twitter API Error Codes](https://developer.twitter.com/en/docs/twitter-api/error-codes)
- [OAuth 1.0a Authentication](https://developer.twitter.com/en/docs/authentication/oauth-1-0a)

## 🎯 **Next Steps**

1. Set up your Twitter Developer account
2. Generate all required API keys
3. Configure environment variables
4. Test with simple text posts
5. Test with images and media
6. Monitor API usage and rate limits
7. Implement proper error handling in your application

Your Content Moderation API is now ready for production X posting! 🚀