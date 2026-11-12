const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w, P, runTour } = require('/tmp/v22/lib.js');
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 760, deviceScaleFactor: 2 });
  await p.goto('http://127.0.0.1:8788/#2026-11', { waitUntil: 'load' }); await w(900);
  await p.evaluate(() => { document.querySelector('#tourScroll').scrollTop = 200; }); await w(300); await p.screenshot({ path: '/tmp/v31/foot_phone_welcome.png' });
  await p.click('#tourNext'); await w(300); await p.click('#tourNext'); await w(500);
  await p.evaluate(() => { document.querySelector('#tourScroll').scrollTop = 99999; }); await w(300); await p.screenshot({ path: '/tmp/v31/foot_phone_stmt.png' });
  let shot = false;
  await runTour(p, P.a, async () => { const t = await p.$eval('#tourTitle', e => e.textContent); if (!shot && /done/i.test(t)) { shot = true; await w(400); await p.screenshot({ path: '/tmp/v31/foot_phone_done.png' }); } });
  await b.close();
})();
