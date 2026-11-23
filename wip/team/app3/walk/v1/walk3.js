const L = require('./lib.js'); const { go, home, w } = L;
(async () => {
  const c = await L.ctx(process.argv[2]); const p = c.pages()[0] || await c.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const show = async t => console.log('\n## ' + t + '\n' + (await home(p)));
  await go(p, '2026-12-10');
  await show('10 Dec before check');
  const r = await L.checkin(p, 398400, { 'Card A': 40000 });
  console.log(JSON.stringify(r, null, 1));
  await show('10 Dec after check');
  await p.reload(); await w(500); await show('10 Dec after reload');
  await go(p, '2026-12-11'); await show('11 Dec');
  await go(p, '2026-12-14'); await show('14 Dec');
  console.log('ERR', errs);
  await c.close();
})().catch(e => { console.log('CRASH', e); process.exit(1); });
