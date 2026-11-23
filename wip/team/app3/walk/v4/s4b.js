const L = require('./lib.js');
(async () => {
  const c = await L.ctx(process.argv[2]); const p = c.pages()[0] || await c.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const show = async t => console.log('\n## ' + t + '\nHOME ' + (await L.home(p)));
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
  console.log('ERR', errs);
  await c.close();
})().catch(e => { console.log('CRASH', e); process.exit(1); });
