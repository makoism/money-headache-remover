const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w, P, runTour, launch } = require('/tmp/v22/lib.js');
const OUT = '/tmp/v36/t'; let n = 0;
(async () => {
  // light theme
  let { b, p, errs } = await launch(390, 844, 'light');
  const shot = async (name) => { n++; await p.screenshot({ path: `${OUT}/${String(n).padStart(2, '0')}-${name}.png` }); };
  await p.evaluate(() => localStorage.setItem('money-map-theme', 'light')); await p.reload({ waitUntil: 'load' }); await w(700);
  await shot('light-welcome'); await p.click('#tourNext'); await w(300); await shot('light-currency');
  await runTour(p, P.a); await w(1200); await p.evaluate(() => document.querySelector('[data-tab="home"]').click()); await w(400); await shot('light-home'); await p.evaluate(() => scrollBy(0, 760)); await shot('light-home-2');
  await p.evaluate(() => document.querySelector('[data-tab="month"]').click()); await w(400); await shot('light-plan');
  await p.evaluate(() => document.querySelector('[data-tab="receipts"]').click()); await w(400); await shot('light-receipts');
  // the coach on Home (dark)
  await p.evaluate(() => localStorage.setItem('money-map-theme', 'dark')); await p.reload({ waitUntil: 'load' }); await w(700);
  await p.evaluate(() => document.querySelector('[data-tab="home"]').click()); await w(300);
  await p.click('#helpBtn'); await w(300); await p.click('#helpTab'); await w(600); await shot('coach-1');
  for (let i = 0; i < 6; i++) { await p.evaluate(() => { const b = document.querySelector('#coNext'); b && b.click(); }); await w(350); await shot('coach-' + (i + 2)); }
  console.log('errs', errs);
  await b.close();
  // the Ask sheet on the site with the one-row suggestions
  b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  p = await b.newPage(); await p.setViewport({ width: 390, height: 844 }); await p.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
  await p.evaluateOnNewDocument(() => { try { localStorage.clear(); } catch (e) {} });
  await p.goto('http://127.0.0.1:8788/#2026-11', { waitUntil: 'load' }); await w(900);
  await p.evaluate(() => document.querySelector('#tourSkip').click()); await w(500);
  await p.click('#askBtn'); await w(1500); await shot('site-ask-open');
  console.log('ask log scrollTop', await p.evaluate(() => { const l = document.querySelector('#askLog'); return [l.scrollTop, l.scrollHeight, l.clientHeight]; }));
  await b.close();
})();
