const L = require('./lib.js');
(async () => {
  const c = await L.ctx(process.argv[2]); const p = c.pages()[0];
  await L.go(p, '2027-02-15'); await L.tab(p, 'receipts');
  for (let i = 0; i < 3; i++) { await p.click('#rcOlder').catch(() => {}); await L.w(200); }
  console.log('RC', await L.txt(p, '#rcList'));
  const id = await p.$$eval('[data-rc]', (ls) => ls.filter(l => l.innerText.includes('extra for trip')).map(l => l.dataset.rc)[0]);
  await p.click(`[data-rc="${id}"] button`); await L.w(300);
  await p.click('#rcRemove'); await L.w(600);
  for (let i = 0; i < 3; i++) { await p.click('#rcOlder').catch(() => {}); await L.w(200); }
  console.log('RC after', await L.txt(p, '#rcList'));
  console.log('HOME', (await L.home(p)).slice(0, 300));
  await L.tab(p, 'plan'); await p.$$eval('details', ds => ds.forEach(d => d.open = true));
  console.log('PLAN', (await L.txt(p, '#a3Plan')).split('Goals')[1].slice(0, 120), (await L.txt(p, '[data-card=plan-past]')));
  await c.close();
})().catch(e => { console.log('CRASH', e); process.exit(1); });
