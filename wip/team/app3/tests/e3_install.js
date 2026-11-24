#!/usr/bin/env node
/* Installed to the home screen (MAKO_SAYS M33: Android, Chrome, installed to the home screen).
   publish3.sh writes the page under a made-up private path (never the real one) into an empty folder; this serves it
   the way the site does and checks: the page links a web app manifest beside it; it parses; it says "The Burrow",
   standalone, with start_url, scope and id relative to its own folder, so it works under any private path; each icon
   (192 and 512, any and maskable, PNG) loads at its size; start_url resolves inside the page's own folder and inside the
   scope; app3's worker keeps the manifest and the icons, so they open offline too; Chrome itself finds no reason the page
   cannot be installed (the DevTools installability check); every file publish3.sh writes is one of the five named; and
   opened as a plain file, the page links no manifest (a file cannot read it, and would print an error). */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const fs = require('fs'), os = require('os'), path = require('path'), http = require('http');
const { spawnSync } = require('child_process');
const PATH = 'n/madeup0install1path2xyz';   // a made-up path; the real one is never in the repo
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.webmanifest': 'application/manifest+json', '.png': 'image/png' };
const WANT = ['icon3-192.png', 'icon3-512.png', 'index.html', 'manifest3.webmanifest', 'sw3.js'];
(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'a3inst-'));
  const r = spawnSync('bash', [path.join(__dirname, '../publish3.sh'), PATH], { encoding: 'utf8', env: Object.assign({}, process.env, { PUBLIC: tmp }) });
  ck('publish3.sh publishes to the made-up path', r.status === 0, r.stdout + r.stderr);
  const files = fs.existsSync(path.join(tmp, PATH)) ? fs.readdirSync(path.join(tmp, PATH)).sort() : [];
  ck('it writes the page, its worker, the manifest and two icons, nothing else', JSON.stringify(files) === JSON.stringify(WANT), files.join(','));
  const srv = http.createServer((q, res) => {
    const u = new URL(q.url, 'http://x');
    let p = path.join(tmp, decodeURIComponent(u.pathname));
    if (!p.startsWith(tmp)) { res.writeHead(404); res.end(); return; }
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
    if (!fs.existsSync(p)) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); res.end(fs.readFileSync(p));
  });
  await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
  const A = `http://127.0.0.1:${srv.address().port}/${PATH}/`;
  const { b, p, errs } = await T.open({ profile: fs.mkdtempSync(path.join(os.tmpdir(), 'a3instp-')) });
  try {
    await p.goto(A + '?try=mako&today=2026-12-10', { waitUntil: 'load' });
    const href = await p.evaluate(() => { const l = document.querySelector('link[rel="manifest"]'); return l ? l.href : null; });
    ck('the page links a manifest beside it', href === A + 'manifest3.webmanifest', href);
    const got = await p.evaluate(h => fetch(h).then(r => r.text()).catch(e => 'ERR ' + e), href || A + 'manifest3.webmanifest');
    let m = null; try { m = JSON.parse(got); } catch (e) { /* checked below */ }
    ck('the manifest parses', !!m, got.slice(0, 200));
    m = m || {};
    ck('its name is The Burrow', m.name === 'The Burrow' && m.short_name === 'The Burrow', m.name + ' / ' + m.short_name);
    ck('it opens standalone', m.display === 'standalone', m.display);
    ck('start_url, scope and id are relative, never a path of their own', ['start_url', 'scope', 'id'].every(k => typeof m[k] === 'string' && !/^\/|^[a-z]+:/i.test(m[k])), JSON.stringify([m.start_url, m.scope, m.id]));
    const base = href || A + 'manifest3.webmanifest';
    const start = new URL(m.start_url || 'x:', base).href, scope = new URL(m.scope || 'x:', base).href;
    ck('start_url resolves inside the page\'s own folder', start.startsWith(A), start);
    ck('and the scope is that folder', scope === A, scope);
    ck('start_url is inside the scope', start.startsWith(scope));
    ck('it names its colours', /^#[0-9a-f]{6}$/i.test(m.background_color || '') && /^#[0-9a-f]{6}$/i.test(m.theme_color || ''), m.background_color + ' ' + m.theme_color);
    const icons = Array.isArray(m.icons) ? m.icons : [];
    for (const size of [192, 512]) for (const purpose of ['any', 'maskable']) {
      const ic = icons.find(i => i.sizes === `${size}x${size}` && i.type === 'image/png' && String(i.purpose).split(' ').includes(purpose));
      ck(`an icon ${size} for ${purpose}`, !!ic, JSON.stringify(icons));
      if (!ic) continue;
      const u = new URL(ic.src, base).href;
      ck(`  its file is in the page's folder`, u.startsWith(A) && !/^\/|^[a-z]+:/i.test(ic.src), ic.src);
      const dim = await p.evaluate(src => new Promise(ok => { const i = new Image(); i.onload = () => ok([i.naturalWidth, i.naturalHeight]); i.onerror = () => ok(null); i.src = src; }), u);
      ck(`  it loads at ${size} by ${size}`, dim && dim[0] === size && dim[1] === size, JSON.stringify(dim));
    }
    // the worker keeps them
    await p.evaluate(() => navigator.serviceWorker.ready); await T.w(500);
    const kept = await p.evaluate(() => caches.keys().then(ks => Promise.all(ks.map(k => caches.open(k).then(c => c.keys())))).then(ls => ls.flat().map(q => q.url)));
    for (const f of ['manifest3.webmanifest', 'icon3-192.png', 'icon3-512.png']) ck(`the worker keeps ${f}`, kept.includes(A + f), kept.join(','));
    const sw = fs.readFileSync(path.join(tmp, PATH, 'sw3.js'), 'utf8');
    ck('the worker names them in its own list', ['manifest3.webmanifest', 'icon3-192.png', 'icon3-512.png'].every(f => sw.includes(`'${f}'`)));
    // Chrome's own installability check
    if (!(await p.evaluate(() => !!navigator.serviceWorker.controller))) { await p.reload({ waitUntil: 'load' }); await T.w(400); }
    const cdp = await p.createCDPSession();
    const inst = await cdp.send('Page.getInstallabilityErrors');
    ck('Chrome finds nothing that stops it being installed', inst.installabilityErrors.length === 0, JSON.stringify(inst.installabilityErrors));
    const man = await cdp.send('Page.getAppManifest');
    ck('Chrome reads the manifest with no errors', man.url === A + 'manifest3.webmanifest' && (man.errors || []).length === 0, JSON.stringify(man.errors));
    // offline, from the kept copy
    await p.setOfflineMode(true);
    const off = await p.evaluate(h => fetch(h).then(r => r.ok ? r.json().then(j => j.name) : 'status ' + r.status, e => 'ERR ' + e), A + 'manifest3.webmanifest');
    ck('offline, the manifest still opens', off === 'The Burrow', off);
    await p.setOfflineMode(false);
    ck('no page errors', errs.filter(e => !/Failed to load resource|ERR_INTERNET_DISCONNECTED/.test(e)).length === 0, errs.join(' | '));
    // opened as a plain file (the try copy), the page does not ask for a manifest it cannot read
    const f = await b.newPage(), ferrs = [];
    f.on('console', m => { if (m.type() === 'error') ferrs.push(m.text()); });
    await f.goto(T.URL0 + '?try=mako&today=2026-12-10', { waitUntil: 'load' }); await T.w(300);
    ck('as a plain file, no manifest link and no error', !(await f.$('link[rel="manifest"]')) && ferrs.length === 0, ferrs.join(' | '));
  } finally { await b.close(); srv.close(); fs.rmSync(tmp, { recursive: true, force: true }); }
  T.done('e3_install');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
