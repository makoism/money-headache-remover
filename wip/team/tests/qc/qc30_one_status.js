/* QC round 10 numbers gate should-fix 6: the same month had two statuses. After a borrow, Plan's chip said "Tight month" and All months
   "On plan"; past Free to spend the chip said "Over Free to spend" and All months "Over plan"; a tight month was "Tight month" on the
   chip and "Tight" on the line under the month and in All months. Now one status per month, in the same words, on the chip, the line
   under the month and All months. Made-up numbers.  Run: PAGE=/abs/money-map-team.html node tests/qc/qc30_one_status.js */
const PAGE = process.env.PAGE || process.env.BUILD || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 600)); } };
const clock = (p, iso) => p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, iso);
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
const t = s => (s || '').replace(/⁠/g, '').replace(/\s+/g, ' ').trim();
/* the chip, the status word at the end of the line under the month, and the All months row for Nov 2026 */
const read = async p => {
  await L.tab(p, 'tab-month'); await L.clickText(p, 'Month'); await w(400);
  const m = await p.evaluate(() => ({ chip: document.getElementById('chip').textContent, chipCls: document.getElementById('chip').className, dock: document.getElementById('dockTxt').textContent }));
  await L.clickText(p, 'All months'); await w(500);
  const row = await p.evaluate(() => { const tr = document.querySelector('#monthTable tr[data-ym="2026-11"]'); const td = tr && tr.lastElementChild; return { word: td ? td.textContent : '', cls: td && td.firstElementChild ? td.firstElementChild.className : '', aria: tr ? tr.getAttribute('aria-label') : '' }; });
  await L.clickText(p, 'Month'); await w(300);
  return { chip: t(m.chip), chipCls: m.chipCls.replace('chip', '').trim(), dockWord: t(m.dock).split(' · ').slice(1).join(' · '), dock: t(m.dock), all: t(row.word), allCls: row.cls.replace('st', '').trim(), aria: row.aria };
};
const same = (tag, s, word, cls) => {
  ck(`${tag}: the chip says "${word}"`, s.chip === word && s.chipCls === cls, s);
  ck(`${tag}: All months says "${word}" for the same month`, s.all === word && s.allCls === cls && s.aria.indexOf('Nov 2026: ' + word) === 0, s);
  ck(`${tag}: the line under the month says "${word}" too, or says it in its own sentence`, s.dockWord === word || (s.dockWord === '' && s.dock.toLowerCase().includes(word.toLowerCase())), s.dock);
};
const setup = async (p, o) => {
  await L.zero(p); await p.evaluate(c => { __t.S.ui.cur = c; }, o.cur);
  await L.base(p, o); await w(300); await skip(p);
  await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true; __t.persist(); __t.restructure(); });
};
const borrow = async p => { await L.tab(p, 'tab-month'); await L.clickText(p, 'Month'); await w(300); await p.evaluate(() => { const x = document.querySelector('[data-fx="borrow"]'); x && x.click(); }); await w(500); };
(async () => {
  const { b, p, errs } = await R.phone({ w: 412, h: 915, dpr: 1, mobile: true, keep: true });
  await clock(p, '2026-11-19T10:00:00'); await p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(p);
  /* 1. covered only by borrowing: pay 2,000, bills 2,300, bank 100, minimum 200, 400 borrowed */
  await setup(p, { cur: '$', pay: 2000, bank: 100, min: 200, defs: { 'bill:rent': 1800, 'bill:food': 500, envelope: 0, education: 0, invest: 0, give: 0 }, noTrip: true, eT: 10000, eS: 3000, eM: 0 });
  await borrow(p);
  same('covered by a borrow', await read(p), 'Tight month', 'tight');
  /* 2. past pay, part borrowed, the balance covers the rest: pay 300,000, bills 353,800, bank 50,000, minimum 30,000 */
  await setup(p, { cur: '¥', pay: 300000, bank: 50000, min: 30000, defs: { 'bill:rent': 300000, 'bill:food': 53800, envelope: 0, education: 0, invest: 0, give: 0 }, noTrip: true, eT: 1000000, eS: 100000, eM: 0 });
  await borrow(p);
  same('past pay with a borrow', await read(p), 'Tight month', 'tight');
  /* 3. Free to spend logged past its plan: pay 300,000, bills 140,000, Free to spend 30,000, then 35,000 logged in it */
  await setup(p, { cur: '¥', pay: 300000, bank: 200000, min: 30000, defs: { 'bill:rent': 100000, 'bill:food': 40000, envelope: 30000, education: 10000, invest: 20000, give: 5000 }, tM: 15000, eT: 1000000, eS: 0, eM: 80000 });
  same('on plan', await read(p), 'On plan', 'good');
  await L.rc(p, 35000, 'envelope', '2026-11-18');
  same('past Free to spend', await read(p), 'Over Free to spend', 'short');
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc30_one_status: ${bad} FAIL` : 'qc30_one_status: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc30_one_status: FAIL'); process.exit(1); });
