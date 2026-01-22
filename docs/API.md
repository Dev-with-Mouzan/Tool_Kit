# API Documentation

Complete API reference for the WebToolkit backend.

**Base URL:** `http://localhost:5000`

---

## Endpoints

### Health Check

Check if the backend server is running.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "running"
}
```

**Example:**
```bash
curl http://localhost:5000/health
```

---

### YouTube Video Information

Fetch video details and available download formats.

**Endpoint:** `GET /yt-info`

**Parameters:**
- `url` (required): YouTube video URL

**Response:**
```json
{
  "title": "Video Title",
  "thumbnail_url": "https://...",
  "duration_string": "10:30",
  "formats": [
    {
      "label": "Download High Quality (MP4)",
      "sub": "1080p+ (Merged)",
      "color": "indigo",
      "url": "https://youtube.com/watch?v=...",
      "format_id": "bestvideo+bestaudio/best"
    },
    {
      "label": "Download Audio (MP3)",
      "sub": "Best Quality",
      "color": "purple",
      "url": "https://youtube.com/watch?v=...",
      "format_id": "bestaudio/best",
      "is_audio": true
    }
  ]
}
```

**Example:**
```bash
curl "http://localhost:5000/yt-info?url=https://youtube.com/watch?v=dQw4w9WgXcQ"
```

**Error Response:**
```json
{
  "detail": "Error message"
}
```

---

### Download Video/Audio

Download a YouTube video or audio in the specified format.

**Endpoint:** `GET /download`

**Parameters:**
- `url` (required): YouTube video URL
- `format_id` (optional): Format identifier from `/yt-info` response (default: "best")

**Response:**
- File download stream (video/mp4 or audio/mp3)
- Filename in Content-Disposition header

**Example:**
```bash
# Download best quality video
curl -O -J "http://localhost:5000/download?url=https://youtube.com/watch?v=dQw4w9WgXcQ&format_id=bestvideo+bestaudio/best"

# Download audio only
curl -O -J "http://localhost:5000/download?url=https://youtube.com/watch?v=dQw4w9WgXcQ&format_id=bestaudio/best"
```

**Error Response:**
```json
{
  "detail": "Failed to process download: error details"
}
```

---

### Remove Background

Remove background from an image using AI.

**Endpoint:** `POST /remove-bg`

**Content-Type:** `multipart/form-data`

**Body:**
- `image` (required): Image file (JPG, PNG, etc.)

**Response:**
- PNG image with transparent background
- Content-Type: `image/png`

**Example:**
```bash
curl -X POST \
  -F "image=@/path/to/image.jpg" \
  http://localhost:5000/remove-bg \
  --output result.png
```

**Error Response:**
```json
{
  "detail": "Error message"
}
```

---

## Error Codes

| Status Code | Description |
|------------|-------------|
| 200 | Success |
| 400 | Bad Request - Missing or invalid parameters |
| 500 | Internal Server Error - Processing failed |

---

## Rate Limiting

Currently, there are no rate limits implemented. For production deployment, consider adding rate limiting middleware.

---

## CORS Configuration

The API allows all origins by default for development. In production, configure the `FRONTEND_URL` environment variable to restrict allowed origins.

**Environment Variable:**
```
FRONTEND_URL=https://yourdomain.com,https://www.yourdomain.com
```

---

## File Size Limits

**Maximum Upload Size:** Configured via `MAX_FILE_SIZE` environment variable (default: 100MB)

**Environment Variable:**
```
MAX_FILE_SIZE=100
```

---

## Notes

- Downloaded files are automatically deleted after serving
- Temporary files are stored in the `downloads/` directory
- FFmpeg is required for video format merging
- Background removal uses the rembg library with ONNX runtime
