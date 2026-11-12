const { w, P, runTour, launch } = require('/tmp/v22/lib.js');
(async () => {
  const { b, p } = await launch(390, 844, 'dark');
  const seen = [];
  await runTour(p, P.a, async () => { const t = await p.$eval('#tourTitle', e => e.textContent); const st = await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('money-map-template-v2') || '{}'); return { aims: s.cfg && s.cfg.aims, goal: s.steps && Object.keys(s.steps).filter(k => k.startsWith('goal:')).map(k => s.steps[k]) }; }); seen.push(t + ' ' + JSON.stringify(st)); });
  console.log(seen.join('\n'));
  await b.close();
})();
