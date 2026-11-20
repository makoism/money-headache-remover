/* SF6 (QC8_NUMBERS_SHOULD_FIX.md): a borrow from the emergency fund stays after the plan stops needing it. Free to spend was lowered, the
   bank would end above the minimum without the borrow, and the plan still took the whole borrow from the Emergency fund with nothing saying so.
   The one right answer, by the app's own rule (a borrow is offered for what brings the bank up to the minimum balance): when the plan now
   needs less, Plan says how much of the borrow it still needs and how much only sits in the bank, and offers to borrow only what is needed.
   Nothing is changed without a tap. When the plan needs none of it, Plan says so next to Undo borrow. Made-up numbers in yen.
   Run: node tests/qc/qc10_borrow_fit.js */
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 500)); } };
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
const look = p => p.evaluate(() => ({ note: document.getElementById('jarNote').innerText, verdict: document.getElementById('verdict').innerText, btns: [...document.querySelectorAll('#fixBtns button')].map(b => b.innerText.trim()),
  draw: (() => { const C = __t.calcAll(__t.S); return C.byYm['2026-11'].draw; })(), bankEnd: __t.calcAll(__t.S).byYm['2026-11'].bankEnd }));
const food = async (p, v) => { await p.evaluate(v => { const S = __t.S; S.plan.lines.find(l => l.key === 'bill:food').def = v; __t.persist(); __t.restructure(); }, v); await L.tab(p, 'tab-home'); await L.tab(p, 'tab-month'); await w(500); };
(async () => {
  const { b, p, errs } = await R.phone({ w: 412, h: 915, dpr: 1, mobile: true, keep: true });
  await p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, '2026-11-19T10:00:00');
  await p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(p);
  await L.zero(p); await p.evaluate(() => { __t.S.ui.cur = '¥'; });
  /* pay 120,000, rent 100,000, food 40,050, bank 10,000, minimum 12,000, 80,000 in the emergency fund: 22,050 to borrow */
  await L.base(p, { pay: 120000, bank: 10000, min: 12000, defs: { 'bill:rent': 100000, 'bill:food': 40050, envelope: 0, education: 0, invest: 0, give: 0 }, noTrip: true, eT: 300000, eS: 80000, eM: 0 });
  await w(300); await skip(p);
  await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true; __t.persist(); __t.restructure(); });
  await L.tab(p, 'tab-month'); await w(500);
  let s = await look(p);
  ck('start: Plan offers to borrow ¥22,050', s.btns.includes('Borrow ¥22,050 from emergency fund'), s.btns);
  await p.evaluate(() => document.querySelector('[data-fx="borrow"]').click()); await w(800);
  s = await look(p);
  ck('after the borrow: ¥22,050 borrowed, the bank ends at the ¥12,000 minimum', s.draw === 22050 && s.bankEnd === 12000, s);
  ck('after the borrow: no "Borrow only" offer while all of it is needed', !s.btns.some(t => /^Borrow only/.test(t)), s.btns);

  /* food lowered by 10,000: the plan now needs 12,050 of the borrow; 10,000 of it would only sit in the bank */
  await food(p, 30050);
  s = await look(p);
  ck('food lowered: nothing changes on its own (still ¥22,050 borrowed)', s.draw === 22050, s);
  ck('food lowered: Plan says the plan needs only ¥12,050 of the borrow now and ¥10,000 of it is not needed', /needs only ¥12,050 of the borrow now/.test(s.verdict) && /¥10,000 of it is not needed/.test(s.verdict) && !/stays in the bank/.test(s.verdict), s.verdict);   /* one name, one amount: the row "Borrowed, stays in the bank" is a different amount (QC10 numbers blocker 2) */
  ck('food lowered: Plan offers "Borrow only ¥12,050"', s.btns.includes('Borrow only ¥12,050'), s.btns);
  await p.evaluate(() => document.querySelector('[data-fx="borrowfit"]').click()); await w(800);
  s = await look(p);
  ck('after Borrow only: ¥12,050 borrowed and the bank ends at the ¥12,000 minimum', s.draw === 12050 && s.bankEnd === 12000, s);
  ck('after Borrow only: the offer is gone', !s.btns.some(t => /^Borrow only/.test(t)) && !/needs only/.test(s.verdict), s);

  /* food lowered again: the bank ends above the minimum without any borrow */
  await food(p, 10050);
  s = await look(p);
  ck('food lowered again: still ¥12,050 borrowed until a tap', s.draw === 12050, s);
  ck('food lowered again: Plan says the plan does not need the borrow now', /doesn't need the borrow now/.test(s.verdict) && !/stays in the bank/.test(s.verdict), s.verdict);
  ck('food lowered again: Undo borrow is offered and no "Borrow only"', s.btns.includes('Undo borrow') && !s.btns.some(t => /^Borrow only/.test(t)), s.btns);
  await p.evaluate(() => document.querySelector('[data-fx="unborrow"]').click()); await w(800);
  s = await look(p);
  ck('after Undo borrow: nothing borrowed and nothing said about a borrow', s.draw === 0 && !/borrow/i.test(s.verdict), s);
  /* QC10 north-star F3: part of the gap borrowed, the balance covers the rest. Start bank 15,000: the borrow is 17,050; food lowered by
     10,000 and Borrow only 7,050: 3,000 of the 10,050 over pay is covered by the balance, the bank ends at the 12,000 minimum */
  await p.evaluate(() => { const S = __t.S; S.cfg.bankStart = 15000; __t.persist(); __t.restructure(); }); await food(p, 40050);
  s = await look(p);
  if (s.btns.some(t => /^Borrow ¥17,050/.test(t))) { await p.evaluate(() => document.querySelector('[data-fx="borrow"]').click()); await w(800); }
  await food(p, 30050); s = await look(p);
  if (s.btns.includes('Borrow only ¥7,050')) { await p.evaluate(() => document.querySelector('[data-fx="borrowfit"]').click()); await w(800); }
  s = await look(p);
  ck('covered: ¥7,050 borrowed, the bank ends at the ¥12,000 minimum', s.draw === 7050 && s.bankEnd === 12000, s);
  ck('covered: the note under the list does not ask to lower a bill when the balance covers the rest', !/Lower a bill/.test(s.note) && /your balance covers the other ¥3,000/i.test(s.note), s.note);
  ck('covered: the banner says the balance covers the other ¥3,000, not "it"', /covers the other ¥3,000/.test(s.verdict) && !/covers it\b/.test(s.verdict), s.verdict);
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc10_borrow_fit: ${bad} FAIL` : 'qc10_borrow_fit: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc10_borrow_fit: FAIL'); process.exit(1); });
