const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w, P, runTour } = require('/tmp/v22/lib.js');
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage(); await p.setViewport({ width: 1280, height: 820 });
  await p.goto('http://127.0.0.1:8788/?sfxtest#2026-11', { waitUntil: 'load' }); await w(800);
  await runTour(p, P.b); await w(1500);
  await p.type('#hAmt', '12'); await p.evaluate(() => document.querySelector('#hForm').requestSubmit()); await w(900);
  await p.evaluate(() => { document.querySelector('#hMore').open = true; window.scrollTo(0, 0); });
  await p.screenshot({ path: '/tmp/v33/lap_home.png', fullPage: true });
  await p.evaluate(() => document.querySelector('[data-tab="receipts"]').click()); await w(600);
  await p.screenshot({ path: '/tmp/v33/lap_receipts.png', fullPage: true });
  await p.evaluate(() => document.querySelector('[data-tab="home"]').click()); await w(400);
  await p.evaluate(() => __pix.celebrate('big', 'Goal full.')); await w(1200);
  await p.screenshot({ path: '/tmp/v33/lap_peek.png' });
  await b.close();
})();
