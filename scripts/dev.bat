@echo off
echo 🚀 Starting WebToolkit Development Environment...

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python 3.9 or higher.
    exit /b 1
)

REM Create .env if it doesn't exist
if not exist ".env" (
    echo 📝 Creating .env file from template...
    copy .env.example .env
)

REM Create downloads directory
if not exist "downloads" mkdir downloads

echo.
echo ✅ Development environment is ready!
echo 📱 Frontend: Open index.html in your browser or run: python -m http.server 8000
echo 🔌 Backend API: http://localhost:5000
echo.
echo Starting backend server...
cd backend
python app.py
