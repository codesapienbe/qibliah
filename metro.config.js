const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configure resolver to handle TypeScript modules properly
config.resolver = {
  ...config.resolver,
  platforms: ['ios', 'android', 'native', 'web'],
};

module.exports = config;
