# 🚀 WebToolkit

**Premium online tools for PDF conversion, image compression, YouTube downloads, and more.**

A comprehensive web-based toolkit providing free, fast, and secure utilities for everyday tasks. All processing happens locally in your browser or through a secure backend API for maximum privacy.

---

## ✨ Features

### 🎯 Available Tools

- **📄 PDF ↔ Word Converter** - Bidirectional conversion between PDF and Word formats
- **🖼️ Image Compressor** - Compress JPG, PNG, and WebP images without quality loss
- **📸 Image to PDF** - Combine multiple images into a single PDF document
- **📦 PDF Compressor** - Reduce PDF file size while maintaining readability
- **🎥 YouTube Downloader** - Download videos in MP4, MP3, and other formats
- **🎨 Background Remover** - AI-powered automatic background removal
- **📱 QR Code Generator** - Create custom QR codes for URLs, text, and more
- **🔤 Case Converter** - Convert text between different cases
- **📋 Document Converter** - Convert between various document formats

### 🔒 Privacy First
- Client-side processing where possible
- Secure backend API for advanced features
- No data retention - files deleted after processing
- No tracking or analytics

---

## 🛠️ Tech Stack

**Frontend:**
- HTML5, CSS3, JavaScript (ES6+)
- Tailwind CSS for styling
- Lucide Icons
- PDF.js, JSZip, and other client-side libraries

**Backend:**
- Python 3.11+
- FastAPI framework
- yt-dlp for YouTube downloads
- rembg for background removal
- FFmpeg for video processing

**Deployment:**
- Docker & Docker Compose
- Nginx for production serving
- Gunicorn/Uvicorn for Python ASGI

---

## 🚀 Quick Start

### Prerequisites

- Python 3.9 or higher
- Node.js 14+ (for frontend dependencies)
- Docker & Docker Compose (optional, for containerized deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Tool
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   cd ..
   ```

4. **Install frontend dependencies**
   ```bash
   npm install
   ```

5. **Run the development servers**

   **Windows:**
   ```bash
   scripts\dev.bat
   ```

   **Linux/Mac:**
   ```bash
   chmod +x scripts/dev.sh
   ./scripts/dev.sh
   ```

6. **Access the application**
   - Frontend: http://localhost:8000
   - Backend API: http://localhost:5000
   - API Health: http://localhost:5000/health

---

## 🐳 Docker Deployment

### Development Mode

```bash
docker-compose up
```

### Production Mode

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Or use the deployment script:
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

---

## 📁 Project Structure

```
Tool/
├── backend/                 # Python FastAPI backend
│   ├── app.py              # Main application
│   ├── config.py           # Configuration management
│   ├── requirements.txt    # Python dependencies
│   ├── Dockerfile          # Backend Docker image
│   └── .dockerignore       # Docker ignore patterns
├── tools/                   # Individual tool HTML pages
├── js/                      # JavaScript files
│   ├── main.js             # Main frontend logic
│   └── tools/              # Tool-specific scripts
├── css/                     # Stylesheets
├── assets/                  # Images and static assets
├── scripts/                 # Deployment and dev scripts
├── docs/                    # Documentation
├── index.html              # Main landing page
├── docker-compose.yml      # Docker Compose config
├── nginx.conf              # Nginx configuration
├── package.json            # Node.js dependencies
└── .env.example            # Environment template
```

---

## 🔌 API Documentation

See [docs/API.md](docs/API.md) for complete API documentation.

### Quick Reference

**Health Check**
```
GET /health
```

**YouTube Video Info**
```
GET /yt-info?url=<youtube_url>
```

**Download Video**
```
GET /download?url=<youtube_url>&format_id=<format>
```

**Remove Background**
```
POST /remove-bg
Content-Type: multipart/form-data
Body: image file
```

---

## 📖 Documentation

- [API Documentation](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Development Guide](docs/DEVELOPMENT.md)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) - YouTube download library
- [rembg](https://github.com/danielgatis/rembg) - Background removal
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Lucide Icons](https://lucide.dev/) - Beautiful icon set

---

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Made with ❤️ for the web community**
