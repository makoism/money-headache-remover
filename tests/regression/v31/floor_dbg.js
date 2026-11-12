const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w } = require('/tmp/v22/lib.js');
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage(); await p.setViewport({ width: 1372, height: 747, deviceScaleFactor: 1 });
  await p.goto('http://127.0.0.1:8788/#2026-11', { waitUntil: 'load' }); await w(900);
  await p.evaluate(() => { const d = document.querySelector('.tx-fold'); if (d) d.open = true; document.querySelector('#tourScroll').scrollTop = 700; }); await w(400);
  await p.screenshot({ path: '/tmp/v31/floor_welcome.png' });
  await p.click('#tourNext'); await w(300); await p.click('#tourNext'); await w(500);
  await p.evaluate(() => { document.querySelector('#tourScroll').scrollTop = 99999; }); await w(300); await p.screenshot({ path: '/tmp/v31/floor_stmt.png' });
  await b.close();
})();
