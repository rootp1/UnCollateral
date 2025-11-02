#!/bin/bash

# Setup script for UnCollateral frontend

echo "🚀 Setting up UnCollateral frontend..."

# Check if we're in the right directory
if [ ! -f "README.md" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Navigate to frontend
cd frontend

echo "📦 Installing dependencies..."
if command -v npm &> /dev/null; then
    npm install
else
    echo "⚠️  npm not found. Skipping dependency installation."
    echo "   Install Node.js to use npm: https://nodejs.org"
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ Created .env file. Please update it with your configuration."
else
    echo "ℹ️  .env file already exists. Skipping..."
fi

echo ""
echo "✅ Frontend setup complete!"
echo ""
echo "Next steps:"
echo "1. Update frontend/.env with your Reclaim App ID and contract addresses"
echo "2. Run 'cd frontend && npm run dev' to start the development server"
echo "3. Open http://localhost:8000 in your browser"
echo ""
echo "Happy coding! 🎉"
