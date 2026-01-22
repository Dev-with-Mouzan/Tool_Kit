#!/bin/bash

echo "🚀 Deploying WebToolkit..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install docker-compose first."
    exit 1
fi

# Build images
echo "📦 Building Docker images..."
docker-compose build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

# Start containers
echo "🚀 Starting containers..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed!"
    exit 1
fi

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check health
echo "🏥 Checking service health..."
curl -f http://localhost:5000/health > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "📱 Frontend: http://localhost:8000"
    echo "🔌 Backend API: http://localhost:5000"
else
    echo "⚠️  Backend health check failed. Check logs with: docker-compose logs backend"
fi

echo ""
echo "📊 View logs: docker-compose logs -f"
echo "🛑 Stop services: docker-compose down"
