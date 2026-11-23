#!/usr/bin/env node
/* The private publish (DECISIONS_ROUND2 BG1, BG2): app3/publish3.sh copies the built page into public/<path>/ under a
   path given as an argument. This test publishes into a temporary copy of public/ under a made-up path (never the real
   one), then serves that folder the way the site's worker does (wrangler.toml, worker/index.js): /api/* goes to the API
   (here the local fake vault and health), everything else is a static file from public/, a folder answers with its
   index.html, a folder asked without its last slash is sent to it with the slash, anything else is 404.
   It checks: bad paths are refused; only files under the path change, the root page and the old service worker stay
   byte for byte; with the old app's service worker (scope /) already installed, as on Mako's phone, the app3 path opens
   app3 (never the old page), its own worker is scoped to the path and controls it; it opens offline after the first load
   and after a reload; the root still opens the old app under the old worker; /api/ calls from the app3 path reach the
   same address; the published page says noindex and sends no referrer. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const fs = require('fs'), os = require('os'), path = require('path'), http = require('http'), crypto = require('crypto');
const { spawnSync } = require('child_process');
const { makeVault } = require('./fake_vault.js');
const PUB = path.join(__dirname, '../../../../public');
const PATH = 'n/madeup0test1path2xyz';   // a made-up path; the real one is never in the repo
const sha = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
function list(dir, base) { let out = []; for (const f of fs.readdirSync(dir)) { const p = path.join(dir, f), r = path.join(base || '', f); out = out.concat(fs.statSync(p).isDirectory() ? list(p, r) : [r]); } return out; }
/* the worker's rules: /api/* to the API, the rest from the assets folder */
function site(root, vault) {
  return http.createServer((q, r) => {
    const u = new URL(q.url, 'http://x');
    if (u.pathname.startsWith('/api/')) {
      if (u.pathname === '/api/health') { r.writeHead(200, { 'content-type': 'application/json' }); r.end(JSON.stringify({ ok: true, ai: true, vault: true })); return; }
      const m = /^\/api\/vault\/([^/]+)\/?$/.exec(u.pathname);
      if (!m) { r.writeHead(404, { 'content-type': 'application/json' }); r.end('{"error":{"code":"not_found"}}'); return; }
      let body = ''; q.on('data', c => { body += c; }); q.on('end', () => { const a = vault.handle(q.method, m[1], q.headers['x-vault-token'], body ? JSON.parse(body) : null); r.writeHead(a.status, { 'content-type': 'application/json' }); r.end(JSON.stringify(a.j)); });
      return;
    }
    let p = path.join(root, decodeURIComponent(u.pathname));
    if (!p.startsWith(root)) { r.writeHead(404); r.end(); return; }
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
      if (!u.pathname.endsWith('/')) { r.writeHead(307, { location: u.pathname + '/' + u.search }); r.end(); return; }
      p = path.join(p, 'index.html');
    }
    if (!fs.existsSync(p) || !fs.statSync(p).isFile()) { r.writeHead(404); r.end('not found'); return; }
    r.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream', 'cache-control': 'public, max-age=0, must-revalidate' });
    r.end(fs.readFileSync(p));
  });
}
(async () => {
  /* a copy of public/ without the large videos (the old worker does not keep them) */
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'a3pub-'));
  for (const f of list(PUB)) { if (/\.(mp4|jpg)$/.test(f)) continue; fs.mkdirSync(path.dirname(path.join(tmp, f)), { recursive: true }); fs.copyFileSync(path.join(PUB, f), path.join(tmp, f)); }
  const before = Object.fromEntries(list(tmp).map(f => [f, sha(path.join(tmp, f))]));
  const pub = (arg, env) => spawnSync('bash', [path.join(__dirname, '../publish3.sh'), arg], { encoding: 'utf8', env: Object.assign({}, process.env, { PUBLIC: tmp }, env || {}) });

  /* bad paths are refused, and nothing is written */
  for (const bad of ['', '/', '..', 'n/../x', 'api/x', 'n/a b', 'N/UPPER', 'sw.js', 'icons', 'n']) {
    const r = pub(bad);
    ck(`the path "${bad}" is refused`, r.status !== 0, r.stdout + r.stderr);
  }
  ck('a refused path writes nothing', list(tmp).length === Object.keys(before).length);
  const r = pub(PATH);
  ck('publish3.sh publishes to the path', r.status === 0, r.stdout + r.stderr);
  const after = list(tmp);
  const changed = after.filter(f => before[f] !== sha(path.join(tmp, f)));
  ck('only files under the path were written', changed.length > 0 && changed.every(f => f.startsWith(PATH + '/')), changed.join(','));
  ck('the root page and the old worker are byte for byte the same', before['index.html'] === sha(path.join(tmp, 'index.html')) && before['sw.js'] === sha(path.join(tmp, 'sw.js')));
  ck('the page and its worker are there', ['index.html', 'sw3.js'].every(f => fs.existsSync(path.join(tmp, PATH, f))));
  const html = fs.readFileSync(path.join(tmp, PATH, 'index.html'), 'utf8');
  ck('the published page says noindex and sends no referrer', /<meta name="robots" content="noindex, nofollow">/.test(html) && /<meta name="referrer" content="no-referrer">/.test(html));
  const sw = fs.readFileSync(path.join(tmp, PATH, 'sw3.js'), 'utf8');
  ck('the published worker is named by a build', /const CACHE = 'burrow3-[0-9a-f]{12}';/.test(sw));
  { const h1 = sha(path.join(tmp, PATH, 'index.html')), w1 = sha(path.join(tmp, PATH, 'sw3.js')); ck('publishing again gives the same files', pub(PATH).status === 0 && sha(path.join(tmp, PATH, 'index.html')) === h1 && sha(path.join(tmp, PATH, 'sw3.js')) === w1); }

  /* the site */
  const vault = makeVault(), srv = site(tmp, vault);
  await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
  const O = `http://127.0.0.1:${srv.address().port}`;
  const { b, p, errs } = await T.open({ profile: fs.mkdtempSync(path.join(os.tmpdir(), 'a3pubp-')) });
  try {
    /* the old app first, as on Mako's phone: its worker (scope /) is installed */
    await p.goto(O + '/', { waitUntil: 'load' });
    const oldTitle = await p.title();
    await p.evaluate(() => navigator.serviceWorker.ready);
    await T.w(300);
    const oldReg = await p.evaluate(() => navigator.serviceWorker.getRegistration().then(r => r && r.scope));
    ck('the old app\'s worker is installed with scope /', oldReg === O + '/', oldReg);

    /* the app3 path */
    const A = O + '/' + PATH + '/';
    const nav = await p.goto(O + '/' + PATH + '?try=mako&today=2026-12-10', { waitUntil: 'load' });
    ck('the path without its last slash is sent to it', p.url().startsWith(A) && nav.ok());
    ck('the app3 path opens app3, not the old page', /Safe to spend/.test(await p.$eval('#a3Home', e => e.textContent).catch(() => '')) && (await p.title()) !== oldTitle);
    await p.evaluate(() => navigator.serviceWorker.getRegistration().then(r => r && r.active ? true : new Promise(ok => navigator.serviceWorker.addEventListener('controllerchange', ok, { once: true }))));
    let ctl = null;
    for (let i = 0; i < 40 && !(ctl && ctl.endsWith('/sw3.js')); i++) { await T.w(100); ctl = await p.evaluate(() => navigator.serviceWorker.controller && navigator.serviceWorker.controller.scriptURL); }
    ck('app3\'s own worker controls the path', ctl === A + 'sw3.js', ctl);
    const scope = await p.evaluate(() => navigator.serviceWorker.getRegistration(location.href).then(r => r.scope));
    ck('its scope is the path, never /', scope === A, scope);
    const api = await p.evaluate(() => fetch(location.origin + '/api/health').then(r => r.json()).then(j => j.vault === true, () => false));
    ck('/api/ calls from the path reach the same address', api);

    /* offline after the first load, and after a reload */
    await p.setOfflineMode(true);
    await p.reload({ waitUntil: 'load' }); await T.w(400);
    ck('offline, the app3 path opens app3 from its own kept copy', /Safe to spend/.test(await p.$eval('#a3Home', e => e.textContent).catch(() => '')));
    await p.reload({ waitUntil: 'load' }); await T.w(400);
    ck('and again after another reload', /Safe to spend/.test(await p.$eval('#a3Home', e => e.textContent).catch(() => '')));
    await p.setOfflineMode(false);
    await p.reload({ waitUntil: 'load' }); await T.w(400);
    ck('online again, it reloads', /Safe to spend/.test(await p.$eval('#a3Home', e => e.textContent).catch(() => '')));

    /* the root is untouched */
    await p.goto(O + '/', { waitUntil: 'load' }); await T.w(300);
    ck('the root still opens the old app', (await p.title()) === oldTitle && !(await p.$('#a3Home')));
    const rootCtl = await p.evaluate(() => navigator.serviceWorker.controller && navigator.serviceWorker.controller.scriptURL);
    ck('under the old worker', rootCtl === O + '/sw.js', rootCtl);
    const own = errs.filter(e => !/Failed to load resource|net::ERR_INTERNET_DISCONNECTED/.test(e));
    ck('no page errors on the app3 path', own.filter(e => !/^console:/.test(e) || /a3|burrow3/.test(e)).length === 0, own.join(' | '));
  } finally { await b.close(); srv.close(); fs.rmSync(tmp, { recursive: true, force: true }); }
  T.done('e3_publish');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
