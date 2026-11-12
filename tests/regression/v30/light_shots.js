const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w, P, runTour } = require('/tmp/v22/lib.js');
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844 });
  await p.evaluateOnNewDocument(() => { try { localStorage.setItem('money-map-theme', 'light'); } catch (e) {} });
  await p.goto('http://127.0.0.1:8788/#2026-11', { waitUntil: 'load' }); await w(900);
  let hit = false; await runTour(p, P.a, async () => { const t = await p.$eval('#tourTitle', e => e.textContent); if (t === 'Your statements' && !hit) { hit = true; await w(600); await p.screenshot({ path: '/tmp/v30/light_stmts.png' }); } }).catch(() => {});
  await w(1200);
  await p.screenshot({ path: '/tmp/v30/light_home.png', fullPage: true });
  await p.evaluate(() => document.querySelector('[data-tab="month"]').click()); await w(700); await p.screenshot({ path: '/tmp/v30/light_month.png' });
  await b.close();
})();
