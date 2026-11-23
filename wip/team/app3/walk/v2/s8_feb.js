const L = require('./lib.js');
(async () => {
  const c = await L.ctx(process.argv[2]); const p = c.pages()[0] || await c.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const show = async t => console.log('\n## ' + t + '\nHOME ' + (await L.home(p)));
  await L.go(p, '2027-01-20'); console.log(await L.spend(p, 7000, 'Card A', { note: 'jacket' }));
  await L.go(p, '2027-02-01'); console.log(await L.spend(p, 3000, 'Card B', { note: 'taxi' }));
  await L.go(p, '2027-02-09'); await show('9 Feb');
  await L.go(p, '2027-02-10'); await show('10 Feb');
  await L.go(p, '2027-02-15'); await show('15 Feb, no check since 15 Jan');
  const r = await L.checkin(p, { 'Main bank': 581100, 'Trip account': 22000 });
  console.log('CHECK 15 Feb', JSON.stringify(r));
  await show('15 Feb after check');
  await L.tab(p, 'plan'); await p.$$eval('details', ds => ds.forEach(d => d.open = true));
  console.log('\nPLAN', await L.txt(p, '#a3Plan'));
  await p.reload(); await L.w(500); await show('15 Feb after reload');
  console.log('ERR', errs);
  await c.close();
})().catch(e => { console.log('CRASH', e); process.exit(1); });
