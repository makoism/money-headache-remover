/* QC round 8 north-star gate finding 1: a short month covered by borrowing from the emergency fund said "You are okay", "Bills are covered
   and burrows are planned for.", the sheet "Everything planned fits in your pay." with "Pay and other money in" holding pay plus the borrow,
   and the Plan line "... borrowed from your emergency fund · On plan" with a green tick. The one right answer: a month that balances only by
   borrowing is not okay and not on plan. Home says what covers it and by how much the bills pass the pay; the sheet lists pay and the borrow on
   their own rows; Plan shows the model's tight status. Made-up numbers.  Run: node tests/qc/qc24_borrow_status.js */

const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 500)); } };
const clock = (p, iso) => p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, iso);
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
const click = async (p, sel) => { await p.evaluate(s => { const e = document.querySelector(s); if (e) e.click(); }, sel); await w(600); };
const t = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); return e ? e.innerText.replace(/\s+/g, ' ').trim() : ''; }, sel);
const sheet = async (p, k) => { await click(p, `[data-why="${k}"]`); const s = await t(p, '#why'); await click(p, '#why [data-whyno].btn'); return s; };
const home = async p => { await L.tab(p, 'tab-home'); await w(400); return p.evaluate(() => { const e = document.querySelector('#hStatus'); return { st: e ? e.innerText.replace(/\s+/g, ' ').trim() : '', cls: e ? e.className + ' ' + [...e.querySelectorAll('*')].map(x => x.className && x.className.baseVal === undefined ? x.className : '').join(' ') : '' }; }); };
const plan = async p => { await L.tab(p, 'tab-month'); await w(400); return p.evaluate(() => ({ chip: document.getElementById('chip').innerText.trim(), chipCls: document.getElementById('chip').className, dock: document.getElementById('dockTxt').innerText.trim(), btns: [...document.querySelectorAll('#fixBtns button')].map(b => b.innerText.trim()) })); };
(async () => {
  const { b, p, errs } = await R.phone({ w: 412, h: 915, dpr: 1, mobile: true, keep: true });
  await clock(p, '2026-11-19T10:00:00'); await p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(p);
  await L.zero(p); await p.evaluate(() => { __t.S.ui.cur = '$'; });
  /* pay 2,000, bills 2,300 (rent 1,800 and food 500), bank 100, minimum 200, 3,000 already in the emergency fund: borrow 400 */
  await L.base(p, { pay: 2000, bank: 100, min: 200, defs: { 'bill:rent': 1800, 'bill:food': 500, envelope: 0, education: 0, invest: 0, give: 0 }, noTrip: true, eT: 10000, eS: 3000, eM: 0 });
  await w(300); await skip(p);
  await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true; __t.persist(); __t.restructure(); });
  let pl = await plan(p);
  ck('start: Plan offers "Borrow $400 from emergency fund"', pl.btns.includes('Borrow $400 from emergency fund'), pl.btns);
  await click(p, '[data-fx="borrow"]'); await w(300);
  const dr = await p.evaluate(() => __t.calcAll(__t.S).byYm['2026-11'].draw);
  ck('the borrow is $400', dr === 400, dr);
  const h = await home(p);
  ck('Home: the status is not "You are okay"', !/You are okay/.test(h.st), h.st);
  ck('Home: the status is not green', !/\bgood\b/.test(h.cls), h.cls);
  ck('Home: never "Bills are covered and burrows are planned for"', !/Bills are covered and burrows are planned for/.test(h.st), h.st);
  ck('Home: says the borrow covers the month and by how much the bills pass the pay', h.st.includes('Covered this month by $400 from your emergency fund. Your bills are $300 more than your pay.'), h.st);
  const s = await sheet(p, 'status');
  ck('sheet: never "Everything planned fits in your pay"', /Where you stand in/.test(s) && !/Everything planned fits in your pay/.test(s), s);
  ck('sheet: pay on its own row ($2,000)', /Pay and other money in \$2,000\b/.test(s) && !/\$2,400/.test(s), s);
  ck('sheet: the borrow on its own row ($400)', /Borrowed from your emergency fund \$400\b/.test(s), s);
  pl = await plan(p);
  ck('Plan: the status chip is not "On plan"', !/On plan/.test(pl.chip) && !/\bgood\b/.test(pl.chipCls), pl);
  ck('Plan: the line under the month is not "On plan"', !/On plan/.test(pl.dock) && /borrowed from your emergency fund/.test(pl.dock), pl.dock);
  /* undo the borrow, lower the rent so pay covers the bills: on plan again, no borrow words */
  await click(p, '[data-fx="unborrow"]');
  await p.evaluate(() => { const S = __t.S; S.plan.lines.find(l => l.key === 'bill:rent').def = 1400; __t.persist(); __t.restructure(); });
  const h2 = await home(p);
  ck('pay covers the bills: "You are okay" and no borrow words', /You are okay/.test(h2.st) && !/Covered this month by/.test(h2.st), h2.st);
  const s2 = await sheet(p, 'status');
  ck('pay covers the bills: the sheet says it fits and has no borrowed row', /Everything planned fits in your pay/.test(s2) && !/Borrowed from your emergency fund/.test(s2), s2);
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc24_borrow_status: ${bad} FAIL` : 'qc24_borrow_status: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc24_borrow_status: FAIL'); process.exit(1); });
