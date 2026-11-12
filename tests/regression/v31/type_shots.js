const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w, P, runTour } = require('/tmp/v22/lib.js');
(async () => {
  const theme = process.argv[2] || 'dark', persona = process.argv[3] || 'a', out = `/tmp/v31/type_${theme}_${persona}`; require('fs').mkdirSync(out, { recursive: true });
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844 });
  await p.goto('http://127.0.0.1:8788/#2026-11', { waitUntil: 'load' }); await w(600);
  await p.evaluate(t => { localStorage.setItem('money-map-theme', t); }, theme); await p.reload({ waitUntil: 'load' }); await w(1200);
  let n = 0; const want = /Welcome|Your money|Play money|Split the rest|done/i;
  await runTour(p, P[persona], async i => { const t = await p.$eval('#tourTitle', e => e.textContent); if (want.test(t)) { await w(400); await p.screenshot({ path: `${out}/t${++n}-${t.replace(/[^a-z0-9]+/gi, '_').slice(0, 16)}.png` }); } });
  await w(6500);
  await p.type('#hAmt', '1200'); await p.evaluate(() => document.querySelector('#hForm').requestSubmit()); await w(6500);
  for (const t of ['home', 'receipts', 'goals', 'month', 'basics']) { await p.evaluate(t => document.querySelector(`[data-tab="${t}"]`).click(), t); await w(700); await p.evaluate(() => window.scrollTo(0, 0)); await p.screenshot({ path: `${out}/${t}.png` }); }
  await b.close();
})();
