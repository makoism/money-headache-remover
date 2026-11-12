const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w, P, runTour } = require('/tmp/v22/lib.js');
(async () => {
  const theme = process.argv[2] || 'dark';
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844 });
  await p.goto('http://127.0.0.1:8788/#2026-11', { waitUntil: 'load' }); await w(600);
  await p.evaluate(t => { localStorage.setItem('money-map-theme', t); }, theme); await p.reload({ waitUntil: 'load' }); await w(900);
  let done = false;
  await runTour(p, P.b, async i => {
    const t = await p.$eval('#tourTitle', e => e.textContent);
    if (!done && /loan/i.test(t)) { done = true; await p.click('#loanSw'); await w(160); await p.screenshot({ path: `/tmp/v31/loan_${theme}.png` }); await w(900); await p.screenshot({ path: `/tmp/v31/loan2_${theme}.png` }); }
  });
  console.log('loan seen', done);
  await b.close();
})();
