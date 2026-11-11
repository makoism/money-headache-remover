const { w, launch } = require('/tmp/v22/lib.js');
(async () => {
  const { b, p, errs } = await launch(390, 844, 'light');
  await p.evaluateOnNewDocument(() => { window.__a = 1; window.__mutOn = () => 1; });
  await p.goto('file:///home/claude/work/money-map-team.html?x=1#2026-11', { waitUntil: 'load' }); await w(500);
  console.log(await p.evaluate(() => [typeof window.__a, typeof window.__mutOn, location.href]));
  await b.close();
})();
