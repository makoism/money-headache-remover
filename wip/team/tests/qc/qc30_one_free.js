/* QC round 10 numbers gate blocker 1 (the rest of it): one planned Free to spend figure everywhere. Balance 10,000, pay 300,000, bills
   140,000, Free to spend 36,200, minimum 30,000: the month ends at 10,000, so 20,000 of Free to spend is held back and 16,200 is safe.
   Home said "Free to spend is lowered to match." (and said it again when Free to spend was already over, when nothing was lowered), and
   Plan > Month showed the held ¥16,200 as Free to spend with "Planned ¥36,200" under it. Now every screen shows the planned ¥36,200 and
   the safe ¥16,200 in the same words; when Free to spend is over, every screen shows the same amount over. Made-up numbers.
   Run: PAGE=/abs/money-map-team.html node tests/qc/qc30_one_free.js */
const PAGE = process.env.PAGE || process.env.BUILD || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 600)); } };
const clock = (p, iso) => p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, iso);
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
const read = async p => {
  const g = () => p.evaluate(() => {
    const t = s => (s || '').replace(/⁠/g, '').replace(/\s+/g, ' ').trim(), q = s => t((document.querySelector(s) || {}).textContent);
    return { tile: [...document.querySelectorAll('.mp-four li')].map(li => t(li.textContent)).find(x => /^Free to spend/.test(x)) || '', chest: q('#mpRooms [data-room="play"]'), warn: q('.mp-warn'), spend: q('#hSpend'),
      heroNum: q('#heroNum'), heroWk: q('#heroWk'), rcLine: q('#rcLine'), rcSum: q('#rcSum'), band: q('#mgBand') };
  });
  await L.tab(p, 'tab-home'); const h = await g();
  await p.evaluate(() => { const x = document.querySelector('#hSpend [data-why="free"]'); if (x) x.click(); }); await w(500);
  h.sheet = await p.evaluate(() => [...document.querySelectorAll('#why .whyl > div')].map(e => e.textContent.replace(/⁠/g, '').replace(/\s+/g, ' ').trim()).join(' | '));
  await p.evaluate(() => { const x = document.querySelector('#why [data-whyno].btn'); if (x) x.click(); }); await w(300);
  await L.tab(p, 'tab-month'); const m = await g();
  await L.tab(p, 'tab-receipts'); const r = await g();
  return { tile: h.tile, chest: h.chest, warn: h.warn, spend: h.spend, sheet: h.sheet, heroNum: m.heroNum, heroWk: m.heroWk, rcLine: m.rcLine, rcSum: r.rcSum, band: r.band };
};
(async () => {
  const { b, p, errs } = await R.phone({ w: 412, h: 915, dpr: 1, mobile: true, keep: true });
  await clock(p, '2026-11-19T10:00:00'); await p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(p);
  await L.zero(p);
  await L.base(p, { pay: 300000, bank: 10000, min: 30000, defs: { 'bill:rent': 100000, 'bill:food': 40000, envelope: 36200, education: 10000, invest: 20000, give: 5000 }, tM: 15000, eT: 1000000, eS: 0, eM: 73800 });
  await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true; __t.persist(); __t.restructure(); });
  let s = await read(p);
  ck('held: the Home tile shows the planned ¥36,200 and ¥16,200 safe to spend', /¥36,200/.test(s.tile) && /¥16,200 safe to spend/.test(s.tile), s.tile);
  ck('held: the This month chest the same', /¥36,200/.test(s.chest) && /¥16,200 safe to spend/.test(s.chest), s.chest);
  ck('held: Home never says Free to spend is "lowered"', !/lowered/.test(s.warn), s.warn);
  ck('held: Home says what is safe in the tile\'s words', /Keep Free to spend to the ¥16,200 that is safe to spend, so your bank does not go under your minimum\./.test(s.warn), s.warn);
  ck('held: Plan > Month headline is the planned ¥36,200, not the held ¥16,200', s.heroNum === '¥36,200', s.heroNum);
  ck('held: Plan > Month says ¥16,200 of it is safe to spend', /Planned ¥36,200 in Nov, ¥16,200 safe to spend\./.test(s.heroWk), s.heroWk);
  ck('held: Receipts summary says ¥36,200 planned and ¥16,200 safe to spend', /¥36,200 planned/.test(s.rcSum) && /¥16,200 safe to spend/.test(s.rcSum), s.rcSum);
  ck('held: the strip under the tabs says ¥36,200 planned, ¥16,200 safe to spend', /Free to spend: ¥36,200 planned, ¥16,200 safe to spend/.test(s.band), s.band);
  ck('held: the Free to spend card on Home shows ¥36,200 and ¥16,200 safe to spend', /¥36,200/.test(s.spend) && /¥16,200 of it is safe to spend/.test(s.spend) && !/Free to spend in November ?¥16,200/.test(s.spend), s.spend);
  ck('held: the How is this worked out sheet ends on "Safe to spend ¥16,200", never "Free to spend ¥16,200"', /Safe to spend ?¥16,200/.test(s.sheet) && !/Free to spend ?¥16,200/.test(s.sheet), s.sheet);
  /* over: 40,000 logged in Free to spend, 3,800 past its plan; the bank ends at 6,200, under the minimum, and nothing was lowered */
  await L.rc(p, 40000, 'envelope'); await w(400);
  s = await read(p);
  ck('over: the Home tile says ¥3,800 over', /¥3,800/.test(s.tile) && /over/.test(s.tile), s.tile);
  ck('over: Home never says Free to spend is "lowered"', s.warn !== '' && !/lowered/.test(s.warn), s.warn);
  ck('over: Plan > Month headline is the same ¥3,800', /^[−-]?¥3,800$/.test(s.heroNum) && /¥3,800 over/.test(s.rcLine), [s.heroNum, s.rcLine]);
  ck('over: Receipts says ¥3,800 over', /¥3,800 over/.test(s.rcSum), s.rcSum);
  ck('over: the strip says ¥3,800 over', /Free to spend: ¥3,800 over/.test(s.band), s.band);
  ck('no page errors', errs.length === 0, errs.slice(0, 3));
  await b.close();
  console.log(bad ? `qc30_one_free: ${bad} FAIL` : 'qc30_one_free: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc30_one_free: FAIL'); process.exit(1); });
