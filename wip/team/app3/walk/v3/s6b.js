const L = require('./lib.js');
(async () => {
  const c = await L.ctx(process.argv[2]); const p = c.pages()[0] || await c.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await L.go(p, '2027-01-15');
  await L.tab(p, 'plan'); await p.click('#plSetFree'); await L.w(200);
  console.log('FREE FORM', await L.txt(p, '#a3Plan'));
  await p.fill('#pl-amount', '50000'); await p.click('[data-plbtn="0"]'); await L.w(500);
  console.log('err', await L.txt(p, '#plErr'));
  await L.tab(p, 'plan'); await p.$$eval('details', ds => ds.forEach(d => d.open = true));
  console.log('PLAN', await L.txt(p, '#a3Plan'));
  console.log('RC', (await L.rc(p)).slice(0, 300));
  console.log('HOME', await L.home(p));
  await p.reload(); await L.w(500); console.log('HOME reload', (await L.home(p)).slice(0, 400));
  console.log(errs);
  await c.close();
})().catch(e => { console.log('CRASH', e); process.exit(1); });
