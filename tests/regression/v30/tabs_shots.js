// every tab, full page, after a typed setup (persona a), phone width
const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w, P, runTour } = require('/tmp/v22/lib.js');
(async () => {
  const out = '/tmp/v30/tabs'; require('fs').mkdirSync(out, { recursive: true });
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844 });
  await p.goto('http://127.0.0.1:8788/#2026-11', { waitUntil: 'load' }); await w(900);
  await runTour(p, P.a); await w(1200);
  await p.type('#hAmt', '1200'); await p.evaluate(() => document.querySelector('#hForm').requestSubmit()); await w(900);
  for (const t of ['home', 'receipts', 'goals', 'month', 'basics']) {
    await p.evaluate(t => document.querySelector(`[data-tab="${t}"]`).click(), t); await w(700);
    await p.screenshot({ path: `${out}/${t}.png`, fullPage: true });
  }
  await p.evaluate(() => document.querySelector('#helpBtn').click()); await w(300); await p.screenshot({ path: `${out}/help.png` });
  await b.close();
})();
