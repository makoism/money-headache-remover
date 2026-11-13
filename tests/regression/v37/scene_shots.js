const L = require('/tmp/v22/lib.js'); const { w } = L;
(async () => {
  const VW = +(process.env.VW || 1440), VH = +(process.env.VH || 900);
  const { b, p, errs } = await L.launch(VW, VH, process.env.SCHEME || 'dark');
  for (const tod of (process.env.TODS || 'morning,day,sunset,night').split(',')) {
    await p.evaluate(() => sessionStorage.setItem('__keep', '1'));
    await p.goto(`file:///home/claude/work/money-map-team.html?tod=${tod}&realm=${process.env.REALM || "wood"}#2026-11`, { waitUntil: 'load' }); await w(700);
    await p.evaluate(() => { const t = document.querySelector('#tour'); if (t && !t.hidden) document.querySelector('#tourSkip').click(); }); await w(500);
    await p.evaluate(t => { const tab = document.querySelector(`[data-tab="${t}"]`); tab && tab.click(); }, process.env.TAB || 'receipts'); await w(900);
    await p.screenshot({ path: `/tmp/v37/s-${VW}-${process.env.REALM || "wood"}-${tod}.png` });
  }
  console.log('errs', errs);
  await b.close();
})();
