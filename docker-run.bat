@echo off
REM IELTS Practice - Docker Run Script for Windows
REM Quick script to build and run the application

echo ========================================
echo 🎯 IELTS Practice - Docker Setup
echo ========================================
echo.

REM Check if .env file exists
if not exist .env (
    echo ❌ Error: .env file not found!
    echo 📝 Please create .env file from .env.example:
    echo    copy .env.example .env
    echo    Then edit .env and add your OPENAI_API_KEY
    pause
    exit /b 1
)

REM Check if OPENAI_API_KEY is set
findstr /C:"OPENAI_API_KEY=sk-" .env >nul
if errorlevel 1 (
    echo ⚠️  Warning: OPENAI_API_KEY might not be properly configured in .env
    echo 📝 Please check your .env file
    echo.
)

echo 🔨 Building Docker image...
docker-compose build

if errorlevel 1 (
    echo ❌ Build failed!
    pause
    exit /b 1
)

echo.
echo 🚀 Starting application...
docker-compose up -d

if errorlevel 1 (
    echo ❌ Failed to start!
    pause
    exit /b 1
)

echo.
echo ✅ Application started successfully!
echo.
echo 🌐 Access the application at:
echo    http://localhost:5000
echo.
echo 📊 View logs:
echo    docker-compose logs -f
echo.
echo 🛑 Stop application:
echo    docker-compose down
echo.
pause

