#!/bin/bash

echo "🧹 Clearing Expo cache..."
npx expo install --fix

echo "🗑️ Clearing node_modules..."
rm -rf node_modules
rm -rf .expo

echo "📦 Reinstalling dependencies..."
npm install

echo "🔄 Clearing Metro cache..."
npx expo start --clear

echo "✅ Done! Try running 'npx expo run:ios' again"
