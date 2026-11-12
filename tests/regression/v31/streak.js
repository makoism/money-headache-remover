const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w, P, runTour } = require('/tmp/v22/lib.js');
(async () => {
  const theme = process.argv[2] || 'dark';
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844 });
  await p.goto('http://127.0.0.1:8788/#2026-11', { waitUntil: 'load' }); await w(600);
  await p.evaluate(t => { localStorage.setItem('money-map-theme', t); }, theme); await p.reload({ waitUntil: 'load' }); await w(900);
  await runTour(p, P.a); await w(1200);
  await p.type('#hAmt', '1200'); await p.evaluate(() => document.querySelector('#hForm').requestSubmit()); await w(6500);
  const sel = await p.evaluate(() => { const d = [...document.querySelectorAll('#p-home details')].find(x => /Streak/.test(x.textContent)); if (d) { d.open = true; } const h = [...document.querySelectorAll('#p-home h2')].find(x => x.textContent === 'Streak'); if (h) h.closest('.card, section, div').scrollIntoView({ block: 'start' }); return !!h; });
  await w(600); await p.screenshot({ path: `/tmp/v31/streak_${theme}.png` });
  await p.evaluate(() => { const h = [...document.querySelectorAll('#p-home h2')].find(x => /Badges/.test(x.textContent)); if (h) h.scrollIntoView({ block: 'start' }); });
  await w(400); await p.screenshot({ path: `/tmp/v31/badges_${theme}.png` });
  await p.evaluate(() => { const h = [...document.querySelectorAll('#p-home h2')].find(x => x.textContent === 'Goals'); if (h) h.scrollIntoView({ block: 'start' }); });
  await w(400); await p.screenshot({ path: `/tmp/v31/goals_${theme}.png` });
  console.log('streak found', sel);
  await b.close();
})();
