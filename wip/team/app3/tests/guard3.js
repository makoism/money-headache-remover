#!/usr/bin/env node
/* Guard rails for app3 (like ../../tests/guard.js): idle CPU at rest on Home and on Check your bank, no long tasks,
   Home drawn within one task budget, no outside requests, no page errors. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
(async () => {
  const { b, p, errs, requests } = await T.open();
  await p.evaluateOnNewDocument(() => { window.__lt = []; try { new PerformanceObserver(l => l.getEntries().forEach(e => window.__lt.push(Math.round(e.duration)))).observe({ entryTypes: ['longtask'] }); } catch (e) {} });
  await p.goto(T.URL0 + '?try=mako&today=2026-12-10', { waitUntil: 'load' }); await T.w(800);
  const c = await p.target().createCDPSession(); await c.send('Performance.enable');
  const m = async () => Object.fromEntries((await c.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
  const idle = async () => { const wins = []; for (let i = 0; i < 3; i++) { const a = await m(); await T.w(3000); const z = await m(); wins.push((z.TaskDuration - a.TaskDuration) / 3 * 100); } return wins.sort((x, y) => x - y)[1]; };
  let cpu = await idle(); ck(`idle CPU on Home: ${cpu.toFixed(2)}% (limit 1.5%)`, cpu < 1.5);
  const t = await p.evaluate(async () => { const t0 = performance.now(); document.getElementById('a3CheckGo').click(); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); return performance.now() - t0; });
  ck(`Check your bank opens to the next paint in ${t.toFixed(1)} ms (limit 100)`, t < 100);
  await T.w(500); cpu = await idle(); ck(`idle CPU on Check your bank: ${cpu.toFixed(2)}% (limit 1.5%)`, cpu < 1.5);
  const lt = await p.evaluate(() => window.__lt.slice());
  ck(`long tasks: ${JSON.stringify(lt)} (limit 200 ms each)`, lt.every(d => d < 200));
  ck(`outside requests: ${requests.length ? requests.join(' ') : 'none'}`, requests.length === 0);
  ck(`page errors: ${errs.length ? errs.join(' | ') : 'none'}`, errs.length === 0);
  await b.close(); T.done('guard3');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
