// screenshots of the screens changed tonight, on the local site (relay on), light and dark
const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w, P, runTour } = require('/tmp/v22/lib.js');
(async () => {
  const scheme = process.argv[2] || 'light', out = '/tmp/v29/s2_' + scheme; require('fs').mkdirSync(out, { recursive: true });
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844 }); await p.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: scheme }]);
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const shot = (n, full) => p.screenshot({ path: `${out}/${n}.png`, fullPage: !!full });
  await p.goto('http://127.0.0.1:8788/?s=' + scheme + '#2026-11', { waitUntil: 'load' }); await w(900);
  await shot('welcome');
  let done = false;
  await runTour(p, P.a, async () => {
    const t = await p.$eval('#tourTitle', e => e.textContent);
    if (t === 'Your numbers') { await p.click('.src-opt[data-src="upload"]'); await w(900); await shot('source-upload'); await p.evaluate(() => document.querySelector('.src-how').open = true); await shot('source-how', true); }
    if (/^Setup done/.test(t) && !done) { done = true; await p.evaluate(() => document.querySelector('.tour').scrollTo(0, 1e6)); await w(300); await shot('done-bottom'); await p.click('#tourVaultOn'); await w(1600); await shot('done-cloud'); }
  });
  await w(600);
  const coach = async () => { for (let i = 0; i < 9; i++) { const v = await p.evaluate(() => { const c = document.querySelector('#co'); return !!c && !c.hidden && c.getBoundingClientRect().width > 0; }); if (!v) break; await p.click('#coNext').catch(() => {}); await w(300); } };
  await coach(); await shot('home-top');
  await p.click('#askBtn'); await w(900); await shot('ask-open'); await p.click('#askClose'); await w(300);
  await p.evaluate(() => document.querySelector('[data-tab="receipts"]').click()); await w(600); await coach(); await shot('receipts-top');
  await p.evaluate(() => document.querySelector('[data-tab="basics"]').click()); await w(600); await coach();
  await p.evaluate(() => document.querySelector('#installBox').scrollIntoView()); await w(200); await shot('settings-install');
  await p.evaluate(() => document.querySelector('#vaultBox').scrollIntoView()); await w(200); await shot('settings-cloud');
  console.log('errs', JSON.stringify(errs));
  await b.close();
})();
