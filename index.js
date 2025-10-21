// --- CRITICAL: Polyfills MUST be loaded FIRST ---
// Order matters! These must load before any Firebase or other library code
console.log('ENTRY START', {
  URL: typeof URL !== 'undefined',
  TextDecoder: typeof TextDecoder !== 'undefined',
});

// 1. Crypto polyfill (FIRST - required by Firebase)
require('react-native-get-random-values');

// 2. TextEncoder/TextDecoder polyfill
if (typeof global.TextEncoder === 'undefined' || typeof global.TextDecoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('fastestsmallesttextencoderdecoder');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// 3. URL polyfill
require('react-native-url-polyfill/auto');

// 4. Ensure atob/btoa are available (from polyfills.js)
require('./polyfills.js');

// 5. Verify polyfills are loaded
console.log('✅ Polyfills loaded:', {
  TextDecoder: typeof global.TextDecoder !== 'undefined',
  TextEncoder: typeof global.TextEncoder !== 'undefined',
  URL: typeof global.URL !== 'undefined',
  atob: typeof global.atob !== 'undefined',
  btoa: typeof global.btoa !== 'undefined',
  crypto: typeof global.crypto !== 'undefined',
  getRandomValues: typeof global.crypto?.getRandomValues !== 'undefined',
});

// Test TextDecoder works
try {
  const testDecoder = new global.TextDecoder();
  const testData = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
  const result = testDecoder.decode(testData);
  console.log('✅ TextDecoder test passed:', result);
} catch (e) {
  console.error('❌ TextDecoder test failed:', e);
}

// Finally, start the app
require('expo-router/entry');