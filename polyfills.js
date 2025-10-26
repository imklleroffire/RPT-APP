// polyfills.js
// Only needed if you require atob/btoa for base64 encoding

if (typeof global.atob === 'undefined') {
  global.atob = (input) => {
    return Buffer.from(input, 'base64').toString('binary');
  };
}

if (typeof global.btoa === 'undefined') {
  global.btoa = (input) => {
    return Buffer.from(input, 'binary').toString('base64');
  };
}

console.log('✅ atob/btoa polyfills loaded');