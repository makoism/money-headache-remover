const { w, P, launch, runTour } = require('/tmp/v22/lib.js');
(async () => {
  const { b, p, errs } = await launch(390, 844, 'light');
  // count timers / rAF during idle
  await p.evaluateOnNewDocument(() => {
    window.__t = { st: 0, si: 0, raf: 0 };
    const sT = window.setTimeout, sI = window.setInterval, rA = window.requestAnimationFrame;
    window.setTimeout = function (...a) { window.__t.st++; return sT.apply(this, a); };
    window.setInterval = function (...a) { window.__t.si++; return sI.apply(this, a); };
    window.requestAnimationFrame = function (...a) { window.__t.raf++; return rA.apply(this, a); };
    window.__lt = []; try { new PerformanceObserver(l => l.getEntries().forEach(e => window.__lt.push(Math.round(e.duration)))).observe({ entryTypes: ['longtask'] }); } catch (e) {}
  });
  await p.goto('file:///home/claude/work/money-map-team.html?x=1#2026-11', { waitUntil: 'load' }); await w(800);
  const c = await p.target().createCDPSession(); await c.send('Performance.enable');
  const m = async () => Object.fromEntries((await c.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
  const r = await runTour(p, P.a); await w(1500);
  const info = await p.evaluate(() => ({ nodes: document.getElementsByTagName('*').length, anim: document.getAnimations().length, html: document.documentElement.outerHTML.length }));
  console.log('after tour:', JSON.stringify(info), 'tour problems', JSON.stringify(r.probs));
  const idle = async (label, ms) => {
    const a = await m(); await p.evaluate(() => { window.__t = { st: 0, si: 0, raf: 0 }; window.__lt = []; });
    await w(ms); const z = await m(), t = await p.evaluate(() => ({ ...window.__t, lt: window.__lt.slice() }));
    const d = k => z[k] - a[k], s = ms / 1000;
    console.log(`${label}: task ${(d('TaskDuration') / s * 100).toFixed(2)}% cpu, script ${(d('ScriptDuration') / s * 100).toFixed(2)}%, layout ${(d('LayoutDuration') / s * 100).toFixed(2)}%, style ${(d('RecalcStyleDuration') / s * 100).toFixed(2)}%, timers/s ${(t.st / s).toFixed(1)} intervals ${t.si} raf/s ${(t.raf / s).toFixed(1)} layouts/s ${(d('LayoutCount') / s).toFixed(1)} longtasks ${JSON.stringify(t.lt)}, anims ${await p.evaluate(() => document.getAnimations().length)}, heap ${(z.JSHeapUsedSize / 1e6).toFixed(1)}MB`);
  };
  await idle('Home idle 10s', 10000);
  for (const tab of ['receipts', 'goals', 'month', 'basics']) {
    await p.evaluate(t => { const b = document.querySelector(`[data-tab="${t}"]`); b && b.click(); }, tab); await w(1200);
    await idle(`${tab} idle 6s`, 6000);
  }
  // interaction latency: tab switch and typing, measured to next paint
  const lat = async (label, fn) => {
    const ms = await p.evaluate(async fnStr => { const f = new Function('return (' + fnStr + ')')(); const t0 = performance.now(); f(); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); return performance.now() - t0; }, fn.toString());
    console.log(`latency ${label}: ${ms.toFixed(1)} ms`);
  };
  for (let i = 0; i < 3; i++) {
    await lat('switch to Plan', () => document.querySelector('[data-tab="month"]').click()); await w(500);
    await lat('switch to Home', () => document.querySelector('[data-tab="home"]').click()); await w(500);
  }
  await p.evaluate(() => document.querySelector('[data-tab="home"]').click()); await w(500);
  await lat('type amount', () => { const a = document.querySelector('#hAmt'); a.value = '1234'; a.dispatchEvent(new Event('input', { bubbles: true })); });
  console.log('errors', JSON.stringify(errs));
  await b.close();
})();
