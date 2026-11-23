const L = require('./lib.js');
(async () => {
  const c = await L.ctx(process.argv[2]); const p = c.pages()[0] || await c.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const show = async t => console.log('\n## ' + t + '\nHOME ' + (await L.home(p)));
  await L.go(p, '2027-01-08'); await show('8 Jan');
  await L.go(p, '2027-01-11'); await show('11 Jan before check');
  let r = await L.checkin(p, { 'Main bank': 282000, 'Trip account': 22000 }, { 'Card B': 14000 }, ['Main job']);
  console.log('CHECK 11 Jan', JSON.stringify(r));
  await show('11 Jan after check, main pay late');
  console.log('\nPLAN', await L.plan(p));
  await p.reload(); await L.w(500); await show('11 Jan after reload');
  await L.go(p, '2027-01-12'); await show('12 Jan');
  await L.go(p, '2027-01-13'); console.log(await L.spend(p, 2000, 'Main bank', { note: 'pay landed, lunch' })); await show('13 Jan');
  await L.go(p, '2027-01-15'); await show('15 Jan before check');
  r = await L.checkin(p, { 'Main bank': 442000, 'Trip account': 22000 }, { 'Card A': 18000 });
  console.log('CHECK 15 Jan', JSON.stringify(r));
  await show('15 Jan after check');
  await L.tab(p, 'plan'); await p.$$eval('details', ds => ds.forEach(d => d.open = true));
  console.log('\nPLAN', await L.txt(p, '#a3Plan'));
  console.log('\nRC', await L.rc(p));
  for (let i = 0; i < 3; i++) { await p.click('#rcOlder').catch(() => {}); await L.w(200); console.log('\nRC older', await L.txt(p, '#rcList')); }
  console.log('ERR', errs);
  await c.close();
})().catch(e => { console.log('CRASH', e); process.exit(1); });
