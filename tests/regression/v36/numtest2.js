const L = require('/tmp/v22/lib.js'); const { w } = L;
(async () => {
  const { b, p } = await L.launch(390, 844, 'dark');
  await p.evaluate(() => document.querySelector('#tourSkip').click()); await w(500);
  console.log('html lang', await p.evaluate(() => document.documentElement.lang));
  await p.evaluate(() => { document.querySelector('[data-tab="receipts"]').click(); }); await w(400);
  await p.evaluate(() => { const a = document.querySelector('#rcAmt'); a.scrollIntoView({ block: 'center' }); a.focus(); });
  await p.type('#rcAmt', '1,200');
  console.log('rcAmt ->', await p.evaluate(() => { const a = document.querySelector('#rcAmt'); return [a.value, a.valueAsNumber, a.validity.badInput, a.type, a.getAttribute('lang')]; }));
  await p.evaluate(() => document.querySelector('#rcSave').click()); await w(400);
  console.log('receipts', await p.evaluate(() => JSON.parse(localStorage.getItem('money-map-template-v2')).receipts.map(r => [r.d, r.a, r.c])));
  console.log('msg', await p.$eval('#rcMsg', e => e.textContent));
  await b.close();
})();
