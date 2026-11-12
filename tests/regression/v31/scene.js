const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w, P, runTour } = require('/tmp/v22/lib.js');
(async () => {
  const theme = process.argv[2] || 'dark';
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const p = await b.newPage(); await p.setViewport({ width: 1100, height: 1000 });
  await p.goto('http://127.0.0.1:8788/#2026-11', { waitUntil: 'load' }); await w(600);
  await p.evaluate(t => { localStorage.setItem('money-map-theme', t); }, theme); await p.reload({ waitUntil: 'load' }); await w(900);
  await runTour(p, P.a, async i => { const t = await p.$eval('#tourTitle', e => e.textContent); if (/done/i.test(t)) { await w(5200); await p.screenshot({ path: `/tmp/v31/scene_${theme}.png` }); } });
  await b.close();
})();
