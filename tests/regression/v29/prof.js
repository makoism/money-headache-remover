const { w, P, launch, runTour } = require('/tmp/v22/lib.js');
(async () => {
  const { b, p } = await launch(390, 844, 'light');
  const c = await p.target().createCDPSession();
  await runTour(p, P.a); await w(1500);
  await p.evaluate(() => document.querySelector('[data-tab="basics"]').click()); await w(1500);
  await c.send('Profiler.enable'); await c.send('Profiler.setSamplingInterval', { interval: 500 }); await c.send('Profiler.start'); await w(4000);
  const { profile } = await c.send('Profiler.stop');
  const self = {}; const dt = profile.timeDeltas; const byId = {}; profile.nodes.forEach(n => byId[n.id] = n);
  profile.samples.forEach((id, i) => { const n = byId[id]; const k = n.callFrame.functionName + ' ' + (n.callFrame.url || '').split('/').pop() + ':' + n.callFrame.lineNumber; self[k] = (self[k] || 0) + (dt[i] || 0); });
  const top = Object.entries(self).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => (v / 1000).toFixed(1) + 'ms ' + k);
  console.log(top.join('\n'));
  await b.close();
})();
