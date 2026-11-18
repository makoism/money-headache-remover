/* Currency: switching or loading a currency never changes a number the person typed. Replaces the data-safety part of
   tests/regression/team_cur.js (written for the pre-38 page, with fixtures that lived only in /tmp; rewritten 2026-11-18 with made-up numbers).
     A. an untouched sample: the whole sample follows the new currency, and the note says so
     B. pay typed, bills and goals still the sample: only the sample bills and goals follow; pay and receipts unchanged
     C. a plan the person edited: nothing changes but the symbol, and the note says so
     D. a saved copy with no currency is an old peso copy: it loads in pesos, every amount unchanged (38.28)
     E. an old copy in yen on the original peso-sized sample (made by older builds): the sample bills become yen-sized, the typed pay stays
     F. the same old yen copy with one bill edited: left exactly as it is
   Receipts never change in any case.  Run: node tests/qc/currency_ui.js */
const vm = require('vm'), fs = require('fs');
const { phone, w } = require('/tmp/v39/real.js');
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html', KEY = 'money-map-template-v2';
const ctx = vm.createContext({ console, Math, JSON, Date });
vm.runInContext(fs.readFileSync(process.env.MODEL || '/home/claude/work/team/model.js', 'utf8') + '\n;this.__M={basePlan,presetState,sampleOf};', ctx);
const M = ctx.__M;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 300)); } };
const RC = [{ id: 'rc1', d: '2026-11-07', a: 1234, c: 'envelope', cn: 'Free to spend', n: '' }, { id: 'rc2', d: '2026-11-19', a: 56.5, c: 'other', cn: 'Other', n: '' }];
async function open(saved) {
  const o = await phone({ w: 390, h: 844, dpr: 1, mobile: true });
  if (saved) await o.p.evaluateOnNewDocument((k, v) => { localStorage.setItem(k, v); }, KEY, JSON.stringify(saved));
  await o.p.goto('file://' + PAGE + '?sfxtest#2026-11'); await w(1300);
  await o.p.evaluate(() => { ['tourSkip', 'coSkip'].forEach(i => { const e = document.getElementById(i); e && e.click(); }); }); await w(400);
  return o;
}
const state = p => p.evaluate(() => JSON.parse(JSON.stringify({ cur: __t.S.ui.cur, plan: __t.S.plan, steps: __t.S.steps, cfg: __t.S.cfg, receipts: __t.S.receipts })));
const lineDefs = st => st.plan.lines.map(l => [l.id, l.def]);
async function switchTo(p, cur) {
  await p.evaluate(() => document.getElementById('gearBtn').click()); await w(500);
  await p.select('#curSel', cur); await w(500);
  return p.evaluate(() => (document.getElementById('curNote') || {}).textContent || '');
}
(async () => {
  /* A. untouched sample (a new copy starts as the yen sample) */
  { const { b, p, errs } = await open(null);
    const note = await switchTo(p, '€'), s = await state(p), want = M.presetState('€');
    ck('A. an untouched sample follows the new currency', s.cur === '€' && JSON.stringify(lineDefs(s)) === JSON.stringify(lineDefs(want)), lineDefs(s).slice(0, 3));
    ck('A. ...and says so', note === 'Sample amounts now match this currency.', note);
    ck('A. no page errors', errs.length === 0, errs); await b.close(); }
  /* B and C: a yen copy with typed pay and receipts */
  const typed = M.presetState('¥'); typed.steps = { a: [{ from: '2026-11', v: 273000 }] }; typed.receipts = RC.slice(); typed.ui.done = { pay: true }; typed.ui.toured = true;
  { const { b, p, errs } = await open(typed);
    const note = await switchTo(p, '₱'), s = await state(p);
    ck('B. pay typed, sample bills: the bills follow the new currency', JSON.stringify(lineDefs(s)) === JSON.stringify(lineDefs(M.presetState('₱'))), lineDefs(s).slice(0, 3));
    ck('B. ...the typed pay is unchanged', JSON.stringify(s.steps.a) === JSON.stringify([{ from: '2026-11', v: 273000 }]), s.steps.a);
    ck('B. ...the receipts are unchanged', JSON.stringify(s.receipts.map(r => [r.id, r.d, r.a, r.c])) === JSON.stringify(RC.map(r => [r.id, r.d, r.a, r.c])), s.receipts);
    ck('B. ...and the note says so', note === 'Sample bills and goals now match this currency. Pay and receipts unchanged.', note);
    ck('B. no page errors', errs.length === 0, errs); await b.close(); }
  const edited = JSON.parse(JSON.stringify(typed)); edited.plan.lines.find(l => l.id === 'rent').def = 88800; edited.plan.goals[0].target = 1234500;
  { const { b, p, errs } = await open(edited);
    const before = await state(p), note = await switchTo(p, '€'), s = await state(p);
    ck('C. an edited plan: every amount unchanged', JSON.stringify([s.plan, s.steps, s.cfg]) === JSON.stringify([before.plan, before.steps, before.cfg]) && s.cur === '€', [lineDefs(s).slice(0, 2), s.cur]);
    ck('C. ...the receipts unchanged', JSON.stringify(s.receipts) === JSON.stringify(before.receipts), s.receipts);
    ck('C. ...and the note says only the symbol changed', note === 'Amounts unchanged. Only the symbol changed.', note);
    ck('C. no page errors', errs.length === 0, errs); await b.close(); }
  /* D. a saved copy with no currency: an old peso copy */
  const old = { v: 1, rev: 5, steps: { a: [{ from: '2026-11', v: 41000 }] }, once: {}, items: {}, cfg: { bankStart: 17300 }, ui: {}, plan: M.basePlan({}), receipts: RC.slice() };
  old.plan.lines.find(l => l.id === 'food').def = 6150;
  { const { b, p, errs } = await open(old); const s = await state(p);
    ck('D. a copy with no currency loads in pesos', s.cur === '₱', s.cur);
    ck('D. ...every amount unchanged', s.steps.a[0].v === 41000 && s.cfg.bankStart === 17300 && s.plan.lines.find(l => l.id === 'food').def === 6150 && s.receipts.length === 2, [s.steps.a, s.cfg]);
    ck('D. no page errors', errs.length === 0, errs); await b.close(); }
  /* E and F. an old copy in yen on the original peso-sized sample (older builds only changed the symbol) */
  const oldYen = { v: 1, rev: 9, steps: { a: [{ from: '2026-11', v: 287000 }] }, once: {}, items: {}, cfg: {}, ui: { cur: '¥' }, plan: M.basePlan({}), receipts: RC.slice() };
  { const { b, p, errs } = await open(oldYen); const s = await state(p), yen = M.presetState('¥');
    ck('E. old yen copy: the typed pay is kept', s.cur === '¥' && s.steps.a[0].v === 287000, [s.cur, s.steps.a]);
    ck('E. ...the sample bills are yen-sized, not peso-sized', s.plan.lines.find(l => l.id === 'rent').def === yen.plan.lines.find(l => l.id === 'rent').def && s.plan.lines.find(l => l.id === 'rent').def !== M.basePlan({}).lines.find(l => l.id === 'rent').def, lineDefs(s).slice(0, 3));
    ck('E. ...receipts unchanged', s.receipts.length === 2 && s.receipts[1].a === 56.5, s.receipts);
    ck('E. no page errors', errs.length === 0, errs); await b.close(); }
  const oldYenEdited = JSON.parse(JSON.stringify(oldYen)); oldYenEdited.plan.lines.find(l => l.id === 'util').def = 2210;
  { const { b, p, errs } = await open(oldYenEdited); const s = await state(p);
    ck('F. old yen copy with an edited bill: left exactly as it is', JSON.stringify(lineDefs(s)) === JSON.stringify(lineDefs(oldYenEdited)) && s.steps.a[0].v === 287000, lineDefs(s).slice(0, 3));
    ck('F. no page errors', errs.length === 0, errs); await b.close(); }
  console.log(bad ? 'CURRENCY FAILED ' + bad : 'CURRENCY ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('CRASH', e.stack); process.exit(2); });
