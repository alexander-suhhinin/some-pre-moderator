# 🎬 Video Moderation API - CURL Tests

Этот документ содержит готовые curl команды для тестирования видео модерации API.

## 🚀 Быстрый старт

### 1. Запустите API сервер:
```bash
npm start
```

### 2. Выберите один из тестов ниже и выполните его

## 📋 Доступные тесты

### 🎯 Простой тест (без jq)
```bash
./curl-simple-video-test.sh
```

### 🎯 Простой тест с форматированием (требует jq)
```bash
./curl-single-video-test.sh
```

### 🎯 Полный набор тестов (требует jq)
```bash
./curl-video-tests.sh
```

## 🔧 Ручные curl команды

### Тест одного видео
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

### Тест смешанного контента (текст + изображения + видео)
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

### Тест нескольких видео
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

### Тест только текста (для сравнения)
```bash
curl -X POST "http://127.0.0.1:8000/moderate" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "This is a simple text-only moderation test"
  }'
```

### Проверка здоровья API
```bash
curl -X GET "http://127.0.0.1:8000/health"
```

## 📊 Ожидаемые ответы

### Успешный ответ для видео:
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

## ⚠️ Требования

1. **API сервер запущен** на порту 8000
2. **FFmpeg установлен** в системе
3. **OpenAI API ключ** настроен в `.env`
4. **jq** (опционально) для форматирования JSON

## 🔧 Установка зависимостей

### FFmpeg (macOS):
```bash
brew install ffmpeg
```

### FFmpeg (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install ffmpeg
```

### jq (для форматирования):
```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt install jq
```

## 🐛 Устранение неполадок

### Ошибка "Connection refused":
- Убедитесь, что API сервер запущен: `npm start`

### Ошибка "FFmpeg not found":
- Установите FFmpeg согласно инструкциям выше

### Ошибка "AuthenticationError":
- Проверьте, что `OPENAI_API_KEY` правильно настроен в `.env`

### Ошибка "jq: command not found":
- Установите jq или используйте `curl-simple-video-test.sh`

## 📝 Примечания

- Тестовые видео взяты с [sample-videos.com](https://sample-videos.com/)
- Обработка видео может занять некоторое время
- Результаты зависят от качества и содержания видео
- Аудио транскрипция работает только для речи