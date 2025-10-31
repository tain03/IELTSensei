#!/bin/bash

# IELTS Practice - Docker Run Script
# Quick script to build and run the application

echo "🎯 IELTS Practice - Docker Setup"
echo "================================"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "📝 Please create .env file from .env.example:"
    echo "   cp .env.example .env"
    echo "   Then edit .env and add your OPENAI_API_KEY"
    exit 1
fi

# Check if OPENAI_API_KEY is set
if ! grep -q "OPENAI_API_KEY=sk-" .env; then
    echo "⚠️  Warning: OPENAI_API_KEY might not be properly configured in .env"
    echo "📝 Please check your .env file"
fi

echo ""
echo "🔨 Building Docker image..."
docker-compose build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "🚀 Starting application..."
docker-compose up -d

if [ $? -ne 0 ]; then
    echo "❌ Failed to start!"
    exit 1
fi

echo ""
echo "✅ Application started successfully!"
echo ""
echo "🌐 Access the application at:"
echo "   http://localhost:5000"
echo ""
echo "📊 View logs:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 Stop application:"
echo "   docker-compose down"
echo ""

