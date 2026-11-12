const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w, P, runTour } = require('/tmp/v22/lib.js');
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await p.goto('http://127.0.0.1:8788/#2026-11', { waitUntil: 'load' }); await w(900);
  let shot = false;
  await runTour(p, P.b, async () => { const t = await p.$eval('#tourTitle', e => e.textContent); if (!shot && /done/i.test(t)) { shot = true; await w(700); await p.screenshot({ path: '/tmp/v32/s_done.png' }); } });
  await w(1500);
  await p.type('#hAmt', '12'); await p.evaluate(() => document.querySelector('#hForm').requestSubmit()); await w(900);
  await p.evaluate(() => window.scrollTo(0, 0)); await p.screenshot({ path: '/tmp/v32/s_home.png' });
  await p.evaluate(() => { document.querySelector('#hMore').open = true; document.querySelector('#hStreak').scrollIntoView({ block: 'start' }); }); await w(400); await p.screenshot({ path: '/tmp/v32/s_streak.png' });
  for (const t of ['receipts', 'goals', 'month', 'months', 'basics']) { await p.evaluate(t => (document.querySelector(`[data-tab="${t}"]`) || document.querySelector(`[data-tab-go="${t}"]`)).click(), t); await w(800); await p.evaluate(() => window.scrollTo(0, 0)); await p.screenshot({ path: `/tmp/v32/s_${t}.png`, fullPage: t !== 'basics' }); }
  await b.close();
})();
