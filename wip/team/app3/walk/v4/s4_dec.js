const L = require('./lib.js');
(async () => {
  const c = await L.ctx(process.argv[2]); const p = c.pages()[0] || await c.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const show = async t => console.log('\n## ' + t + '\nHOME ' + (await L.home(p)));
  await L.go(p, '2026-12-12'); console.log(await L.spend(p, 12000, 'Card A', { note: 'gift' }));
  await L.go(p, '2026-12-15'); await show('15 Dec before statement');
  await L.tab(p, 'home');
  console.log('stmt bar hidden?', await p.$eval('#a3StmtBar', e => e.hidden));
  await p.$eval('#a3StmtGo', e => e.click()); await L.w(300);
  await p.click('#a3StmtAny summary'); await L.w(100);
  const reply = { statements: [{ account: 'Main bank', kind: 'bank', currency: 'JPY', period: { from: '2026-11-24', to: '2026-12-14' }, rows: [
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
    { date: '2026-12-14', text: 'SUPER', amount: 2500, dir: 'out', cat: 'food' }] }] };
  await p.$eval('#a3StmtPaste', (e, v) => { e.value = v; }, JSON.stringify(reply));
  await p.click('#a3StmtCheck'); await L.w(600);
  console.log('REVIEW:', (await L.txt(p, '#a3Stmt')).slice(0, 2500));
  const dis = await p.$eval('#a3StmtAdd', e => e.disabled);
  console.log('add disabled?', dis);
  if (!dis) { await p.click('#a3StmtAdd'); await L.w(800); }
  console.log('after add sheet', (await L.txt(p, '#a3Stmt')).slice(0, 300));
  await show('15 Dec after statement');
  console.log('\nRC', await L.rc(p));
  await p.reload(); await L.w(500); await show('15 Dec after reload');
  // Ask with a recorded reply
  await L.go(p, '2026-12-18');
  await p.evaluate(() => { window.__replies = { 'I spent 1,500 on lunch today': { answer: 'Logged 1,500 lunch from your main bank, if you apply it.', actions: [{ do: 'log_spend', amount: 1500, note: 'lunch' }] }, 'How much can I spend before pay day?': { answer: 'You can spend 239,000 before pay on 8 Jan.', actions: [] } }; });
  await p.click('#a3AskGo'); await L.w(300);
  await p.fill('#a3AskIn', 'I spent 1,500 on lunch today'); await p.click('#a3AskSend'); await L.w(800);
  console.log('ASK:', await L.txt(p, '#a3AskLog'));
  await p.click('[data-ask=apply]'); await L.w(600);
  console.log('ASK after apply:', await L.txt(p, '#a3AskLog'));
  await p.fill('#a3AskIn', 'How much can I spend before pay day?'); await p.click('#a3AskSend'); await L.w(800);
  const sent = await p.evaluate(() => window.__asked[window.__asked.length - 1]);
  console.log('SUMMARY SENT:', sent.split('THE QUESTION')[0].slice(-1800));
  await p.click('#a3AskClose'); await L.w(200);
  await show('18 Dec after Ask spend');
  // Plan changes on 20 Dec
  await L.go(p, '2026-12-20');
  await L.tab(p, 'plan'); await p.click('[data-goal]'); await L.w(200); await p.fill('#pl-amount', '3000'); await p.click('[data-plbtn="2"]'); await L.w(500); console.log('takeout err', await L.txt(p, '#plErr'));
  await L.tab(p, 'plan');
  const billBtn = async name => { const ids = await p.$$eval('[data-bill],[data-pay]', (bs, n) => bs.filter(b => b.innerText.startsWith(n)).map(b => b.dataset.bill || b.dataset.pay), name); return ids[0]; };
  let id = await billBtn('Rent'); await p.click(`[data-bill="${id}"]`); await L.w(200);
  console.log('Rent form:', await L.txt(p, '#a3Plan'));
  await p.fill('#pl-amount', '75000'); await p.fill('#pl-from', '2027-01-01'); await p.click('[data-plbtn="0"]'); await L.w(500); console.log('rent err', await L.txt(p, '#plErr'));
  await L.tab(p, 'plan');
  id = await billBtn('Main job'); await p.click(`[data-pay="${id}"]`); await L.w(200);
  await p.fill('#pl-amount', '185000'); await p.fill('#pl-from', '2027-02-01'); await p.click('[data-plbtn="0"]'); await L.w(500); console.log('pay err', await L.txt(p, '#plErr'));
  console.log('\nPLAN 20 Dec', await L.plan(p));
  await show('20 Dec after plan changes');
  await L.go(p, '2026-12-21'); await show('21 Dec');
  await L.go(p, '2026-12-24'); console.log(await L.spend(p, 9000, 'Card B', { note: 'xmas' }));
  await L.go(p, '2026-12-29'); await show('29 Dec');
  await L.go(p, '2027-01-03'); console.log(await L.spend(p, 6000, 'Main bank', { note: 'new year' }));
  await L.go(p, '2027-01-07'); await show('7 Jan');
  console.log('\nPLAN 7 Jan', await L.plan(p));
  console.log('ERR', errs);
  await c.close();
})().catch(e => { console.log('CRASH', e); process.exit(1); });
