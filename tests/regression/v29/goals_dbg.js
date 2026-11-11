const { w, P, launch, runTour } = require('/tmp/v22/lib.js');
(async () => {
  const { b, p } = await launch(390, 844, 'light');
  const r = await runTour(p, P.a);
  console.log(JSON.stringify(r.seen.filter(s => /Goal|trip|Trip|Emergency/i.test(s))));
  console.log(JSON.stringify(await p.evaluate(() => JSON.parse(localStorage.getItem('money-map-template-v2')).plan.goals.map(g => [g.id, g.name, g.target, g.due, g.monthly]))));
  await b.close();
})();
