#!/usr/bin/env node
/* app3's service worker (sw3.js, DECISIONS_ROUND2 D6), served from a local server like the site.
   Once opened, the page is controlled by its worker; offline it opens from the kept copy; with a server that does not
   answer it opens within about 3 seconds from the kept copy; a new build's worker takes over, the page says a new
   version is ready and loads it when it next goes to the background; the money (IndexedDB) is not touched by any of it;
   the cloud's /api/ calls are never answered from the kept copy. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const fs = require('fs'), os = require('os'), path = require('path');
const { makeVault, serve } = require('./fake_vault.js');
(async () => {
  const html1 = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8'), sw1 = fs.readFileSync(path.join(__dirname, '../sw3.js'), 'utf8');
  let html = html1, sw = sw1, hang = false;
  const vault = makeVault();
  const s = await serve(vault, () => html, { sw: () => sw });
  // a server that does not answer the page (but still answers the worker's own file)
  const handlers = s.srv.listeners('request');
  s.srv.removeAllListeners('request');
  // what it holds is answered when it answers again (the page's manifest and icon asks too, M33): held forever, they would
  // fill Chrome's six connections to the server and the next build's worker could never fetch its files
  const held = [];
  s.srv.on('request', (q, r) => { if (hang && !q.url.startsWith('/sw3.js') && !q.url.startsWith('/api/')) { held.push([q, r]); return; } handlers.forEach(h => h(q, r)); });
  const URL = `http://127.0.0.1:${s.port}/?try=mako&today=2026-12-10`;
  const { b, p, errs } = await T.open({ profile: fs.mkdtempSync(path.join(os.tmpdir(), 'a3sw-')) });
  try {
    await p.goto(URL, { waitUntil: 'load' });
    await p.evaluate(() => navigator.serviceWorker.ready);
    await T.w(500);
    if (!(await p.evaluate(() => !!navigator.serviceWorker.controller))) { await p.reload({ waitUntil: 'load' }); await T.w(300); }
    ck('the page is controlled by its worker', await p.evaluate(() => !!navigator.serviceWorker.controller));
    const cacheName = await p.evaluate(() => caches.keys());
    ck('the kept copy is named by the build', cacheName.length === 1 && /^burrow3-[0-9a-f]{12}$/.test(cacheName[0]), cacheName.join(','));
    // offline
    await p.setOfflineMode(true);
    await p.reload({ waitUntil: 'load' }); await T.w(400);
    ck('offline, the page opens from the kept copy', /Safe to spend/.test(await p.$eval('#a3Home', e => e.textContent)));
    const api = await p.evaluate(() => fetch('/api/health').then(r => 'answered ' + r.status, () => 'no answer'));
    ck('the cloud\'s /api/ calls are never answered from the kept copy', api === 'no answer', api);
    await p.setOfflineMode(false);
    // a server that does not answer
    hang = true;
    const t0 = Date.now();
    await p.goto(URL, { waitUntil: 'load', timeout: 15000 }).catch(() => {});
    const took = Date.now() - t0;
    ck(`with no answer, it opens from the kept copy in about 3 seconds (${took} ms)`, took < 6000 && /Safe to spend/.test(await p.$eval('#a3Home', e => e.textContent)));
    hang = false; held.splice(0).forEach(([q, r]) => handlers.forEach(h => h(q, r)));
    // a new build
    html = html1.replace('<title>', '<title>build two: ');
    sw = sw1.replace(/burrow3-[0-9a-f]{12}/, 'burrow3-bbbbbbbbbbbb');
    await p.evaluate(() => navigator.serviceWorker.getRegistration().then(r => r.update()));
    const said = await (async () => { for (let i = 0; i < 60; i++) { const t = await p.$eval('#a3Msg', e => e.textContent); if (/new version/.test(t)) return true; await T.w(100); } return false; })();
    ck('a new build takes over and the page says a new version is ready', said);
    const nav = p.waitForNavigation({ waitUntil: 'load', timeout: 8000 }).catch(() => null);
    await p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
    await nav; await T.w(300);
    ck('it loads the new version when the page goes to the background', /^build two/.test(await p.title()), await p.title());
    const keys = await p.evaluate(() => caches.keys());
    ck('the older build\'s kept copy is removed', keys.length === 1 && keys[0] === 'burrow3-bbbbbbbbbbbb', keys.join(','));
    const own = errs.filter(e => !/Failed to load resource|ERR_INTERNET_DISCONNECTED|net::/.test(e));
    ck('no page errors', own.length === 0, own.join(' | '));
  } finally { await b.close(); await s.close(); }
  T.done('e3_sw');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
