#!/bin/bash

echo "🎬 Simple Video Moderation Test (no jq required)"
echo "================================================"

curl -X POST "http://127.0.0.1:8000/api/v1/moderate" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Check out this amazing video!",
    "videos": [
      {
        "url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
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
