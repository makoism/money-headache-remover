const L = require('./lib.js');
(async () => {
  const c = await L.ctx(process.argv[2]); const p = c.pages()[0] || await c.newPage();
  await L.go(p, '2027-01-15');
  await L.tab(p, 'plan'); await p.click('#plSetFree'); await L.w(200); await p.fill('#pl-amount', '50000'); await p.click('[data-plbtn="0"]'); await L.w(500);
  console.log('err', await L.txt(p, '#plErr'));
  console.log('PLAN', (await L.plan(p)).slice(0, 300));
  console.log('RC', (await L.rc(p)).slice(0, 200));
  console.log('HOME', (await L.home(p)).slice(0, 500));
  await c.close();
})();
