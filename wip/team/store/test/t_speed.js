// A 30,000-event copy (ten years of heavy use) timed with the CPU slowed 4x, standing in for a mid-range Android
// phone [D8, sweep2_platform 3]. Fails above the budget. The times are printed so a slow drift shows.
'use strict';

// Measured on the build machine (23 Nov 2026): first save about 3.0 s, open and load about 0.5 s, one tap about
// 13 ms (slowest 25 ms). The budgets leave room for a slower machine, not for a change that makes it slower in kind.
const BUDGET = {
  firstSave: 10000,   // the whole copy written once (the move, or a backup restore)
  openLoad: 2000,     // opening the store and reading all of it at start-up
  tapSave: 80,        // one spend typed: the save, median of 20 taps
  tapSaveMax: 300,    // the slowest of those 20
};

async function slow(page, rate) {
  const s = await page.context().newCDPSession(page);
  await s.send('Emulation.setCPUThrottlingRate', { rate });
  return s;
}

module.exports = [
  { name: '30,000 events under 4x CPU slowdown: first save, open and load, one tap', run: async t => {
    const ctx = await t.context();
    const w = await t.page(ctx);
    await w.evaluate(() => { window.C = window.makeCopy(30000); });
    const size = await w.evaluate(() => JSON.stringify(window.C).length);
    await slow(w, 4);
    const first = await w.evaluate(async () => {
      const t0 = performance.now(); const s = await window.BurrowStore.open(); await s.load();
      const r = await s.save(window.C); s.close(); return [performance.now() - t0, r.ok, r.events];
    });
    t.assert.eq(first.slice(1), [true, 30000], 'first save');

    const p = await t.page(ctx);
    await slow(p, 4);
    const open = await p.evaluate(async () => {
      const t0 = performance.now(); window.S = await window.BurrowStore.open(); const l = await window.S.load(); window.C = l.copy;
      return [performance.now() - t0, l.copy.events.length];
    });
    t.assert.eq(open[1], 30000, 'all loaded');
    const taps = await p.evaluate(async () => {
      const out = [];
      for (let i = 0; i < 20; i++) {
        const at = '2026-11-23T12:' + String(i).padStart(2, '0') + ':00.000+09:00';
        const t0 = performance.now();
        window.C.events.push(Object.assign({}, window.C.events[0], { id: 'k7qzpa-tapsession-' + i, a: 300 + i, at, told: at }));
        const r = await window.S.save(window.C);
        out.push([performance.now() - t0, r.ok, r.events]);
      }
      return out;
    });
    t.assert(taps.every(x => x[1] && x[2] === 1), 'each tap writes one event', taps);
    const ms = taps.map(x => x[0]).sort((a, b) => a - b), median = ms[10], max = ms[19];
    t.log('copy ' + (size / 1e6).toFixed(1) + 'M characters; 4x slower CPU: first save ' + first[0].toFixed(0) + ' ms (budget ' + BUDGET.firstSave +
      '), open and load ' + open[0].toFixed(0) + ' ms (budget ' + BUDGET.openLoad + '), one tap median ' + median.toFixed(1) + ' ms, slowest ' +
      max.toFixed(1) + ' ms (budgets ' + BUDGET.tapSave + ' and ' + BUDGET.tapSaveMax + ')');
    t.assert(first[0] <= BUDGET.firstSave, 'first save within budget', first[0]);
    t.assert(open[0] <= BUDGET.openLoad, 'open and load within budget', open[0]);
    t.assert(median <= BUDGET.tapSave, 'tap save median within budget', median);
    t.assert(max <= BUDGET.tapSaveMax, 'slowest tap within budget', max);
  } },
];
