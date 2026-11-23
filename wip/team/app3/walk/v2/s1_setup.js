const L = require('./lib.js'); const fs = require('fs');
(async () => {
  const dir = process.argv[2]; fs.rmSync(dir, { recursive: true, force: true });
  const c = await L.ctx(dir); const p = c.pages()[0] || await c.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await L.go(p, '2026-11-24');
  await p.click('#a3SetupGo'); await L.w(200);
  await L.typeIn(p, '#s3Bank', '286000');
  await p.selectOption('#s3PayDay', '10'); await p.selectOption('#s3PayShift', 'before');
  await L.typeIn(p, '#s3PayName', 'Main job'); await L.typeIn(p, '#s3PayAmt', '180000');
  await p.click('#s3AddPay'); await L.typeIn(p, '[data-row=pay2] [data-f=name]', 'Side job'); await L.typeIn(p, '[data-row=pay2] [data-f=amount]', '60000');
  for (const [n, name, owed, day, shift] of [[1, 'Card A', 54000, '10', 'after'], [2, 'Card B', 23000, '11', 'before']]) {
    await p.click('#s3AddCard'); const r = `[data-row=card${n}] `;
    await L.typeIn(p, r + '[data-f=name]', name); await L.typeIn(p, r + '[data-f=owed]', owed);
    await p.selectOption(r + '[data-f=payDay]', day); await p.selectOption(r + '[data-f=shift]', shift);
  }
  let n = 0;
  for (const [name, amt, day] of [['Rent', 72000, '27'], ['Power', 7400, '26'], ['Phone', 4800, '20'], ['Internet', 5200, '27']]) {
    n++; await p.click('#s3AddBill'); const r = `[data-row=bill${n}] `;
    await L.typeIn(p, r + '[data-f=name]', name); await L.typeIn(p, r + '[data-f=amount]', amt); await p.selectOption(r + '[data-f=day]', day);
  }
  console.log('SETUP SHEET:', (await L.txt(p, '#a3Setup')).slice(0, 3000));
  await p.click('#a3SetupSave'); await L.w(800);
  console.log('\nHOME 24 Nov:', await L.home(p));
  console.log('\nPLAN:', await L.plan(p));
  console.log('\nRC:', await L.rc(p));
  console.log('ERR', errs);
  await c.close();
})().catch(e => { console.log('CRASH', e); process.exit(1); });
