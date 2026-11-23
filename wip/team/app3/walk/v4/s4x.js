const L = require('./lib.js');
(async () => {
  const mode = process.argv[3]; // move | no | skip
  const c = await L.ctx(process.argv[2]); const p = c.pages()[0] || await c.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const show = async t => console.log('\n## ' + t + '\nHOME ' + (await L.home(p)).slice(0, 520));
  await L.go(p, '2026-12-12'); console.log(await L.spend(p, 12000, 'Card A', { note: 'gift' }));
  await L.go(p, '2026-12-15');
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
    { date: '2026-12-13', text: 'TO TRIP ACCT', amount: 3000, dir: 'out', cat: 'transfer_out' },
    { date: '2026-12-14', text: 'FURIKOMI K TANAKA', amount: 10000, dir: 'out', cat: 'transfer_out' },
    { date: '2026-12-14', text: 'SUPER', amount: 2500, dir: 'out', cat: 'food' }];
  const reply = { statements: [{ account: 'Main bank', kind: 'bank', currency: 'JPY', period: { from: '2026-11-24', to: '2026-12-14' }, rows }] };
  await p.$eval('#a3StmtPaste', (e, v) => { e.value = v; }, JSON.stringify(reply));
  await p.click('#a3StmtCheck'); await L.w(600);
  const rv = await L.txt(p, '#a3Stmt');
  console.log('REVIEW HEAD:', rv.slice(0, 400));
  console.log('MOVES Q:', await L.txt(p, '#a3StmtMoves'));
  console.log('ADD btn:', await p.$eval('#a3StmtAdd', e => e.textContent + ' disabled=' + e.disabled));
  if (mode !== 'skip') {
    const sel = await p.$('[data-move]');
    const v = await p.$eval('[data-move]', (s, m) => { const o = [...s.options].find(o => m === 'no' ? o.value === 'no' : o.textContent.includes('Trip')); return o.value; }, mode);
    await p.selectOption('[data-move]', v); await L.w(500);
    console.log('ADD btn after answer:', await p.$eval('#a3StmtAdd', e => e.textContent + ' disabled=' + e.disabled));
    console.log('REVIEW HEAD 2:', (await L.txt(p, '#a3Stmt')).slice(0, 300));
  }
  const dis = await p.$eval('#a3StmtAdd', e => e.disabled);
  if (!dis) { await p.click('#a3StmtAdd'); await L.w(800); } else console.log('ADD DISABLED');
  await show('15 Dec after statement (' + mode + ')');
  console.log('\nRC', (await L.rc(p)).split('What you logged')[1]);
  await L.tab(p, 'plan'); console.log('GOAL', await L.txt(p, '[data-card=plan-goals]'));
  await p.reload(); await L.w(500); await show('after reload');
  await L.go(p, '2026-12-16');
  const r = await L.checkin(p, { 'Main bank': 316900, 'Trip account': mode === 'move' ? 38000 : 28000 });
  console.log('CHECK 16 Dec', JSON.stringify(r));
  await show('16 Dec after check');
  await L.tab(p, 'plan'); console.log('GOAL', await L.txt(p, '[data-card=plan-goals]'));
  console.log('\nRC', (await L.rc(p)).split('What you logged')[1]);
  console.log('ERR', errs);
  await c.close();
})().catch(e => { console.log('CRASH', e); process.exit(1); });
