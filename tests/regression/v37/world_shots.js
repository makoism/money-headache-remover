const L = require('/tmp/v22/lib.js'); const { w } = L;
(async () => {
  const VW = +(process.env.VW || 1440), VH = +(process.env.VH || 900), R = process.env.REALM || 'wood', TOD = process.env.TOD || 'day';
  const { b, p, errs } = await L.launch(VW, VH, process.env.SCHEME || 'dark');
  await p.evaluate(() => sessionStorage.setItem('__keep', '1'));
  await p.goto(`file:///home/claude/work/money-map-team.html?tod=${TOD}&realm=${R}#2026-11`, { waitUntil: 'load' }); await w(700);
  await p.evaluate(() => { const t = document.querySelector('#tour'); if (t && !t.hidden) document.querySelector('#tourSkip').click(); }); await w(900);
  await p.screenshot({ path: `/tmp/v37/w-${VW}-${R}-shut.png` });
  if (process.env.OPEN !== '0') { await p.click('[data-tab="home"]'); await w(450); await p.screenshot({ path: `/tmp/v37/w-${VW}-${R}-mid.png` }); await w(1500); await p.screenshot({ path: `/tmp/v37/w-${VW}-${R}-open.png` }); }
  console.log('errs', JSON.stringify(errs), await p.evaluate(() => document.body.className));
  await b.close();
})();
