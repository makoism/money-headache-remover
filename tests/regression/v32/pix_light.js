const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w, P, runTour } = require('/tmp/v22/lib.js');
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage(); await p.setViewport({ width: 1280, height: 820, deviceScaleFactor: 1 });
  await p.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
  await p.goto('http://127.0.0.1:8788/#2026-11', { waitUntil: 'load' }); await w(900);
  await runTour(p, P.b); await w(1500);
  await p.evaluate(() => { const s = document.querySelector('#setLook, [name=look]'); });
  // force Day look if a setting exists
  await p.evaluate(() => { localStorage.setItem('money-map-theme', 'light'); document.documentElement.setAttribute('data-theme', 'light'); });
  await w(300);
  await p.type('#hAmt', '12'); await p.evaluate(() => document.querySelector('#hForm').requestSubmit()); await w(4500);
  await p.evaluate(() => { document.querySelector('#hMore').open = true; });
  await p.screenshot({ path: '/tmp/v32/l_home.png', fullPage: true });
  for (const t of ['receipts', 'goals', 'basics']) { await p.evaluate(t => (document.querySelector(`[data-tab="${t}"]`) || document.querySelector(`[data-tab-go="${t}"]`)).click(), t); await w(600); await p.screenshot({ path: `/tmp/v32/l_${t}.png`, fullPage: t !== 'basics' }); }
  console.log(await p.evaluate(() => document.documentElement.dataset.theme || document.documentElement.className || getComputedStyle(document.body).backgroundColor));
  await b.close();
})();
