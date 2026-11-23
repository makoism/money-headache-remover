const L = require('./lib.js'); const { ctx, go, home, w } = L;
(async () => {
  const c = await L.ctx(process.argv[2]); const p = c.pages()[0] || await c.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const show = async t => console.log('\n## ' + t + '\n' + (await home(p)));
  await go(p, '2026-11-22');
  console.log(await L.spend(p, 3000, 'Main bank', { note: 'groceries' }));
  console.log(await L.spend(p, 8000, 'Card A', { note: 'shoes' }));
  console.log(await L.spend(p, 5000, 'Card B', { note: 'dinner' }));
  await show('22 Nov after 3 spends');
  await go(p, '2026-11-25');
  console.log(await L.spend(p, 2000, 'Card A', { mode: 'refund', note: 'shoes partly back' }));
  await show('25 Nov after refund');
  await go(p, '2026-11-28'); await show('28 Nov, bills due 26-27 passed, no check');
  await go(p, '2026-12-09'); await show('9 Dec');
  console.log('ERR', errs);
  await c.close();
})().catch(e => { console.log('CRASH', e); process.exit(1); });
