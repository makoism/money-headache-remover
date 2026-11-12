const { w, P, runTour, launch } = require('/tmp/v22/lib.js');
(async () => {
  const { b, p } = await launch(390, 844, 'dark');
  let txt = '';
  await runTour(p, P.b, async () => { const t = await p.$eval('#tourTitle', e => e.textContent); if (/Split goal money|Goal money/.test(t)) { txt = await p.$eval('#tourBody', e => e.innerText.replace(/\s+/g, ' ').slice(0, 500)); } });
  console.log('split step text:', txt || '(not shown)');
  await w(800);
  console.log(await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('money-map-template-v2')); return { goals: s.plan.goals.map(g => [g.id, g.name, g.target]), steps: Object.keys(s.steps).filter(k => k.startsWith('goal:')).map(k => [k, s.steps[k]]), aims: s.cfg.aims }; }));
  await b.close();
})();
