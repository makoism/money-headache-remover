/* S1 (SECURITY_REVIEW.md): the service worker must never store or replay an /api/ answer (cloud copies, health). A dropped connection must fail, not hand back an old copy.
   Builds the app package (pwa/make_pwa.py) into its own folder, serves it on localhost with a small /api/vault/x and /api/health, on a Pixel 5 sized page.
   An old cache holding an /api/ answer (as left by a worker before this fix) must be emptied of it when the new worker takes over.
   Run: node tests/qc/phone_sw_api.js */
const fs = require('fs'), path = require('path'), http = require('http'), os = require('os'), { execFileSync } = require('child_process');
const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const w = ms => new Promise(r => setTimeout(r, ms));
const REPO = path.resolve(__dirname, '../../../..'), MAKE = path.join(REPO, 'pwa/make_pwa.py'), PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'phone-swapi-')), out = path.join(tmp, 'dist');
execFileSync('python3', [MAKE], { cwd: '/home/claude/work/pwa', env: Object.assign({}, process.env, { PWA_SRC: PAGE, PWA_OUT: out, PWA_ART: tmp }), stdio: 'pipe' });
let n = 0, drop = false;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' };
const server = http.createServer((q, s) => {
  const u = q.url.split('?')[0];
  if (u.startsWith('/api/')) { if (drop) { s.destroy(); return; } n++; s.writeHead(200, { 'Content-Type': 'application/json' }); s.end(JSON.stringify({ copy: n })); return; }
  let f = decodeURIComponent(u); if (f.endsWith('/')) f += 'index.html'; const fp = path.join(out, f);
  if (!fp.startsWith(out) || !fs.existsSync(fp)) { s.writeHead(404); s.end(); return; }
  s.writeHead(200, { 'Content-Type': TYPES[path.extname(fp)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }); fs.createReadStream(fp).pipe(s);
});
(async () => {
  const fails = []; await new Promise(r => server.listen(0, '127.0.0.1', r)); const URL0 = `http://127.0.0.1:${server.address().port}/`;
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  try {
    const p = await b.newPage(); await p.setViewport({ width: 393, height: 851, isMobile: true, hasTouch: true });
    /* an old cache from before the fix, holding a cloud copy; the new worker must clear it */
    await p.goto(URL0 + 'manifest.webmanifest');
    await p.evaluate(async () => { const c = await caches.open('money-headache-old0000001'); await c.put('/api/vault/x', new Response('{"copy":0}')); });
    await p.goto(URL0, { waitUntil: 'load' }); await p.evaluate(() => navigator.serviceWorker.ready); await p.reload({ waitUntil: 'load' }); await w(800);
    if (!(await p.evaluate(() => !!navigator.serviceWorker.controller))) fails.push('the page is not controlled by its service worker');
    const get = u => p.evaluate(async u => { try { const r = await fetch(u); return (await r.json()).copy; } catch (e) { return 'failed'; } }, u);
    const a1 = await get('/api/vault/x'), h1 = await get('/api/health');
    await w(300);
    const stored = await p.evaluate(async () => { const out = []; for (const k of await caches.keys()) { const c = await caches.open(k); for (const r of await c.keys()) if (new URL(r.url).pathname.startsWith('/api/')) out.push(k + ' ' + new URL(r.url).pathname); } return out; });
    if (stored.length) fails.push(`/api/ answers are in the cache: ${stored.join(', ')}`);
    drop = true;
    const a2 = await get('/api/vault/x'), h2 = await get('/api/health');
    if (a2 !== 'failed') fails.push(`with the connection dropped, /api/vault/x gave back copy ${a2} instead of failing`);
    if (h2 !== 'failed') fails.push(`with the connection dropped, /api/health gave back copy ${h2} instead of failing`);
    console.log(`online: vault copy ${a1}, health copy ${h1}; dropped: vault ${a2}, health ${h2}; /api/ in cache: ${stored.length}`);
    drop = false; await p.reload({ waitUntil: 'load' }); await w(500);
    if (!/the burrow/i.test(await p.title())) fails.push('the page itself no longer loads through the worker');
  } finally { await b.close(); server.close(); fs.rmSync(tmp, { recursive: true, force: true }); }
  if (fails.length) { fails.forEach(f => console.log('FAIL ' + f)); console.log('PHONE SW API FAIL'); process.exit(1); }
  console.log('PHONE SW API PASS');
})().catch(e => { console.log('FAIL ' + e.message); server.close(); process.exit(1); });
