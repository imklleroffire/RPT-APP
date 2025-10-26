// globals.js
import { polyfillGlobal } from 'react-native/Libraries/Utilities/PolyfillFunctions';

// Process polyfill
polyfillGlobal('process', () => require('process'));

// Buffer polyfill
polyfillGlobal('Buffer', () => require('buffer').Buffer);

console.log('✅ Core polyfills (process, Buffer) loaded');