const { w, P, launch, runTour } = require('/tmp/v22/lib.js');
(async () => {
  const { b, p, errs } = await launch(390, 844, 'light');
  let last = 0;
  const r = await runTour(p, P.a, async i => { if (errs.length > last) { const t = await p.$eval('#tourTitle', e => e.textContent); console.log('ERR at step', i, t, errs.slice(last).map(e => e.slice(0, 80))); last = errs.length; } });
  await w(600); if (errs.length > last) console.log('ERR after tour', errs.slice(last).map(e => e.slice(0, 80)));
  console.log('goals', await p.evaluate(() => JSON.parse(localStorage.getItem('money-map-template-v2')).plan.goals.map(g => g.id + ':' + g.name)));
  await b.close();
})();
