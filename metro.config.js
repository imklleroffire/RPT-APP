// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Firebase and SDK 54 compatibility fixes
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs', 'mjs'];
config.resolver.assetExts = [...config.resolver.assetExts, 'cjs'];

// Additional resolver configuration for better compatibility
config.resolver.resolverMainFields = ['react-native', 'browser', 'module', 'main'];

module.exports = config;