const L = require('/tmp/v22/lib.js'); const { w } = L;
(async () => {
  const { b, p } = await L.launch(390, 844, 'dark');
  await p.evaluate(() => document.querySelector('#tourSkip').click()); await w(400);
  await p.evaluate(() => document.querySelector('#gearBtn').click()); await w(300);
  await p.select('#curSel', '€'); await w(600);
  console.log('cur now', await p.evaluate(() => JSON.parse(localStorage.getItem('money-map-template-v2')).ui.cur), await p.$eval('#curNote', e => e.textContent));
  await p.evaluate(() => document.querySelector('[data-tab="receipts"]').click()); await w(400);
  await p.evaluate(() => { const a = document.querySelector('#rcAmt'); a.scrollIntoView({ block: 'center' }); a.focus(); a.value = ''; });
  await p.type('#rcAmt', '12,5');
  console.log('euro value', await p.$eval('#rcAmt', e => e.value), 'sym', await p.$eval('#rcForm .yen', e => e.textContent));
  await b.close();
})();
