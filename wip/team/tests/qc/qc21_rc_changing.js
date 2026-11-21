/* QC round 8 novice confusing 1: the Receipts Edit form never said which receipt it changes. A line above the form says
   "Changing: $12, Free to spend, 21 Nov." (amount, category, date from the receipt) while editing, and goes away after Save
   changes or Cancel. Made-up numbers.  Run: PAGE=/abs/money-map-team.html node tests/qc/qc21_rc_changing.js */

const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 500)); } };
const clock = (p, iso) => p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, iso);
const line = p => p.evaluate(() => { const e = document.getElementById('rcChanging'), f = document.getElementById('rcForm');
  if (!e || !e.getClientRects().length || e.hidden) return { shown: false };
  return { shown: true, text: e.innerText.replace(/\s+/g, ' ').trim(), above: e.getBoundingClientRect().bottom <= f.querySelector('.field').getBoundingClientRect().top + 1 }; });
(async () => {
  const { b, p, errs } = await R.phone({ w: 390, h: 844, dpr: 1, mobile: true });
  await clock(p, '2026-11-21T10:00:00'); await p.goto('file://' + PAGE + '?sfxtest'); await w(1200);
  for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s) s.click(); }, id); await w(400); }
  await p.evaluate(() => { __t.S.ui.cur = '$'; __t.persist(); __t.restructure(); });
  await L.rc(p, 12, 'envelope', '2026-11-21', 'Made-up lunch'); await w(300);
  ck('before Edit: no Changing line', !(await line(p)).shown, await line(p));
  await p.evaluate(() => { const r = __t.S.receipts.find(x => +x.a === 12); document.querySelector(`[data-rcedit="${r.id}"]`).click(); }); await w(600);
  const a = await line(p);
  ck('Edit: the line says which receipt', a.shown && a.text === 'Changing: $12, Free to spend, 21 Nov.', a);
  ck('Edit: the line sits above the form fields', a.shown && a.above, a);
  await p.click('#rcCancel'); await w(400);
  ck('Cancel: the line goes away', !(await line(p)).shown, await line(p));
  await p.evaluate(() => { const r = __t.S.receipts.find(x => +x.a === 12); document.querySelector(`[data-rcedit="${r.id}"]`).click(); }); await w(600);
  await L.typeIn(p, '#rcAmt', '15'); await p.click('#rcSave'); await w(600);
  ck('Save changes: the line goes away', !(await line(p)).shown, await line(p));
  ck('Save changes: the receipt is $15 now', await p.evaluate(() => __t.S.receipts.some(x => +x.a === 15)));
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc21_rc_changing: ${bad} FAIL` : 'qc21_rc_changing: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc21_rc_changing: FAIL'); process.exit(1); });
