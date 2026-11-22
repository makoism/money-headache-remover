/* 38.31 number gate round 8, finding 4: in a currency with cents, a whole amount next to amounts with cents lost its decimals:
   "Free to spend: €100.01 planned, €20 spent, €80.01 safe to spend." In one sentence or one row, when any amount shows cents, every
   amount shows two decimals (€20.00). A line with only whole amounts stays whole (€100 planned, €20 spent).
   Made-up numbers.  Run: node tests/qc/qc23_cents_line.js */

const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 500)); } };
const clock = (p, iso) => p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, iso);
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
const t = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); return e ? e.innerText.replace(/⁠/g, '').replace(/\s+/g, ' ').trim() : ''; }, sel);
const cheer = p => p.evaluate(() => { const e = document.getElementById('cheer'); return e ? e.textContent.replace(/⁠/g, '') : ''; });
const setup = async (p, free) => {
  await L.zero(p); await p.evaluate(() => { __t.S.ui.cur = '€'; });
  await L.base(p, { pay: 3000, bank: 2000, min: 0, defs: { 'bill:rent': 1000, 'bill:food': 300, envelope: free, education: 50, invest: 0, give: 10 }, eT: 2000, eS: 500, eM: 10, tT: 600, tM: 15 }); await w(400); await skip(p);
  await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true; S.receipts = []; __t.persist(); __t.restructure(); });
};
const look = async p => { await L.tab(p, 'tab-receipts'); await w(300); const rs = await t(p, '#rcSum'), row = await p.evaluate(() => { const r = [...document.querySelectorAll('#rcCats tr')].find(x => /Free to spend/.test(x.innerText)); return r ? r.innerText.replace(/⁠/g, '').replace(/\s+/g, ' ').trim() : ''; });
  await L.tab(p, 'tab-month'); await L.clickText(p, 'Month'); await w(400); const pl = await t(p, '#rcLine'); return { rs, row, pl }; };
(async () => {
  const { b, p, errs } = await R.phone({ w: 412, h: 915, dpr: 1, mobile: true, keep: true });
  await clock(p, '2026-11-19T10:00:00'); await p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(p);
  await setup(p, 100.01);
  await L.rc(p, 20, 'envelope', '2026-11-12', 'Made-up a');
  const a = await look(p);
  ck('Receipts: "€100.01 planned, €20.00 spent, €80.01"', /€100\.01 planned, €20\.00 spent, €80\.01 safe to spend/.test(a.rs), a.rs);
  ck('Receipts: the Free to spend row "€100.01 €20.00 €80.01"', /€100\.01 €20\.00 €80\.01/.test(a.row), a.row);
  ck('Plan > Month: "€20.00 spent, €80.01 safe to spend"', /€20\.00 spent, €80\.01 safe to spend/.test(a.pl), a.pl);
  /* past the plan: one sentence after logging, with cents */
  await L.rc(p, 85.02, 'envelope', '2026-11-13', 'Made-up b');
  await L.rc(p, 3, 'other', '2026-11-13', 'Made-up c');
  const c = await cheer(p);
  ck('the message after logging: "€5.01 over" and "€3.00 over" in one sentence', /Free to spend is €5\.01 over/.test(c) && /Other is €3\.00 over/.test(c), c);
  const o = await look(p);
  ck('Receipts over: "€100.01 planned, €105.02 spent, €5.01 over"', /€100\.01 planned, €105\.02 spent, €5\.01 over/.test(o.rs), o.rs);
  const oth = await p.evaluate(() => { const r = [...document.querySelectorAll('#rcCats tr')].find(x => /^Other/.test(x.innerText)); return r ? [...r.cells].map(c => c.textContent).join(' ').replace(/\u2060/g, '').replace(/\s+/g, ' ').trim() : ''; });
  /* QC round 11 numbers 3: one table writes every amount one way, so a whole row next to rows with cents shows cents too */
  ck('Receipts: a whole row in a table with cents shows cents like the rest: "Other €3.00 €3.00 over"', /^Other €3\.00 €3\.00 over$/.test(oth), oth);
  /* whole amounts only: no decimals */
  await setup(p, 100);
  await L.rc(p, 20, 'envelope', '2026-11-12', 'Made-up d');
  const z = await look(p);
  ck('whole amounts stay whole: "€100 planned, €20 spent, €80 safe to spend"', /€100 planned, €20 spent, €80 safe to spend/.test(z.rs), z.rs);
  ck('whole amounts stay whole on Plan: "€20 spent, €80 safe to spend"', /€20 spent, €80 safe to spend/.test(z.pl), z.pl);
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc23_cents_line: ${bad} FAIL` : 'qc23_cents_line: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc23_cents_line: FAIL'); process.exit(1); });
