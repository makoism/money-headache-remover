const { w, P, launch, runTour } = require('/tmp/v22/lib.js');
(async () => {
  const { b, p } = await launch(390, 844, 'light');
  const c = await p.target().createCDPSession(); await c.send('Performance.enable');
  const m = async () => Object.fromEntries((await c.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
  await runTour(p, P.a); await w(1500);
  const measure = async (label) => { const a = await m(); await w(4000); const z = await m(); console.log(label, ((z.TaskDuration - a.TaskDuration) / 4 * 100).toFixed(2) + '%'); };
  await p.evaluate(() => document.querySelector('[data-tab="basics"]').click()); await w(1500);
  await measure('basics first open (coach up)');
  await p.evaluate(() => { const s = document.querySelector('#coSkip'); s && s.click(); }); await w(800);
  await measure('basics after coach closed');
  await p.evaluate(() => document.querySelector('[data-tab="home"]').click()); await w(1500);
  await measure('home');
  // what runs? sample long-ish timers via a quick profile of setTimeout calls
  const timers = await p.evaluate(() => new Promise(res => { const seen = {}; const o = window.setTimeout; window.setTimeout = function (fn, t) { const k = (fn && fn.toString().slice(0, 60)) + ' @' + t; seen[k] = (seen[k] || 0) + 1; return o.apply(this, arguments); }; const oi = window.requestAnimationFrame; let raf = 0; window.requestAnimationFrame = function (f) { raf++; return oi.apply(this, arguments); }; o(() => { window.setTimeout = o; res({ seen, raf }); }, 3000); }));
  console.log(JSON.stringify(timers).slice(0, 800));
  await b.close();
})();
