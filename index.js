// index.js
// ==========================================
// CRITICAL: Setup polyfills BEFORE any imports
// ==========================================

// 1. TextDecoder/TextEncoder - MUST be first
const FastTextEncoding = require('fast-text-encoding');

global.TextDecoder = class TextDecoder {
  constructor(encoding = 'utf-8', options = {}) {
    this._decoder = new FastTextEncoding.TextDecoder(encoding, options);
  }
  
  decode(input, options) {
    return this._decoder.decode(input, options);
  }
  
  get encoding() { return this._decoder.encoding; }
  get fatal() { return this._decoder.fatal; }
  get ignoreBOM() { return this._decoder.ignoreBOM; }
};

global.TextEncoder = class TextEncoder {
  constructor() {
    this._encoder = new FastTextEncoding.TextEncoder();
  }
  
  encode(input) {
    return this._encoder.encode(input);
  }
  
  get encoding() { return this._encoder.encoding; }
};

// 2. Load other polyfills
require('./globals.js');
require('./url-polyfill.js');

// 3. Crypto polyfill (for Firebase)
require('react-native-get-random-values');

// 4. atob/btoa
if (typeof global.atob === 'undefined') {
  global.atob = (input) => Buffer.from(input, 'base64').toString('binary');
  global.btoa = (input) => Buffer.from(input, 'binary').toString('base64');
}

console.log('✅ All polyfills loaded successfully');

// 5. Start Expo Router (not registerRootComponent for Expo Router apps!)
require('expo-router/entry');