const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w, P, runTour } = require('/tmp/v22/lib.js');
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await p.goto('http://127.0.0.1:8788/#2026-11', { waitUntil: 'load' }); await w(900);
  await runTour(p, P.b); await w(1500);
  await p.type('#hAmt', '12'); await p.evaluate(() => document.querySelector('#hForm').requestSubmit()); await w(4500);
  const seats = [['home', '#hHero'], ['home', '#hStreak'], ['home', '#hDeep'], ['receipts', '#rcMonthCard'], ['goals', '#secRoad'], ['month', '#where'], ['basics', '#p-basics .card.sect']];
  let i = 0;
  for (const [t, sel] of seats) {
    await p.evaluate(t => { const e = document.querySelector(`[data-tab="${t}"]`) || document.querySelector(`[data-tab-go="${t}"]`); if (e) e.click(); }, t); await w(500);
    await p.evaluate(sel => { const h = document.querySelector(sel); const d = h.closest('details'); if (d) d.open = true; h.scrollIntoView({ block: 'start' }); window.scrollBy(0, -16); }, sel); await w(400);
    const st = await p.evaluate(sel => { const h = document.querySelector(sel), c = h.querySelector(':scope > .pixc'); return { cls: c && c.className, r: c && c.getBoundingClientRect().toJSON(), host: h.getBoundingClientRect().toJSON() }; }, sel);
    console.log(t, sel, st.cls, st.r && [Math.round(st.r.x), Math.round(st.r.y), Math.round(st.r.width), Math.round(st.r.height)]);
    const py = await p.evaluate(sel => scrollY + document.querySelector(sel).getBoundingClientRect().top, sel); await p.screenshot({ path: `/tmp/v32/c${i++}.png`, clip: { x: 0, y: Math.max(0, py - 12), width: 390, height: 320 }, captureBeyondViewport: true });
  }
  await b.close();
})();
