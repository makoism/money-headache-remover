/* H1 (novice walk of Home, 2026-11-19): things a beginner tripped on, on the built page. Made-up numbers.
   1. A card's "Update" on Home stays one word on one line at 390 and 320 wide (it broke into "Upd / ate").
   Run: node tests/qc/h1_home.js */
let bad = 0; const ck = (n, c, x) => { console.log(c ? 'PASS' : 'FAIL', n, c ? '' : (x || '')); if (!c) bad++; };
const L = require('./lib_r12.js'); const R = L.R; const w = R.w;
(async () => {
  let errsAll = [];
  for (const W of [390, 320]) {
    const { b, p, errs } = await L.start({ w: W, h: 844, dpr: 1, mobile: true });
    await L.zero(p); await p.evaluate(() => { __t.S.ui.cur = '¥'; });
    await L.base(p, { pay: 280000, bank: 412000, min: 0, defs: { 'bill:rent': 95000, 'bill:food': 45000, envelope: 30000, education: 0, invest: 10000, give: 0 }, tT: 0, tM: 0, eT: 300000, eS: 0, eM: 20000, noTrip: true });
    for (let i = 0; i < 3; i++) { await p.evaluate(() => { const s = document.getElementById('tourSkip'); if (s && s.offsetParent) s.click(); }); await w(300); }
    await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true }; S.ui.sampleHidden = true; __t.ACT.setCard(null, { name: 'Made-up Visa', owed: 38000, payDay: 27 }); });
    await L.tab(p, 'tab-month'); await L.tab(p, 'tab-home'); await w(500);
    const r = await p.evaluate(() => { const e = document.querySelector('.mp-cards [data-card]'); if (!e) return null; const g = document.createRange(); g.selectNodeContents(e); const li = e.closest('li').getBoundingClientRect(), br = e.getBoundingClientRect();
      return { lines: g.getClientRects().length, inside: br.right <= li.right + 1 && br.left >= li.left - 1, h: Math.round(br.height) }; });
    ck(`${W}: a card row with Update is on Home`, !!r);
    if (r) { ck(`${W}: "Update" is on one line`, r.lines === 1, JSON.stringify(r)); ck(`${W}: "Update" stays inside its row`, r.inside, JSON.stringify(r)); ck(`${W}: "Update" is at least 44px tall to tap`, r.h >= 44, JSON.stringify(r)); }
    errsAll = errsAll.concat(errs); await b.close();
  }
  ck('no page errors', errsAll.length === 0, errsAll.join(' | '));
  console.log(bad ? 'H1 HOME FAIL ' + bad : 'H1 HOME PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('FAIL the test stopped: ' + e.message); console.log('H1 HOME FAIL'); process.exit(1); });
