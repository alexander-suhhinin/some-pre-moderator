const http = require('http');

// Test the API with different types of content
const testCases = [
  {
    name: "Safe content",
    text: "Hello, how are you today? This is a normal conversation."
  },
  {
    name: "Potentially harmful content",
    text: "I hate you and want to hurt you"
  },
  {
    name: "Self-harm content",
    text: "I want to kill myself"
  },
  {
    name: "Violent content",
    text: "I will beat you up and break your bones"
  },
  {
    name: "Positive content",
    text: "I love this community and everyone here is wonderful!"
  }
];

// Test cases with images
const imageTestCases = [
  {
    name: "Text with safe image URL",
    text: "Check out this beautiful landscape!",
    images: [
      {
        url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
        contentType: "image/jpeg"
      }
    ]
  },
  {
    name: "Text with multiple images",
    text: "Here are some photos from my trip",
    images: [
      {
        url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
        contentType: "image/jpeg"
      },
      {
        url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400",
        contentType: "image/jpeg"
      }
    ]
  }
];

// X API test cases
const xApiTestCases = [
  {
    name: "Safe X post",
    text: "Just had an amazing day! #happy #life",
    images: [
      {
        url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
        contentType: "image/jpeg"
      }
    ]
  },
  {
    name: "Harmful X post (should be rejected)",
    text: "I hate everyone and want to hurt them",
    images: [
      {
        url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
        contentType: "image/jpeg"
      }
    ]
  },
  {
    name: "X post with reply",
    text: "Great point! I agree with you.",
    replyTo: "1234567890123456789"
  }
];

function makeRequest(endpoint, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({ status: res.statusCode, data: result });
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

async function runTests() {
  console.log('🚀 Testing Content Moderation API with Images and X Integration\n');
  console.log('Make sure the server is running on http://localhost:3000\n');

  // Test basic moderation
  console.log('📝 === BASIC MODERATION TESTS ===\n');
  for (const testCase of testCases) {
    try {
      console.log(`📝 Testing: ${testCase.name}`);
      console.log(`   Text: "${testCase.text}"`);

      const result = await makeRequest('/api/v1/moderate', { text: testCase.text });

      console.log(`   Status: ${result.status}`);
      console.log(`   Result: ${JSON.stringify(result.data, null, 2)}`);
      console.log('   ---\n');
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}\n`);
    }
  }

  // Test moderation with images
  console.log('🖼️ === IMAGE MODERATION TESTS ===\n');
  for (const testCase of imageTestCases) {
    try {
      console.log(`🖼️ Testing: ${testCase.name}`);
      console.log(`   Text: "${testCase.text}"`);
      console.log(`   Images: ${testCase.images?.length || 0} image(s)`);

      const result = await makeRequest('/api/v1/moderate', testCase);

      console.log(`   Status: ${result.status}`);
      console.log(`   Result: ${JSON.stringify(result.data, null, 2)}`);
      console.log('   ---\n');
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}\n`);
    }
  }

  // Test X API integration
  console.log('🐦 === X (TWITTER) API TESTS ===\n');
  for (const testCase of xApiTestCases) {
    try {
      console.log(`🐦 Testing: ${testCase.name}`);
      console.log(`   Text: "${testCase.text}"`);
      if (testCase.images) {
        console.log(`   Images: ${testCase.images.length} image(s)`);
      }
      if (testCase.replyTo) {
        console.log(`   Reply to: ${testCase.replyTo}`);
      }

      const result = await makeRequest('/api/v1/x-post', testCase);

      console.log(`   Status: ${result.status}`);
      console.log(`   Result: ${JSON.stringify(result.data, null, 2)}`);
      console.log('   ---\n');
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}\n`);
    }
  }

  // Test health endpoint
  try {
    console.log('🏥 Testing health endpoint...');
    const healthResult = await new Promise((resolve, reject) => {
      http.get('http://localhost:3000/health', (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch (error) {
            reject(error);
          }
        });
      }).on('error', reject);
    });

    console.log(`   Status: ${healthResult.status}`);
    console.log(`   Response: ${JSON.stringify(healthResult.data, null, 2)}\n`);
  } catch (error) {
    console.error(`   ❌ Health check error: ${error.message}\n`);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { makeRequest, runTests };