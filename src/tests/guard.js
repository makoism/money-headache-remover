/* Guard rails that keep the page light: idle CPU, no outside requests, no long tasks, one-frame tab switches.
   Run by check.sh. Prints PASS/FAIL lines; exits 1 on any FAIL. */
const { w, P, launch, runTour } = require('/tmp/v22/lib.js');
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
(async () => {
  const { b, p, errs } = await launch(390, 844, 'light');
  const ext = []; p.on('request', r => { const u = r.url(); if (/^https?:/.test(u) && !/claude\.ai/.test(u)) ext.push(u.slice(0, 80)); });
  await p.evaluateOnNewDocument(() => { window.__lt = []; try { new PerformanceObserver(l => l.getEntries().forEach(e => window.__lt.push(Math.round(e.duration)))).observe({ entryTypes: ['longtask'] }); } catch (e) {} });
  await p.goto('file://' + PAGE + '?guard=1#2026-11', { waitUntil: 'load' }); await w(700);
  const c = await p.target().createCDPSession(); await c.send('Performance.enable');
  const m = async () => Object.fromEntries((await c.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
  await runTour(p, P.a); await w(1500);
  let fail = 0; const check = (ok, msg) => { console.log((ok ? 'PASS ' : 'FAIL ') + msg); if (!ok) fail++; };
  for (const tab of ['home', 'receipts', 'goals', 'month', 'basics']) {
    await p.evaluate(t => document.querySelector(`[data-tab="${t}"]`).click(), tab); await w(1500);
    const a = await m(); await w(4000); const z = await m(), cpu = (z.TaskDuration - a.TaskDuration) / 4 * 100;
    check(cpu < 1.5, `idle CPU on ${tab}: ${cpu.toFixed(2)}% (limit 1.5%)`);
  }
  const lat = [];
  for (let i = 0; i < 4; i++) for (const t of ['month', 'home']) {
    lat.push(await p.evaluate(async t => { const t0 = performance.now(); document.querySelector(`[data-tab="${t}"]`).click(); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); return performance.now() - t0; }, t)); await w(300);
  }
  const med = lat.sort((x, y) => x - y)[Math.floor(lat.length / 2)];
  check(med < 60, `tab switch to next paint, median ${med.toFixed(1)} ms (limit 60)`);
  const lt = await p.evaluate(() => window.__lt.slice());
  check(lt.every(d => d < 200), `long tasks: ${JSON.stringify(lt)} (limit 200 ms each)`);
  check(ext.length === 0, `outside requests: ${ext.length ? ext.join(' ') : 'none'}`);
  check(errs.length === 0, `page errors: ${errs.length ? JSON.stringify(errs) : 'none'}`);
  await b.close(); console.log(fail ? `GUARD FAIL ${fail}` : 'GUARD ALL PASS'); process.exit(fail ? 1 : 0);
})();
