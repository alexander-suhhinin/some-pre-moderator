# 🎬 Video Moderation API - CURL Tests

This document contains ready-to-use curl commands for testing the video moderation API.

## 🚀 Quick Start

### 1. Start the API server:
```bash
npm start
```

### 2. Choose one of the tests below and execute it

## 📋 Available Tests

### 🎯 Simple test (without jq)
```bash
./curl-simple-video-test.sh
```

### 🎯 Simple test with formatting (requires jq)
```bash
./curl-single-video-test.sh
```

### 🎯 Full test suite (requires jq)
```bash
./curl-video-tests.sh
```

## 🔧 Manual curl commands

### Single video test
```bash
curl -X POST "http://127.0.0.1:8000/moderate" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Check out this amazing video!",
    "videos": [
      {
        "url": "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
        "contentType": "video/mp4",
        "duration": 10,
        "frameRate": 30,
        "resolution": {
          "width": 1280,
          "height": 720
        },
        "size": 1048576
      }
    ]
  }'
```

### Mixed content test (text + images + video)
```bash
curl -X POST "http://127.0.0.1:8000/moderate" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Here is my latest post with mixed content",
    "images": [
      {
        "url": "https://picsum.photos/800/600",
        "contentType": "image/jpeg"
      }
    ],
    "videos": [
      {
        "url": "https://sample-videos.com/zip/10/mp4/SampleVideo_640x360_1mb.mp4",
        "contentType": "video/mp4",
        "duration": 5,
        "frameRate": 25,
        "resolution": {
          "width": 640,
          "height": 360
        },
        "size": 524288
      }
    ]
  }'
```

### Multiple videos test
```bash
curl -X POST "http://127.0.0.1:8000/moderate" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Multiple videos test",
    "videos": [
      {
        "url": "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
        "contentType": "video/mp4",
        "duration": 10,
        "frameRate": 30,
        "resolution": {
          "width": 1280,
          "height": 720
        },
        "size": 1048576
      },
      {
        "url": "https://sample-videos.com/zip/10/mp4/SampleVideo_640x360_1mb.mp4",
        "contentType": "video/mp4",
        "duration": 5,
        "frameRate": 25,
        "resolution": {
          "width": 640,
          "height": 360
        },
        "size": 524288
      }
    ]
  }'
```

### Text-only test (for comparison)
```bash
curl -X POST "http://127.0.0.1:8000/moderate" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "This is a simple text-only moderation test"
  }'
```

### API health check
```bash
curl -X GET "http://127.0.0.1:8000/health"
```

## 📊 Expected Responses

### Successful video response:
```json
{
  "result": "ok",
  "reason": "All content is safe",
  "confidence": 0.95,
  "flags": [],
  "imageResults": [],
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
        "duration": 10,
        "frameCount": 5,
        "resolution": "1280x720",
        "size": 1048576
      }
    }
  ],
  "metadata": {
    "totalFrames": 5,
    "totalDuration": 10,
    "totalSize": 1048576
  }
}
```

## ⚠️ Requirements

1. **API server is running** on port 8000
2. **FFmpeg is installed** in the system
3. **OpenAI API key** is configured in `.env`
4. **jq** (optional) for JSON formatting

## 🔧 Installing Dependencies

### FFmpeg (macOS):
```bash
brew install ffmpeg
```

### FFmpeg (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install ffmpeg
```

### jq (for formatting):
```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt install jq
```

## 🐛 Troubleshooting

### Error "Connection refused":
- Make sure the API server is running: `npm start`

### Error "FFmpeg not found":
- Install FFmpeg according to the instructions above

### Error "AuthenticationError":
- Check that `OPENAI_API_KEY` is properly configured in `.env`

### Error "jq: command not found":
- Install jq or use `curl-simple-video-test.sh`

## 📝 Notes

- Test videos are taken from [sample-videos.com](https://sample-videos.com/)
- Video processing may take some time
- Results depend on video quality and content
- Audio transcription works only for speech