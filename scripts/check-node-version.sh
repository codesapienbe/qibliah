#!/bin/bash

echo "🔍 Checking Node.js version..."
NODE_VERSION=$(node --version)
echo "Current Node.js version: $NODE_VERSION"

# Extract major version
MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1)

if [ "$MAJOR_VERSION" -ge 20 ]; then
    echo "⚠️  Node.js $NODE_VERSION detected. This version has known issues with Expo."
    echo "📥 Downgrading to Node.js 18.19.0..."
    
    if command -v nvm &> /dev/null; then
        nvm install 18.19.0
        nvm use 18.19.0
        echo "✅ Switched to Node.js 18.19.0"
    else
        echo "❌ NVM not found. Please install Node.js 18.19.0 manually:"
        echo "   Visit: https://nodejs.org/download/release/v18.19.0/"
        echo "   Or install NVM: https://github.com/nvm-sh/nvm"
    fi
else
    echo "✅ Node.js version is compatible"
fi

echo "🔄 Restarting with new Node version..."
exec $SHELL
