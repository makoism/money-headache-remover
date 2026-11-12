// nature theme check: the hill scene (reveal + ready), the streak card, the leaves mid-fall, the loan toggle leaves. Dark and light.
const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w, P, runTour } = require('/tmp/v22/lib.js');
(async () => {
  const theme = process.argv[2] || 'dark', out = '/tmp/v31/' + theme; require('fs').mkdirSync(out, { recursive: true });
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844 });
  await p.goto('http://127.0.0.1:8788/#2026-11', { waitUntil: 'load' }); await w(600);
  await p.evaluate(t => { localStorage.setItem('money-map-theme', t); }, theme); await p.reload({ waitUntil: 'load' }); await w(900);
  const shot = (n, o) => p.screenshot(Object.assign({ path: `${out}/${n}.png` }, o || {}));
  let n = 0;
  await runTour(p, P.a, async i => {
    const t = await p.$eval('#tourTitle', e => e.textContent);
    if (/Play money|done|Welcome/i.test(t)) { await w(500); await shot(`tour-${String(++n).padStart(2, '0')}-${t.replace(/[^a-z0-9]+/gi, '_').slice(0, 20)}`); }
  });
  await w(1200);
  // the first receipt: leaves mid-air
  await p.type('#hAmt', '1200'); await p.evaluate(() => document.querySelector('#hForm').requestSubmit()); await w(350); await shot('leaves-mid');
  await w(2500); await shot('home', { fullPage: true });
  await b.close();
})();
