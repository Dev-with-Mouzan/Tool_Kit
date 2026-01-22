#!/bin/bash

echo "🚀 Starting WebToolkit Development Environment..."

# Check if Python is installed
if ! command -v python &> /dev/null; then
    echo "❌ Python is not installed. Please install Python 3.9 or higher."
    exit 1
fi

# Check if backend dependencies are installed
if [ ! -d "backend/venv" ]; then
    echo "📦 Creating virtual environment..."
    cd backend
    python -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ..
else
    echo "✅ Virtual environment found"
fi

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
fi

# Start backend server in background
echo "🔧 Starting backend server on port 5000..."
cd backend
source venv/bin/activate
python app.py &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start frontend server
echo "🌐 Starting frontend server on port 8000..."
python -m http.server 8000 &
FRONTEND_PID=$!

echo ""
echo "✅ Development environment is ready!"
echo "📱 Frontend: http://localhost:8000"
echo "🔌 Backend API: http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for user interrupt
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
