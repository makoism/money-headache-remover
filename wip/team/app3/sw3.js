/* app3's service worker (DECISIONS_ROUND2 D6; the old app's public/sw.js, made smaller). Built by build3.sh into sw3.js
   next to index.html, with CACHE named by the build, so each new build is a new worker.
   - install: the page is fetched with { cache: 'reload' } (never an old copy from the browser's cache) and kept.
   - activate: older builds' caches are removed; the money is never here (it lives in IndexedDB), so nothing is lost.
   - fetch: the page is asked from the network first; with no answer in 3 seconds, or none at all, the kept copy is used.
     Calls to /api/ (the cloud copy, the relay) are never kept or answered from here. */
const CACHE = 'burrow3-d6094a1a373c';
const FILES = ['./', 'index.html', 'manifest3.webmanifest', 'icon3-192.png', 'icon3-512.png'];   // the page, and what installing it to the home screen reads (M33)
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(FILES.map(f => fetch(f, { cache: 'reload' }).then(r => { if (r.ok) return c.put(f, r); })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('burrow3-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || u.pathname.includes('/api/')) return;
  const kept = () => caches.match(r, { ignoreSearch: true }).then(m => m || caches.match('index.html'));
  const net = fetch(r).then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); } return res; });
  const slow = new Promise(ok => setTimeout(ok, 3000)).then(() => kept().then(m => m || net));
  e.respondWith(Promise.race([net.catch(() => kept()), slow]));
});
