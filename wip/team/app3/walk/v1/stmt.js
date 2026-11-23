const L = require('./lib.js'); const { home, w } = L;
(async () => {
  const c = await L.ctx(process.argv[2]); const p = c.pages()[0];
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await L.go(p, '2026-12-16'); console.log('before:', (await home(p)).slice(0, 600));
  await p.click('#a3StmtGo'); await w(300);
  await p.click('#a3StmtAny summary'); await w(100);
  const reply = { statements: [{ account: 'Main bank', kind: 'bank', currency: 'JPY', period: { from: '2026-11-21', to: '2026-12-15' }, rows: [
    { date: '2026-11-22', text: 'SUPER', amount: 3000, dir: 'out', cat: 'food' },
    { date: '2026-11-26', text: 'DENKI POWER', amount: 7400, dir: 'out', cat: 'util' },
    { date: '2026-11-27', text: 'RENT', amount: 72000, dir: 'out', cat: 'rent' },
    { date: '2026-11-27', text: 'NET', amount: 5200, dir: 'out', cat: 'net' },
    { date: '2026-12-10', text: 'SALARY MAIN', amount: 180000, dir: 'in', cat: 'pay' },
    { date: '2026-12-10', text: 'SIDE JOB', amount: 60000, dir: 'in', cat: 'pay' },
    { date: '2026-12-10', text: 'CARD A PAYMENT', amount: 40000, dir: 'out', cat: 'card_payment' },
    { date: '2026-12-11', text: 'CARD B PAYMENT', amount: 23000, dir: 'out', cat: 'card_payment' },
    { date: '2026-12-14', text: 'SUPER', amount: 2500, dir: 'out', cat: 'food' }] }] };
  await p.$eval('#a3StmtPaste', (e, v) => { e.value = v; }, JSON.stringify(reply));
  await p.click('#a3StmtCheck'); await w(500);
  console.log('review:', (await p.$eval('#a3Stmt', e => e.innerText.replace(/\n+/g, ' | '))).slice(0, 1500));
  await p.click('#a3StmtAdd'); await w(800);
  console.log('\nafter:', await home(p));
  await p.reload(); await w(500); console.log('\nreload same:', (await home(p)).slice(0, 300));
  await L.go(p, '2027-01-11'); console.log('\n11 Jan:', await home(p));
  console.log(errs);
  await c.close();
})().catch(e => { console.log('CRASH', e); process.exit(1); });
