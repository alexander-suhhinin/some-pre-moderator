// Mock Twitter API responses
export const mockTwitterResponses = {
  postTweet: {
    data: {
      id: '1234567890123456789',
      text: 'Test tweet content'
    }
  },
  uploadMedia: {
    media_id: 1234567890123456789,
    media_id_string: '1234567890123456789',
    size: 1024,
    expires_after_secs: 86400,
    image: {
      image_type: 'image/jpeg',
      w: 1920,
      h: 1080
    }
  },
  mediaStatus: {
    media_id: 1234567890123456789,
    media_id_string: '1234567890123456789',
    size: 1024,
    expires_after_secs: 86400,
    processing_info: {
      state: 'succeeded',
      check_after_secs: 0,
      progress_percent: 100
    }
  },
  userMe: {
    data: {
      id: '123456789',
      name: 'Test User',
      username: 'testuser'
    }
  }
};

export const mockTwitterError = {
  status: 401,
  title: 'Unauthorized',
  type: 'about:blank',
  detail: 'Unauthorized'
};