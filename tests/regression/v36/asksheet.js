const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const w = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844 }); await p.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
  await p.evaluateOnNewDocument(() => { try { localStorage.clear(); } catch (e) {} });
  await p.goto('http://127.0.0.1:8788/#2026-11', { waitUntil: 'load' }); await w(900);
  await p.evaluate(() => document.querySelector('#tourSkip').click()); await w(500);
  await p.click('#askBtn'); await w(1500); await p.screenshot({ path: '/tmp/v36/t/site-ask-open.png' });
  console.log('ask log', await p.evaluate(() => { const l = document.querySelector('#askLog'); return [l.scrollTop, l.scrollHeight, l.clientHeight]; }));
  await b.close();
})();
