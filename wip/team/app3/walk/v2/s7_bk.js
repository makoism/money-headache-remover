const L = require('./lib.js'); const { w } = L;
(async () => {
  const c = await L.ctx(process.argv[2]); const p = c.pages()[0];
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await L.go(p, '2027-01-15'); const before = await L.home(p); const planB = await L.plan(p); const rcB = await L.rc(p);
  await L.tab(p, 'home');
  await p.click('#a3SetGo'); await w(300);
  await p.check('#a3BkLock'); await p.fill('#a3BkCode', 'abc12345');
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#a3BkSave')]);
  const f = process.cwd() + '/bk.json'; await dl.saveAs(f);
  console.log('saved', require('fs').statSync(f).size, await p.$eval('#a3SetMsg', e => e.textContent));
  await p.click('#a3SetClose'); await w(200);
  // a second tab on the same device
  const p2 = await c.newPage(); await L.go(p2, '2027-01-15');
  console.log('tab2 same home:', (await L.home(p2)) === before);
  console.log(await L.spend(p, 1000, 'Main bank', { note: 'tab1 coffee' }));
  console.log(await L.spend(p2, 2000, 'Card A', { note: 'tab2 book' }));
  console.log(await L.spend(p2, 500, 'Main bank', { note: 'tab2 snack' }));
  console.log('tab1 home:', (await L.home(p)).slice(0, 420));
  console.log('tab2 home:', (await L.home(p2)).slice(0, 420));
  console.log('tab1 rc:', (await L.rc(p)).slice(-400));
  await p2.reload(); await w(500); console.log('tab2 after reload:', (await L.home(p2)).slice(0, 420));
  // undo in tab1 of its own spend
  await p2.close();
  await c.close();
  // restore on a fresh device
  const c2 = await L.ctx(process.argv[3]); const q = c2.pages()[0];
  await L.go(q, '2027-01-15');
  await q.click('#a3SetGo'); await w(300);
  await q.setInputFiles('#a3BkFile', f); await w(800);
  await q.fill('#a3BkOpen', 'abc12345'); await q.click('#a3BkOpenGo'); await w(2000);
  console.log('ask:', await q.$eval('#a3BkAsk', e => e.innerText));
  await q.click('#a3BkGo'); await w(800);
  console.log('msg:', await q.$eval('#a3SetMsg', e => e.textContent));
  await q.click('#a3SetClose'); await w(200);
  console.log('restored home same:', (await L.home(q)) === before, 'plan same:', (await L.plan(q)) === planB, 'rc same:', (await L.rc(q)) === rcB);
  await q.reload(); await w(600); console.log('same after reload:', (await L.home(q)) === before);
  console.log(errs);
  await c2.close();
})().catch(e => { console.log('CRASH', e); process.exit(1); });
