const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w, P, runTour } = require('/tmp/v22/lib.js');
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844 });
  p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.evaluateOnNewDocument(() => { try { if (!sessionStorage.getItem('__k')) { localStorage.clear(); indexedDB.deleteDatabase('money-map-safe'); } } catch (e) {} });
  await p.goto('file:///home/claude/work/money-map-team.html?s=4#2026-11', { waitUntil: 'load' }); await w(800);
  await runTour(p, P.a); await w(1500);
  await p.evaluate(() => document.querySelector('[data-tab="home"]').click()); await w(300);
  await p.type('#hAmt', '1200'); await p.evaluate(() => document.querySelector('#hForm').requestSubmit()); await w(1200);
  const st = () => p.evaluate(() => { const e = document.querySelector('#hBk'); const bt = e.querySelector('[data-bk-later]'); const r = bt && bt.getBoundingClientRect(); const top = r && document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return { hid: e.hidden, later: !!bt, rect: r && [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)], top: top && (top.id || top.className || top.tagName) }; });
  console.log('before', JSON.stringify(await st()));
  await p.click('#hBk [data-bk-later]'); await w(500);
  console.log('after p.click', JSON.stringify(await st()));
  await b.close();
})();
