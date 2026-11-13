/* Offline support. Your numbers are not stored here, they live in the browser's own storage, so updating this file never touches them.
   When you change any file in this folder, the CACHE name changes with every build so everyone gets the new version. */
const CACHE = 'money-headache-7530ee313c';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png', 'fonts/nunito-sans-latin.woff2', 'fonts/nunito-sans-latin-ext.woff2', 'fonts/fraunces-latin.woff2', 'fonts/fraunces-latin-ext.woff2', 'fonts/caveat-latin.woff2'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || /\.mp4$/.test(u.pathname)) return;
  e.respondWith(fetch(r).then(res => { const copy = res.clone(); if (res.ok) caches.open(CACHE).then(c => c.put(r, copy)); return res; }).catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || caches.match('index.html'))));
});
