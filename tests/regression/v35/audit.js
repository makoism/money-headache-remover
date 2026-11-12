// Visual audit: every setup screen and every page, phone (390, dark) and laptop (1280, light).
const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w, P, runTour } = require('/tmp/v22/lib.js');
const PAGE = '/home/claude/work/money-map-team.html';
const DIR = '/tmp/v35/shots/';
async function run(width, scheme, tag) {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage(); await p.setViewport({ width, height: width < 600 ? 844 : 820, deviceScaleFactor: width < 600 ? 2 : 1 });
  await p.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: scheme }]);
  await p.evaluateOnNewDocument(iso => { try { if (!sessionStorage.getItem('__keep')) { localStorage.clear(); indexedDB.deleteDatabase('money-map-safe'); } sessionStorage.setItem('__keep', '1'); } catch (e) {}
    const real = Date, fixed = new real(iso).getTime(), start = real.now();
    class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, '2026-12-03T10:00:00');
  await p.goto('file://' + PAGE + '?sfxtest#2026-12', { waitUntil: 'load' }); await w(900);
  let n = 0; const shot = async (name, full) => { await p.screenshot({ path: `${DIR}${tag}_${String(n++).padStart(2, '0')}_${name}.png`, fullPage: !!full }); };
  await shot('video');
  await runTour(p, P.a, async () => {
    const t = (await p.$eval('#tourTitle', e => e.textContent)).replace(/[^a-z0-9]+/gi, '_').slice(0, 18);
    if (t === 'Trip' && await p.$('#tourGWhy')) { await p.type('#tourGWhy', 'A week in Hokkaido with Mum'); }
    await w(250); await shot('setup_' + t);
  });
  await w(1600);
  const coach = async () => { for (let i = 0; i < 12; i++) { const vis = await p.evaluate(() => { const c = document.querySelector('#co'); return !!c && !c.hidden && c.getBoundingClientRect().width > 0; }); if (!vis) break; await p.click('#coN').catch(() => {}); await w(150); } };
  await coach();
  const tab = t => p.evaluate(t => (document.querySelector(`[data-tab="${t}"]`) || document.querySelector(`[data-tab-go="${t}"]`)).click(), t);
  await tab('receipts'); await w(300);
  for (const [d, a] of [['2026-11-04', 4000], ['2026-11-11', 5000], ['2026-11-18', 6000], ['2026-11-25', 4000], ['2026-12-02', 1200]]) {
    await p.$eval('#rcDate', (e, v) => { e.value = v; e.dispatchEvent(new Event('change', { bubbles: true })); }, d);
    await p.$eval('#rcAmt', e => { e.value = ''; }); await p.type('#rcAmt', String(a)); await p.select('#rcCat', 'envelope'); await p.click('#rcSave'); await w(200);
  }
  await tab('home'); await w(2500); await p.evaluate(() => { document.querySelector('#hMore').open = true; window.scrollTo(0, 0); }); await w(300);
  await shot('home', true);
  await tab('receipts'); await w(500); await p.evaluate(() => window.scrollTo(0, 0)); await shot('receipts', true);
  await p.evaluate(() => { const d = document.querySelector('#scan details'); if (d) d.open = true; }); await p.click('#rcRemind button, [data-remind]').catch(() => {}); await w(400); await shot('receipts_open', true);
  await tab('goals'); await w(500); await p.evaluate(() => window.scrollTo(0, 0)); await shot('goals', true);
  await p.click('[data-gedit]').catch(() => {}); await w(300); await shot('goals_edit', true); await p.click('[data-gdone]').catch(() => {}); await w(200);
  await tab('month'); await w(500); await p.evaluate(() => window.scrollTo(0, 0)); await shot('month', true);
  await tab('months'); await w(500); await p.evaluate(() => window.scrollTo(0, 0)); await shot('months', true);
  await tab('basics'); await w(500); await p.evaluate(() => window.scrollTo(0, 0)); await shot('settings', true);
  await tab('home'); await w(300); await p.evaluate(() => window.scrollTo(0, 0));
  await p.click('#helpBtn').catch(() => {}); await w(400); await shot('help');
  await p.keyboard.press('Escape'); await w(200);
  await p.click('#askBtn, [data-ask]').catch(() => {}); await w(600); await shot('ask');
  await p.keyboard.press('Escape'); await w(200);
  await p.evaluate(() => { const b = document.querySelector('[data-gw]'); if (b) b.click(); }); await w(400); await shot('wizard');
  await b.close();
}
(async () => { await run(390, 'dark', 'ph'); await run(1280, 'light', 'lap'); console.log('done'); })().catch(e => { console.log('CRASH', e.message); process.exit(1); });
