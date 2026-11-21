/* QC10 numbers should-fix 2: the month-end card ("November: X of Free to spend isn't logged as spent") said "Count it in the bank or put
   it toward a goal" when no goal had room, so it showed no goal button. The words now offer only what the card shows. Made-up numbers.
   Run: node tests/qc/qc10_sweep_words.js */
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 500)); } };
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
const card = p => p.evaluate(() => { const e = document.getElementById('hNext'); return { text: e && !e.hidden ? e.innerText.replace(/\s+/g, ' ') : '', goal: !!(e && e.querySelector('[data-sweep]')), bank: !!(e && e.querySelector('[data-sweepbank]')) }; });
(async () => {
  let errsAll = [];
  for (const room of [false, true]) {
    const { b, p, errs } = await R.phone({ w: 390, h: 844, dpr: 1, mobile: true, keep: true });
    await p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, '2026-12-05T10:00:00');
    await p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(p);
    await L.zero(p); await p.evaluate(() => { __t.S.ui.cur = '¥'; });
    /* the only goal is the Emergency fund; full from the start (no room), or with room */
    await L.base(p, { pay: 300000, bank: 100000, min: 0, noTrip: true, eT: 200000, eS: room ? 50000 : 200000, eM: 10000 });
    await p.evaluate(() => { const S = __t.S; S.plan.goals = S.plan.goals.filter(g => g.emergency); S.ui.main = S.plan.goals[0].id; S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true;
      S.receipts = [{ id: 'w1', d: '2026-11-04', a: 15000, c: 'envelope', cn: 'Free to spend', n: '' }, { id: 'w2', d: '2026-11-12', a: 10000, c: 'envelope', cn: 'Free to spend', n: '' }]; __t.persist(); __t.restructure(); });
    await L.tab(p, 'tab-month'); await L.tab(p, 'tab-home'); await w(600);
    const c = await card(p), T = room ? 'a goal with room: ' : 'no goal with room: ';
    ck(T + 'the card asks about November\'s ¥15,000', /Nov: ¥15,000 of Free to spend/.test(c.text) && c.bank, c);
    if (room) ck(T + 'it offers a goal and says so', c.goal && /put it toward a goal/.test(c.text), c);
    else ck(T + 'no goal button, and the words do not promise one', !c.goal && !/toward a goal/.test(c.text) && /Keep it in the bank/.test(c.text), c);
    errsAll = errsAll.concat(errs); await b.close();
  }
  const e2 = errsAll.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  console.log(bad ? `qc10_sweep_words: ${bad} FAIL` : 'qc10_sweep_words: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc10_sweep_words: FAIL'); process.exit(1); });
