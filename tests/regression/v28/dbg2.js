const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w, P, runTour } = require('/tmp/v22/lib.js');
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844 });
  p.on('pageerror', e => console.log('PAGEERR', e.message)); p.on('console', m => console.log('console', m.type(), m.text().slice(0, 200)));
  await p.evaluateOnNewDocument(() => { try { if (!sessionStorage.getItem('__k')) { localStorage.clear(); indexedDB.deleteDatabase('money-map-safe'); } } catch (e) {} });
  await p.goto('file:///home/claude/work/money-map-team.html?s=2#2026-11', { waitUntil: 'load' }); await w(800);
  await runTour(p, P.a); await w(2000);
  await p.evaluate(() => { localStorage.removeItem('money-map-template-v2'); sessionStorage.setItem('__k', '1'); }); await p.reload({ waitUntil: 'load' }); await w(2000);
  console.log(await p.evaluate(() => window.__restoreErr)); console.log(await p.evaluate(() => ({ hbk: document.querySelector('#hBk').outerHTML.slice(0, 300), tab: document.querySelector('[role=tab][aria-selected=true]').id, tour: document.querySelector('#tour').hidden })));
  await b.close();
})();
