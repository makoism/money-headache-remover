const L = require('./lib.js'); const { go, home, w } = L;
(async () => {
  const c = await L.ctx(process.argv[2]); const p1 = c.pages()[0] || await c.newPage(); const p2 = await c.newPage();
  await go(p1, '2026-12-12'); await go(p2, '2026-12-12');
  console.log('tab1', await L.spend(p1, 1000, 'Main bank', { note: 'tab1' }));
  console.log('tab2', await L.spend(p2, 2000, 'Main bank', { note: 'tab2' }));
  console.log('tab2 again', await L.spend(p2, 3000, 'Main bank', { note: 'tab2b' }));
  console.log('tab2 home', (await home(p2)).slice(0, 200));
  console.log('tab1 home', (await home(p1)).slice(0, 200));
  await p2.reload(); await w(500); console.log('tab2 after reload', (await home(p2)).slice(0, 200));
  await c.close();
})().catch(e => { console.log('CRASH', e); process.exit(1); });
