const { w, P, launch, runTour } = require('/tmp/v22/lib.js');
const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
(async () => {
  // baseline: a blank page in the same harness
  const b0 = await puppeteer.launch({ executablePath:'/usr/bin/google-chrome', headless:'new', args:['--no-sandbox','--disable-gpu'] });
  const p0 = await b0.newPage(); await p0.goto('about:blank'); const c0 = await p0.target().createCDPSession(); await c0.send('Performance.enable');
  const mm = async c => Object.fromEntries((await c.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
  let a = await mm(c0); await w(6000); let z = await mm(c0); console.log('BLANK baseline task %', ((z.TaskDuration - a.TaskDuration) / 6 * 100).toFixed(2), 'script %', ((z.ScriptDuration - a.ScriptDuration) / 6 * 100).toFixed(2));
  await b0.close();
  const { b, p, errs } = await launch(390, 844, 'light');
  await p.evaluateOnNewDocument(() => {
    window.__ro = 0; const RO = window.ResizeObserver; window.ResizeObserver = class extends RO { constructor(cb) { super((...a) => { window.__ro++; cb(...a); }); } };
    window.__mut = {}; window.__mutOn = () => { new MutationObserver(l => l.forEach(m => { const k = (m.target.id || m.target.className || m.target.nodeName) + ':' + m.type + ':' + (m.attributeName || ''); window.__mut[k] = (window.__mut[k] || 0) + 1; })).observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true }); };
  });
  await p.goto('file:///home/claude/work/money-map-team.html?x=1#2026-11', { waitUntil: 'load' }); await w(500);
  await runTour(p, P.a); await w(1200);
  const c = await p.target().createCDPSession(); await c.send('Performance.enable');
  for (const tab of ['home', 'receipts']) {
    await p.evaluate(t => { document.querySelector(`[data-tab="${t}"]`).click(); window.__ro = 0; window.__mut = {}; window.__mutOn(); }, tab); await w(1500);
    const a = await mm(c); await p.evaluate(() => { window.__ro = 0; window.__mut = {}; }); await w(5000); const z = await mm(c);
    const r = await p.evaluate(() => ({ ro: window.__ro, mut: window.__mut, active: document.activeElement && (document.activeElement.id || document.activeElement.tagName) }));
    console.log(tab, 'task %', ((z.TaskDuration - a.TaskDuration) / 5 * 100).toFixed(2), 'layouts/s', ((z.LayoutCount - a.LayoutCount) / 5).toFixed(1), 'RO callbacks', r.ro, 'active', r.active, 'mutations', JSON.stringify(r.mut));
  }
  await b.close();
})();
