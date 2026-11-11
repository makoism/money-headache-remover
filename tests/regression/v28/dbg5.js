const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w } = require('/tmp/v22/lib.js');
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844 });
  p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.evaluateOnNewDocument(() => { try { localStorage.clear(); indexedDB.deleteDatabase('money-map-safe'); } catch (e) {} });
  await p.goto('http://127.0.0.1:8788/#2026-11', { waitUntil: 'load' }); await w(800);
  for (let i = 0; i < 6; i++) {
    const st = await p.evaluate(() => { const n = document.querySelector('#tourNext'); const r = n.getBoundingClientRect(); return { title: document.querySelector('#tourTitle').textContent, next: n.textContent, disabled: n.disabled, hidden: n.hidden, rect: [r.x, r.y, r.width, r.height].map(Math.round), tourHidden: document.querySelector('#tour').hidden }; });
    console.log(i, JSON.stringify(st));
    if (i === 3) await p.screenshot({ path: '/tmp/v28/dbg5.png' });
    try { await p.click('#tourNext'); } catch (e) { console.log('click failed at step', i, e.message); await p.screenshot({ path: '/tmp/v28/dbg5_fail.png' }); break; }
    await w(500);
  }
  await b.close();
})();
