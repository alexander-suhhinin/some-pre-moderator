const https = require('https');

// Video pre-moderation example
const videoModerationExample = {
  text: "Check out this amazing video I found!",
  videos: [
    {
      url: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
      contentType: "video/mp4",
      duration: 10,
      frameRate: 30,
      resolution: {
        width: 1280,
        height: 720
      },
      size: 1048576
    }
  ]
};

// Example with video, text and photo
const mixedContentExample = {
  text: "Here's my latest post with mixed content",
  images: [
    {
      url: "https://picsum.photos/800/600",
      contentType: "image/jpeg"
    }
  ],
  videos: [
    {
      url: "https://sample-videos.com/zip/10/mp4/SampleVideo_640x360_1mb.mp4",
      contentType: "video/mp4",
      duration: 5,
      frameRate: 25,
      resolution: {
        width: 640,
        height: 360
      },
      size: 524288
    }
  ]
};

// Query execution example
async function moderateContent(data) {
  const postData = JSON.stringify(data);

  const options = {
    hostname: '127.0.0.1',
    port: 8000,
    path: '/moderate',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Results output
function printResults(title, response) {
  console.log(`\n${title}`);
  console.log('='.repeat(50));
  console.log(`Overall Result: ${response.result}`);
  console.log(`Reason: ${response.reason}`);
  console.log(`Confidence: ${response.confidence}`);
  console.log(`Flags: ${response.flags.join(', ') || 'None'}`);

  if (response.imageResults && response.imageResults.length > 0) {
    console.log('\nImage Results:');
    response.imageResults.forEach((img, index) => {
      console.log(`  Image ${index}: ${img.isSafe ? '✅ Safe' : '❌ Unsafe'} (${img.confidence})`);
    });
  }

  if (response.videoResults && response.videoResults.length > 0) {
    console.log('\nVideo Results:');
    response.videoResults.forEach((video, index) => {
      console.log(`  Video ${index}: ${video.isSafe ? '✅ Safe' : '❌ Unsafe'} (${video.confidence})`);
      console.log(`    Frames analyzed: ${video.metadata.frameCount}`);
      console.log(`    Duration: ${video.metadata.duration}s`);
      console.log(`    Resolution: ${video.metadata.resolution}`);
      if (video.audioTranscription) {
        console.log(`    Audio: "${video.audioTranscription.substring(0, 50)}..."`);
      }
    });
  }

  console.log(`\nMetadata:`);
  console.log(`  Total frames: ${response.metadata.totalFrames}`);
  console.log(`  Total duration: ${response.metadata.totalDuration}s`);
  console.log(`  Total size: ${(response.metadata.totalSize / 1024 / 1024).toFixed(2)}MB`);
}

// Run examples
async function runExamples() {
  console.log('🎬 Video Moderation API Examples');
  console.log('================================');

  try {
    // 1. video only
    console.log('\n📹 Example 1: Video-only moderation');
    const videoResult = await moderateContent(videoModerationExample);
    printResults('Video Moderation Result', videoResult);

    // 2. mixed content
    console.log('\n🖼️ Example 2: Mixed content moderation');
    const mixedResult = await moderateContent(mixedContentExample);
    printResults('Mixed Content Result', mixedResult);

  } catch (error) {
    console.error('❌ Error running examples:', error.message);
    console.log('\n💡 Make sure the API server is running on port 8000');
    console.log('   Run: npm start');
  }
}

// run if executes by itself
if (require.main === module) {
  runExamples();
}

module.exports = {
  moderateContent,
  printResults,
  videoModerationExample,
  mixedContentExample
};