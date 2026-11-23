const L = require('./lib.js'); const { chromium } = require('/opt/node-tools/node_modules/playwright'); const { home, w } = L;
(async () => {
  const mk = d => chromium.launchPersistentContext(d, { executablePath: '/usr/bin/google-chrome', headless: true, viewport: { width: 390, height: 844 }, acceptDownloads: true });
  const c = await mk(process.argv[2]); const p = c.pages()[0];
  await L.go(p, '2027-01-15'); const before = await home(p);
  await p.click('#a3SetGo'); await w(300);
  console.log('settings device:', await p.$eval('#a3Space', e => e.textContent));
  await p.check('#a3BkLock'); await p.fill('#a3BkCode', 'abc12345');
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#a3BkSave')]);
  const f = process.cwd() + '/bk.json'; await dl.saveAs(f);
  console.log('saved', require('fs').statSync(f).size, await p.$eval('#a3SetMsg', e => e.textContent));
  await c.close();
  const c2 = await mk(process.argv[3]); const q = c2.pages()[0];
  await L.go(q, '2027-01-15');
  await q.click('#a3SetGo'); await w(300);
  await q.setInputFiles('#a3BkFile', f); await w(800);
  await q.fill('#a3BkOpen', 'abc12345'); await q.click('#a3BkOpenGo'); await w(2000);
  console.log('ask:', await q.$eval('#a3BkAsk', e => e.innerText));
  await q.click('#a3BkGo'); await w(800);
  console.log('msg:', await q.$eval('#a3SetMsg', e => e.textContent));
  await q.click('#a3SetClose'); await w(200);
  const after = await home(q);
  console.log('same home after restore:', after === before);
  await q.reload(); await w(600); console.log('same after reload:', (await home(q)) === before);
  // log a spend on the restored device and reload
  console.log(await L.spend(q, 1500, 'Card A'));
  await q.reload(); await w(600); console.log((await home(q)).slice(0, 300));
  // restore the same backup again over it, then put it back
  await q.click('#a3SetGo'); await w(300);
  await q.setInputFiles('#a3BkFile', f); await w(500); await q.fill('#a3BkOpen', 'abc12345'); await q.click('#a3BkOpenGo'); await w(2000);
  await q.click('#a3BkGo'); await w(800);
  console.log('kept line:', await q.$eval('#a3BkKept', e => e.innerText));
  await q.click('#a3BkBack'); await w(800); console.log('msg:', await q.$eval('#a3SetMsg', e => e.textContent));
  await q.click('#a3SetClose'); await w(200); await q.reload(); await w(600); console.log('after put back:', (await home(q)).slice(0, 300));
  await c2.close();
})().catch(e => { console.log('CRASH', e); process.exit(1); });
