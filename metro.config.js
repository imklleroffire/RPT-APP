// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Firebase and SDK 54 compatibility fixes
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs', 'mjs'];
config.resolver.assetExts = [...config.resolver.assetExts, 'cjs'];

// Additional resolver configuration for better compatibility
config.resolver.resolverMainFields = ['react-native', 'browser', 'module', 'main'];

// Add Node.js polyfills for whatwg-url-without-unicode
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  buffer: require.resolve('buffer/'),
  punycode: require.resolve('punycode/'),
  process: require.resolve('process/browser'),
};

module.exports = config;