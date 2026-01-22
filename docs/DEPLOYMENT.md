# Deployment Guide

Step-by-step guide for deploying WebToolkit to various platforms.

---

## Table of Contents

1. [Local Development](#local-development)
2. [Docker Deployment](#docker-deployment)
3. [VPS/Cloud Deployment](#vpscloud-deployment)
4. [Platform-Specific Guides](#platform-specific-guides)
5. [Environment Configuration](#environment-configuration)
6. [Troubleshooting](#troubleshooting)

---

## Local Development

### Prerequisites

- Python 3.9+
- Node.js 14+ (optional, for package management)
- Git

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Tool
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and configure as needed.

3. **Install Python dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   cd ..
   ```

4. **Start the backend**
   ```bash
   cd backend
   python app.py
   ```

5. **Serve the frontend**
   
   Open another terminal:
   ```bash
   python -m http.server 8000
   ```
   
   Or simply open `index.html` in your browser.

6. **Access the application**
   - Frontend: http://localhost:8000
   - Backend: http://localhost:5000

---

## Docker Deployment

### Prerequisites

- Docker 20.10+
- Docker Compose 1.29+

### Development Mode

```bash
# Build and start containers
docker-compose up

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

### Production Mode

```bash
# Build and deploy
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Or use the deployment script
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### Docker Commands Reference

```bash
# Rebuild images
docker-compose build --no-cache

# View running containers
docker-compose ps

# Execute commands in container
docker-compose exec backend bash

# View logs for specific service
docker-compose logs -f backend

# Restart a service
docker-compose restart backend

# Remove all containers and volumes
docker-compose down -v
```

---

## VPS/Cloud Deployment

### General Steps

1. **Provision a server** (Ubuntu 20.04+ recommended)

2. **Install Docker and Docker Compose**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   
   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

3. **Clone and configure**
   ```bash
   git clone <repository-url>
   cd Tool
   cp .env.example .env
   nano .env  # Configure environment variables
   ```

4. **Deploy with Docker**
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

5. **Set up reverse proxy (Nginx)**
   ```bash
   sudo apt install nginx
   ```
   
   Create `/etc/nginx/sites-available/webtoolkit`:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           proxy_pass http://localhost:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
       
       location /api/ {
           proxy_pass http://localhost:5000/;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```
   
   Enable and restart:
   ```bash
   sudo ln -s /etc/nginx/sites-available/webtoolkit /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

6. **Set up SSL with Let's Encrypt**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

---

## Platform-Specific Guides

### Railway

1. Create a new project on [Railway](https://railway.app)
2. Connect your GitHub repository
3. Add environment variables in Railway dashboard
4. Railway will auto-detect and deploy using Dockerfile

### Render

1. Create a new Web Service on [Render](https://render.com)
2. Connect your repository
3. Configure:
   - Build Command: `cd backend && pip install -r requirements.txt`
   - Start Command: `cd backend && python app.py`
4. Add environment variables
5. Deploy

### Heroku

1. Install Heroku CLI
2. Create `Procfile` in project root:
   ```
   web: cd backend && gunicorn -w 4 -k uvicorn.workers.UvicornWorker app:app
   ```
3. Deploy:
   ```bash
   heroku create your-app-name
   git push heroku main
   ```

### DigitalOcean App Platform

1. Create a new app
2. Connect repository
3. Configure components:
   - Backend: Python app
   - Frontend: Static site
4. Set environment variables
5. Deploy

---

## Environment Configuration

### Required Variables

```env
PORT=5000
ENVIRONMENT=production
FRONTEND_URL=https://yourdomain.com
MAX_FILE_SIZE=100
```

### Optional Variables

```env
# If using external ffmpeg
FFMPEG_PATH=/usr/bin/ffmpeg

# Custom download directory
DOWNLOADS_DIR=/tmp/downloads
```

---

## Troubleshooting

### Backend won't start

**Error:** `Port 5000 already in use`

**Solution:**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

### Docker build fails

**Error:** `Cannot connect to Docker daemon`

**Solution:**
```bash
# Start Docker service
sudo systemctl start docker

# Add user to docker group
sudo usermod -aG docker $USER
```

### YouTube download fails

**Error:** `Unable to download video`

**Solution:**
- Update yt-dlp: `pip install --upgrade yt-dlp`
- Check if ffmpeg is installed
- Verify the video URL is accessible

### Background removal fails

**Error:** `ONNX runtime error`

**Solution:**
- Ensure sufficient memory (2GB+ recommended)
- Install correct onnxruntime version for your platform
- Check image file is valid

### CORS errors

**Error:** `Access-Control-Allow-Origin`

**Solution:**
- Add your frontend URL to `FRONTEND_URL` in `.env`
- Restart the backend server

---

## Performance Optimization

### Production Checklist

- [ ] Set `ENVIRONMENT=production` in `.env`
- [ ] Use gunicorn/uvicorn with multiple workers
- [ ] Enable Nginx gzip compression
- [ ] Set up CDN for static assets
- [ ] Configure proper caching headers
- [ ] Set up monitoring (e.g., Sentry, New Relic)
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Set up automated backups
- [ ] Configure firewall rules
- [ ] Set resource limits in docker-compose.prod.yml

---

## Monitoring

### Health Check

```bash
curl http://localhost:5000/health
```

### Docker Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### System Resources

```bash
# Docker stats
docker stats

# Disk usage
docker system df
```

---

## Backup and Restore

### Backup

```bash
# Backup configuration
tar -czf webtoolkit-backup.tar.gz .env docker-compose.yml

# Backup Docker volumes (if any)
docker run --rm -v webtoolkit_data:/data -v $(pwd):/backup ubuntu tar czf /backup/volumes-backup.tar.gz /data
```

### Restore

```bash
# Restore configuration
tar -xzf webtoolkit-backup.tar.gz

# Restore volumes
docker run --rm -v webtoolkit_data:/data -v $(pwd):/backup ubuntu tar xzf /backup/volumes-backup.tar.gz -C /
```

---

## Security Best Practices

1. **Never commit `.env` file** - Use `.env.example` as template
2. **Use strong secrets** - Generate random values for API keys
3. **Keep dependencies updated** - Regularly update packages
4. **Enable HTTPS** - Use SSL certificates in production
5. **Set up firewall** - Only expose necessary ports
6. **Regular backups** - Automate backup procedures
7. **Monitor logs** - Set up log aggregation and alerts
8. **Rate limiting** - Implement API rate limiting for production

---

For additional help, please open an issue on GitHub.
