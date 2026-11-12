const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w, P, runTour } = require('/tmp/v22/lib.js');
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await p.goto('http://127.0.0.1:8788/#2026-11', { waitUntil: 'load' }); await w(900);
  let here = false;
  await runTour(p, P.b, async () => { const t = await p.$eval('#tourTitle', e => e.textContent); if (!here && t === 'Split the rest') { here = true; throw new Error('stop'); } }).catch(() => {});
  await p.evaluate(() => { const r = document.querySelectorAll('#jarSplit input[type=range]')[1]; r.value = +r.value - 6; r.dispatchEvent(new Event('input', { bubbles: true })); }); await w(400);
  await p.screenshot({ path: '/tmp/v31/split_dark.png' });
  await p.evaluate(() => document.querySelector('#tourScroll').scrollTo(0, 420)); await w(300);
  await p.screenshot({ path: '/tmp/v31/split_dark2.png' });
  await b.close();
})();
