#!/bin/bash

echo "🚀 MERN Stack Deployment Script"
echo "================================"

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "client" ] && [ ! -d "server" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."

echo "  - Installing backend dependencies..."
cd server
npm install
cd ..

echo "  - Installing frontend dependencies..."
cd client
npm install
cd ..

# Run tests
echo "🧪 Running tests..."

echo "  - Testing backend..."
cd server
npm test
if [ $? -ne 0 ]; then
    echo "❌ Backend tests failed"
    exit 1
fi
cd ..

echo "  - Testing frontend..."
cd client
npm test
if [ $? -ne 0 ]; then
    echo "❌ Frontend tests failed"
    exit 1
fi
cd ..

# Build frontend
echo "🏗️ Building frontend..."
cd client
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed"
    exit 1
fi
cd ..

echo "✅ All checks passed!"
echo ""
echo "📋 Next steps:"
echo "1. Set up MongoDB Atlas database"
echo "2. Deploy backend to Render"
echo "3. Deploy frontend to Vercel/Netlify"
echo "4. Update environment variables"
echo ""
echo "📖 See README.md for detailed deployment instructions"