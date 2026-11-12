const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w, P, runTour } = require('/tmp/v22/lib.js');
const PAGE = process.argv[2], KEY = 'money-map-template-v2';
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const p = await b.newPage(), errs = []; await p.setViewport({ width: 390, height: 844 });
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await p.goto(PAGE + '?s=1#2026-11', { waitUntil: 'load' }); await w(800);
  const r = await runTour(p, P.a); await w(2000);
  const st = await p.evaluate(k => JSON.parse(localStorage.getItem(k)), KEY);
  console.log('seen', r.seen.length, r.seen.slice(-3).join(' | '), 'probs', r.probs);
  console.log('ui', JSON.stringify(st.ui)); console.log('receipts', (st.receipts || []).length, 'goals', st.plan.goals.map(g => g.name));
  console.log('tour open', await p.evaluate(() => !document.querySelector('#tour').hidden), 'errors', JSON.stringify(errs));
  await b.close();
})();
