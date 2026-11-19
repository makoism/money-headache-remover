/* F3: the installable app and "A newer version is ready".
   Builds the app package (pwa/make_pwa.py) twice, version 1 and version 2 (only the version text differs), serves it on localhost, on a Pixel 5 sized page.
   Case B (app closed during the deploy, opened again with internet): the page already shows version 2, so no offer may appear.
   Case A (app open during the deploy, brought back): the page still shows version 1, so the offer must appear.
   Run: node tests/qc/phone_update.js   (needs bash tests/setup_env.sh first; uses the pwa/make_pwa.py in the repo) */
const fs = require('fs'), path = require('path'), http = require('http'), os = require('os'), { execFileSync } = require('child_process');
const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const w = ms => new Promise(r => setTimeout(r, ms));
const REPO = path.resolve(__dirname, '../../../..'), MAKE = path.join(REPO, 'pwa/make_pwa.py'), PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'phone-update-'));
function build(tag) {
  const html = fs.readFileSync(PAGE, 'utf8'), src = path.join(tmp, tag + '.html'), out = path.join(tmp, tag);
  fs.writeFileSync(src, html.replace(/(Version )([0-9.]+)/g, `$1$2${tag === 'v2' ? '.2' : '.1'}`));
  execFileSync('python3', [MAKE], { cwd: '/home/claude/work/pwa', env: Object.assign({}, process.env, { PWA_SRC: src, PWA_OUT: out, PWA_ART: tmp }), stdio: 'pipe' });
  return out;
}
let root = '';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.mp4': 'video/mp4' };
const server = http.createServer((q, s) => { let f = decodeURIComponent(q.url.split('?')[0]); if (f.endsWith('/')) f += 'index.html'; const fp = path.join(root, f); if (!fp.startsWith(root) || !fs.existsSync(fp)) { s.writeHead(404); s.end(); return; } s.writeHead(200, { 'Content-Type': TYPES[path.extname(fp)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }); fs.createReadStream(fp).pipe(s); });
(async () => {
  const fails = [], d1 = build('v1'), d2 = build('v2');
  await new Promise(r => server.listen(0, '127.0.0.1', r)); const URL0 = `http://127.0.0.1:${server.address().port}/`;
  const run = async (kase) => {
    root = d1; const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
    const errs = [], page = async () => { const p = await b.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.setViewport({ width: 393, height: 851, isMobile: true, hasTouch: true }); return p; };
    let p = await page(); await p.goto(URL0, { waitUntil: 'load' }); await p.evaluate(() => navigator.serviceWorker.ready); await p.reload({ waitUntil: 'load' }); await w(800);
    const ctl = await p.evaluate(() => !!navigator.serviceWorker.controller); if (!ctl) fails.push(`${kase}: version 1 is not controlled by its service worker`);
    const ver = q => q.evaluate(() => (document.querySelector('#verFoot').textContent.match(/Version [0-9.]+/) || [''])[0]);
    let res;
    if (kase === 'B') {
      await p.close(); root = d2; p = await page(); await p.goto(URL0, { waitUntil: 'load' }); await w(4000);
      res = { ver: await ver(p), offer: await p.evaluate(() => !document.querySelector('#upd').hidden) };
      if (!/\.2$/.test(res.ver)) fails.push(`B: the reopened app should show version 2, shows "${res.ver}"`);
      if (res.offer) fails.push('B: the app already shows the new version but still says "A newer version is ready"');
    } else {
      root = d2; await p.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); await r.update(); });
      let shown = false; for (let i = 0; i < 40 && !shown; i++) { await w(250); shown = await p.evaluate(() => !document.querySelector('#upd').hidden); }
      res = { ver: await ver(p), offer: shown };
      if (!/\.1$/.test(res.ver)) fails.push(`A: the open page should still show version 1, shows "${res.ver}"`);
      if (!shown) fails.push('A: the open page shows the old version but no "A newer version is ready" appeared');
    }
    console.log(`case ${kase}: page shows ${res.ver}, offer ${res.offer ? 'shown' : 'not shown'}`);
    if (errs.length) fails.push(`${kase}: ${errs.join(' | ').slice(0, 200)}`);
    await b.close();
  };
  try { await run('B'); await run('A'); } finally { server.close(); fs.rmSync(tmp, { recursive: true, force: true }); }
  if (fails.length) { fails.forEach(f => console.log('FAIL ' + f)); console.log('PHONE UPDATE FAIL'); process.exit(1); }
  console.log('PHONE UPDATE PASS');
})().catch(e => { console.log('FAIL ' + e.message); server.close(); process.exit(1); });
