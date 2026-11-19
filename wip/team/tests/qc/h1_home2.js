/* H1 (novice walk of Home, 2026-11-19), findings 1 and 8, on the built page. Made-up numbers.
   1. After "Check your bank" Home never shows two bank figures under one name: the typed figure is the bank now, the figure in the
      month-end legend has its own name and a line next to it saying it is planned and where it starts from.
   8. The Log spend fold reads as something to tap (more than its two field names), and is at least 44px tall.
   The test reads ids and data attributes, not the wording. Run: node tests/qc/h1_home2.js */
let bad = 0; const ck = (n, c, x) => { console.log(c ? 'PASS' : 'FAIL', n, c ? '' : (x || '')); if (!c) bad++; };
const L = require('./lib_r12.js'); const R = L.R; const w = R.w;
(async () => {
  let errsAll = [];
  for (const W of [390, 320]) {
    const { b, p, errs } = await L.start({ w: W, h: W === 320 ? 568 : 844, dpr: 1, mobile: true });
    await L.zero(p); await p.evaluate(() => { __t.S.ui.cur = '¥'; });
    await L.base(p, { pay: 280000, bank: 412000, min: 0, defs: { 'bill:rent': 95000, 'bill:food': 45000, envelope: 30000, education: 0, invest: 10000, give: 0 }, tT: 0, tM: 0, eT: 300000, eS: 0, eM: 20000, noTrip: true });
    for (let i = 0; i < 3; i++) { await p.evaluate(() => { const s = document.getElementById('tourSkip'); if (s && s.offsetParent) s.click(); }); await w(300); }
    await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true }; S.ui.sampleHidden = true; __t.ACT.setBankNow(380000); });
    await L.tab(p, 'tab-month'); await L.tab(p, 'tab-home'); await w(500);
    const r = await p.evaluate(() => {
      const norm = s => (s || '').toLowerCase().replace(/[^a-z ]/g, ' ').split(/\s+/).filter(x => x && !/^(in|your|the|now|planned)$/.test(x)).join(' ');
      const own = e => { if (!e) return ''; const c = e.cloneNode(true); c.querySelectorAll('b, em, small').forEach(x => x.remove()); return c.textContent.trim(); };
      const map = document.getElementById('hMap'), now = map.querySelector('.mp-now-h'), nowV = map.querySelector('.mp-now-v');
      const li = map.querySelector('.mp-key li[data-part="bank"]'), from = map.querySelector('[data-planfrom]');
      const vis = e => !!e && !!(e.offsetParent || e.getClientRects().length);
      return { now: own(now), nowV: nowV ? nowV.textContent : '', li: own(li), liV: li ? li.querySelector('b').textContent : '', same: !!li && norm(own(li)) === norm(own(now)),
        from: vis(from), fromTxt: from ? from.textContent.trim() : '', fromAfter: !!from && !!li && !!(li.compareDocumentPosition(from) & Node.DOCUMENT_POSITION_FOLLOWING) && !!(from.compareDocumentPosition(map.querySelector('.mp-four')) & Node.DOCUMENT_POSITION_FOLLOWING),
        wide: document.documentElement.scrollWidth > innerWidth + 1 };
    });
    ck(`${W}: the typed bank figure is on Home`, /380,000/.test(r.nowV), JSON.stringify(r));
    ck(`${W}: the month-end legend has its own bank entry`, !!r.li && r.liV !== r.nowV, JSON.stringify(r));
    ck(`${W}: the two bank figures do not share a name`, !!r.li && !r.same, `"${r.now}" and "${r.li}"`);
    ck(`${W}: a line by the legend says the month-end bank is planned and where it starts`, r.from && r.fromTxt.length > 20 && r.fromAfter, JSON.stringify(r));
    ck(`${W}: Home is no wider than the screen`, !r.wide);
    const f = await p.evaluate(() => { const d = document.querySelector('#hQuick details.hmore, details.hmore'), s = d && d.querySelector('summary'); if (!s) return null;
      const labels = [...d.querySelectorAll('label')].map(l => l.textContent.trim().toLowerCase()), words = s.textContent.trim().toLowerCase().split(/[\s,]+/).filter(Boolean);
      return { words, onlyNames: words.every(x => labels.includes(x)), h: Math.round(s.getBoundingClientRect().height), open: d.open }; });
    ck(`${W}: the Log spend fold is there, closed`, !!f && !f.open);
    if (f) { ck(`${W}: the fold's name is more than its field names`, !f.onlyNames && f.words.length >= 4, JSON.stringify(f)); ck(`${W}: the fold is at least 44px tall to tap`, f.h >= 44, JSON.stringify(f)); }
    errsAll = errsAll.concat(errs); await b.close();
  }
  ck('no page errors', errsAll.length === 0, errsAll.join(' | '));
  console.log(bad ? 'H1 HOME2 FAIL ' + bad : 'H1 HOME2 PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('FAIL the test stopped: ' + e.message); console.log('H1 HOME2 FAIL'); process.exit(1); });
