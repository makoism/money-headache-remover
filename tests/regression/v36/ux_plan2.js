const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w, P, runTour } = require('/tmp/v22/lib.js');
const fs = require('fs'); const OUT = '/tmp/v36/r'; let n = 0;
async function open(b, iso) {
  const p = await b.newPage(); const errs = []; await p.setViewport({ width: 390, height: 844 }); await p.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await p.evaluateOnNewDocument((iso) => {
    try { if (!sessionStorage.getItem('__keep')) { localStorage.clear(); indexedDB.deleteDatabase('money-map-safe'); } sessionStorage.setItem('__keep', '1'); } catch (e) {}
    const real = Date, fixed = new real(iso).getTime(), start = real.now();
    class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } }
    window.Date = D;
  }, iso);
  await p.goto('file:///home/claude/work/money-map-team.html?sfxtest&m=' + Math.random() + '#2026-12', { waitUntil: 'load' }); await w(800);
  return { p, errs };
}
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const { p, errs } = await open(b, '2026-12-03T10:00:00');
  const shot = async (name) => { n++; await p.screenshot({ path: `${OUT}/${String(n).padStart(2, '0')}-${name}.png` }); };
  const go = async (t) => { await p.evaluate(t => { const b = document.querySelector(`[data-tab="${t}"]`) || document.querySelector(`[data-tab-go="${t}"]`); b && b.click(); }, t); await w(450); };
  const click = async (sel) => p.evaluate(s => { const e = document.querySelector(s); if (!e) return false; e.scrollIntoView({ block: 'center' }); e.click(); return true; }, sel);
  const clickText = async (sel, re) => p.evaluate((s, r) => { const e = [...document.querySelectorAll(s)].find(x => new RegExp(r).test(x.textContent) && x.offsetParent); if (!e) return false; e.scrollIntoView({ block: 'center' }); e.click(); return true; }, sel, re);
  await runTour(p, P.a); await w(1200);
  // lines manager: open Necessities, then the link
  await go('month'); await click('#rt-nec'); await w(400);
  const lm = await clickText('#rb-nec button', 'Rename, remove or add lines'); console.log('lines manager opened', lm); await w(500); await shot('plan-lines-1'); await p.evaluate(() => scrollBy(0, 640)); await shot('plan-lines-2'); await p.evaluate(() => scrollBy(0, 640)); await shot('plan-lines-3');
  // receipts in Nov through the page's own state, then reload
  await p.evaluate(() => { const S = window.__t.S; for (let i = 1; i <= 6; i++) S.receipts.push({ id: 'rx' + i, d: '2026-11-' + String(i * 3).padStart(2, '0'), a: 1500, c: 'envelope', cn: 'Play money', n: '' }); S.ui.done = Object.assign({}, S.ui.done, { receipts: true }); window.__t.persist(); });
  await w(900);
  await p.reload({ waitUntil: 'load' }); await w(900);
  await go('home'); await shot('dec3-home'); await p.evaluate(() => scrollBy(0, 700)); await shot('dec3-home-2');
  const cards = await p.evaluate(() => [...document.querySelectorAll('#hNext, #hStatus, #hBk, .hnext')].filter(e => !e.hidden).map(e => e.id + ': ' + e.innerText.replace(/\s+/g, ' ').slice(0, 260)));
  console.log('dec3 cards:', cards);
  await p.evaluate(() => scrollTo(0, 0));
  const sw = await click('[data-sweep]'); console.log('sweep clicked', sw); await w(900); await shot('dec3-after-sweep');
  console.log('after sweep cards:', await p.evaluate(() => [...document.querySelectorAll('#hNext, #hStatus, .hnext')].filter(e => !e.hidden).map(e => e.id + ': ' + e.innerText.replace(/\s+/g, ' ').slice(0, 220))));
  const un = await click('[data-sweepundo]'); console.log('undo clicked', un); await w(600); await shot('dec3-after-undo');
  console.log('after undo cards:', await p.evaluate(() => [...document.querySelectorAll('#hNext, #hStatus, .hnext')].filter(e => !e.hidden).map(e => e.id + ': ' + e.innerText.replace(/\s+/g, ' ').slice(0, 220))));
  fs.writeFileSync(OUT + '/errs.json', JSON.stringify(errs, null, 1)); console.log('errs', errs);
  await b.close();
})();
