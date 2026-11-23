const L = require('./lib.js');
(async () => {
  const B = process.argv[3] === 'B', off = B ? 4800 : 0;
  const c = await L.ctx(process.argv[2]); const p = c.pages()[0] || await c.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const show = async t => console.log('\n## ' + t + '\nHOME ' + (await L.home(p)));
  await L.go(p, '2026-12-12'); console.log(await L.spend(p, 12000, 'Card A', { note: 'gift' }));
  await L.go(p, '2026-12-15'); await show('15 Dec before statement');
  await L.tab(p, 'home');
  await p.$eval('#a3StmtGo', e => e.click()); await L.w(300);
  await p.click('#a3StmtAny summary'); await L.w(100);
  const rows = [
    { date: '2026-11-24', text: 'SUPER', amount: 3000, dir: 'out', cat: 'food' },
    { date: '2026-11-26', text: 'DENKI POWER', amount: 7400, dir: 'out', cat: 'util' },
    { date: '2026-11-27', text: 'RENT', amount: 72000, dir: 'out', cat: 'rent' },
    { date: '2026-11-27', text: 'NET', amount: 5200, dir: 'out', cat: 'net' },
    { date: '2026-12-01', text: 'TO TRIP ACCT', amount: 20000, dir: 'out', cat: 'transfer_out' },
    { date: '2026-12-05', text: 'TO TRIP ACCT', amount: 5000, dir: 'out', cat: 'transfer_out' },
    { date: '2026-12-06', text: 'FOOD MART', amount: 4000, dir: 'out', cat: 'food' },
    { date: '2026-12-10', text: 'SALARY MAIN', amount: 180000, dir: 'in', cat: 'pay' },
    { date: '2026-12-10', text: 'CARD A PAYMENT', amount: 54000, dir: 'out', cat: 'card_payment' },
    { date: '2026-12-11', text: 'SIDE JOB', amount: 60000, dir: 'in', cat: 'pay' },
    { date: '2026-12-11', text: 'CARD B PAYMENT', amount: 23000, dir: 'out', cat: 'card_payment' },
    { date: '2026-12-14', text: 'SUPER', amount: 2500, dir: 'out', cat: 'food' }];
  if (B) rows.splice(2, 0, { date: '2026-11-26', text: 'PHONE CO', amount: 4800, dir: 'out', cat: 'phone' });
  const reply = { statements: [{ account: 'Main bank', kind: 'bank', currency: 'JPY', period: { from: '2026-11-24', to: '2026-12-14' }, rows }] };
  await p.$eval('#a3StmtPaste', (e, v) => { e.value = v; }, JSON.stringify(reply));
  await p.click('#a3StmtCheck'); await L.w(600);
  console.log('REVIEW:', (await L.txt(p, '#a3Stmt')).slice(0, 2500));
  const dis = await p.$eval('#a3StmtAdd', e => e.disabled);
  if (!dis) { await p.click('#a3StmtAdd'); await L.w(800); } else console.log('ADD DISABLED');
  await show('15 Dec after statement');
  console.log('\nRC', await L.rc(p));
  await L.tab(p, 'plan'); await p.$$eval('details', ds => ds.forEach(d => d.open = true));
  console.log('\nPLAN', await L.txt(p, '#a3Plan'));
  await p.reload(); await L.w(500); await show('15 Dec after reload');
  await L.go(p, '2026-12-16'); await show('16 Dec before check');
  const r = await L.checkin(p, { 'Main bank': 329900 - off, 'Trip account': 25000 });
  console.log('CHECK 16 Dec', JSON.stringify(r));
  await show('16 Dec after check');
  console.log('\nRC', await L.rc(p));
  console.log('ERR', errs);
  await c.close();
})().catch(e => { console.log('CRASH', e); process.exit(1); });
