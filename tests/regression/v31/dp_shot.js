const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w, P, runTour } = require('/tmp/v22/lib.js');
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await p.goto('http://127.0.0.1:8788/#2026-11', { waitUntil: 'load' }); await w(900);
  let done = false;
  await runTour(p, P.a, async () => { const t = await p.$eval('#tourTitle', e => e.textContent); if (!done && /^Trip/.test(t)) { done = true; const bx = await p.$('#tourGDue-btn'); if (bx) await bx.click(); await w(600); await p.screenshot({ path: '/tmp/v31/dp_dark.png' }); } });
  await b.close();
})();
