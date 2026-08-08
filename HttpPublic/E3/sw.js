const CACHE_NAME = 'e3-pwa-cache-v2';
const ASSETS = [
  './',
  './index.html',
  './js/app.js',
  './css/style.css',
  './css/ts-loader.css',
  './css/beer.min.css',
  './js/beer.min.js',
  './js/material-dynamic-colors.min.js',
  './js/danmaku.js',
  './js/hls.min.js',
  './js/aribb24.js',
  './js/intersect.min.js',
  './js/alpine.min.js',
  './Kosugi-Regular.woff2',
  './KosugiMaru-Bold.woff2',
  './KosugiMaru-Regular.woff2',
  './img/apple-touch-icon.png',
  './img/android-chrome-192x192.png',
  './img/android-chrome-512x512.png',
  './img/EpgTimer.ico'
];

// タイムアウト付きフェッチ (デフォルト 2000ms)
function fetchWithTimeout(request, timeoutMs = 2000) {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const signal = controller.signal;
    const timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error('Fetch timeout'));
    }, timeoutMs);

    fetch(request, { signal })
      .then((response) => {
        clearTimeout(timeoutId);
        resolve(response);
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        reject(err);
      });
  });
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch((err) => {
        console.warn('Pre-caching failed, but service worker will still install:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // 動的APIやluaスクリプト、GET以外のリクエストはキャッシュ処理から除外する
  if (
    url.pathname.includes('/api/') ||
    url.pathname.endsWith('.lua') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  // フォント、画像、サードパーティライブラリ(.min.)はキャッシュ優先(Cache-First)
  const isCacheFirstAsset =
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.includes('.min.');

  if (isCacheFirstAsset) {
    event.respondWith(
      caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetchWithTimeout(event.request).then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              const cleanUrl = url.origin + url.pathname;
              cache.put(cleanUrl, responseToCache);
            });
          }
          return response;
        });
      })
    );
  } else {
    // index.html, style.css, app.js などの独自ロジックはネットワーク優先(Network-First)
    event.respondWith(
      fetchWithTimeout(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              const cleanUrl = url.origin + url.pathname;
              cache.put(cleanUrl, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request, { ignoreSearch: true });
        })
    );
  }
});
