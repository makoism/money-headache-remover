const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w, P, runTour } = require('/tmp/v22/lib.js');
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844 });
  await p.evaluateOnNewDocument((iso) => { try { if (!sessionStorage.getItem('__keep')) { localStorage.clear(); indexedDB.deleteDatabase('money-map-safe'); } sessionStorage.setItem('__keep', '1'); } catch (e) {} const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, '2026-12-03T10:00:00');
  await p.goto('file:///home/claude/work/money-map-team.html?sfxtest#2026-12', { waitUntil: 'load' }); await w(800);
  await runTour(p, P.a); await w(1000);
  console.log(await p.evaluate(() => { const S = window.__t.S, C = window.__t.calcAll(S); const g = S.plan.goals[0]; const out = {}; ['2026-11', '2026-12', '2027-01'].forEach(ym => { const m = C.byYm[ym]; out[ym] = { left: m.pool.left, goal: m.g[g.id] && m.g[g.id].actual, goalsTotal: m.goalsTotal, play: m.jar.play, nec: m.jar.nec, inflow: m.inflow }; }); return { steps: S.steps['goal:' + g.id], once: S.once, out, playKey: S.plan.lines.filter(l => l.jar === 'play').map(l => l.key), lts: S.plan.lines.filter(l => l.jar === 'lts').map(l => [l.key, l.id]) }; }));
  await b.close();
})();
