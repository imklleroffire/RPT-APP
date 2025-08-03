const { getDefaultConfig } = require('@expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

// Firebase compatibility fixes for Expo SDK 53
// This fixes the "tslib" and other .cjs module resolution issues
defaultConfig.resolver.sourceExts.push('cjs');
defaultConfig.resolver.assetExts.push('cjs');
defaultConfig.resolver.unstable_enablePackageExports = false;

// Additional resolver configuration for Firebase
defaultConfig.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
defaultConfig.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = defaultConfig; 