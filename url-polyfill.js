// url-polyfill.js

if (typeof global.URLSearchParams === 'undefined') {
  global.URLSearchParams = class URLSearchParams {
    constructor(init = '') {
      this._params = new Map();
      
      if (typeof init === 'string') {
        init = init.replace(/^\?/, '');
        if (init) {
          init.split('&').forEach(pair => {
            const [key, value = ''] = pair.split('=');
            if (key) {
              this._params.set(
                decodeURIComponent(key),
                decodeURIComponent(value)
              );
            }
          });
        }
      } else if (init && typeof init === 'object') {
        Object.entries(init).forEach(([key, value]) => {
          this._params.set(key, String(value));
        });
      }
    }
    
    get(name) {
      return this._params.get(name) || null;
    }
    
    set(name, value) {
      this._params.set(name, String(value));
    }
    
    has(name) {
      return this._params.has(name);
    }
    
    delete(name) {
      this._params.delete(name);
    }
    
    append(name, value) {
      this._params.set(name, String(value));
    }
    
    toString() {
      const pairs = [];
      this._params.forEach((value, key) => {
        pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
      });
      return pairs.join('&');
    }
    
    forEach(callback, thisArg) {
      this._params.forEach((value, key) => {
        callback.call(thisArg, value, key, this);
      });
    }
  };
}

if (typeof global.URL === 'undefined') {
  global.URL = class URL {
    constructor(url, base) {
      if (base && !url.match(/^[a-z][a-z0-9+.-]*:/i)) {
        const baseUrl = new URL(base);
        if (url.startsWith('/')) {
          url = baseUrl.origin + url;
        } else {
          const basePath = baseUrl.pathname.replace(/\/[^\/]*$/, '/');
          url = baseUrl.origin + basePath + url;
        }
      }
      
      this.href = url;
      
      const match = url.match(/^([a-z][a-z0-9+.-]*:)\/\/([^\/\?#:]*)(:(\d+))?(\/[^\?#]*)?(\?[^#]*)?(#.*)?$/i);
      
      if (match) {
        this.protocol = match[1];
        this.hostname = match[2];
        this.port = match[4] || '';
        this.pathname = match[5] || '/';
        this.search = match[6] || '';
        this.hash = match[7] || '';
        this.host = this.hostname + (this.port ? ':' + this.port : '');
        this.origin = this.protocol + '//' + this.host;
      } else {
        this.protocol = '';
        this.hostname = '';
        this.port = '';
        this.pathname = url;
        this.search = '';
        this.hash = '';
        this.host = '';
        this.origin = '';
      }
      
      this.searchParams = new URLSearchParams(this.search);
    }
    
    toString() {
      return this.href;
    }
    
    toJSON() {
      return this.href;
    }
  };
}

console.log('✅ URL polyfill loaded');