const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w } = require('/tmp/v22/lib.js');
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage(); await p.setViewport({ width: 1372, height: 747, deviceScaleFactor: 1 });
  await p.goto('http://127.0.0.1:8788/#2026-11', { waitUntil: 'load' }); await w(900);
  await p.evaluate(() => { const d = document.querySelector('.tx-fold'); if (d) d.open = true; document.querySelector('#tour').scrollTop = 700; }); await w(400);
  const V = { asis: '', noblur: '.tour-foot::before{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}', nomask: '.tour-foot::before{mask-image:none!important;-webkit-mask-image:none!important}', none: '.tour-foot::before{display:none!important}' };
  for (const [k, css] of Object.entries(V)) {
    await p.evaluate(css => { let s = document.querySelector('#v'); if (!s) { s = document.createElement('style'); s.id = 'v'; document.head.appendChild(s); } s.textContent = css; }, css); await w(250);
    await p.screenshot({ path: `/tmp/v31/floor_${k}.png`, clip: { x: 380, y: 560, width: 620, height: 187 } });
  }
  await b.close();
})();
