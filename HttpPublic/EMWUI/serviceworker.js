// キャッシュ名とキャッシュファイルの指定
var CACHE_NAME = 'v2';
var cacheList = [
	'./css/material.min.css',
	'./js/hammer.min.js',
	'./js/jquery.hammer.js',
	'./js/jquery.ui.touch-punch.min.js',
	'./js/jquery-3.3.1.min.js',
	'./js/jquery-ui.min.js',
	'./js/material.min.js',
	'./material-symbols-outlined.woff2'
];

// インストール
self.addEventListener('install', function(event) {
	event.waitUntil(
		caches.open(CACHE_NAME).then(function(cache) {
			return cache.addAll(cacheList);
		})
  	);
});

// キャッシュロード
self.addEventListener('fetch', function(event) {
	// APIによるリクエストを除外
	if (event.request.destination === '') {
		return;
	}
	event.respondWith(
		caches.open(CACHE_NAME).then(function(cache) {
			return cache.match(event.request).then(function(response) {
				return response || fetch(event.request);
			});
		})
	);
})

// 古いキャッシュを削除
self.addEventListener('activate', function(event) { 
	event.waitUntil(
		caches.keys().then(function(cacheNames) {
			return Promise.all(
				cacheNames.filter(function(cacheName) {
					return cacheName !== CACHE_NAME;
				}).map(function(cacheName) {
					return caches.delete(cacheName);
				})
			);
		})
	);
});
