/* QC10 round 2 north-star note: at 412x915 the Add a card form opened with Save and Cancel under the bottom Help bar, so a tap on them hit
   the bar. After opening, the whole form, its Save and Cancel included, is on screen above the bottom bar. Made-up numbers.
   Run: node tests/qc/qc10_card_form.js */
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 400)); } };
(async () => {
  const { b, p, errs } = await R.phone({ w: 412, h: 915, dpr: 1, mobile: true, keep: true });
  await p.goto('file://' + PAGE + '?sfxtest'); await w(1200);
  for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); }
  await L.zero(p); await p.evaluate(() => { __t.S.ui.cur = '$'; });
  await L.base(p, { pay: 3000, bank: 1000, min: 0 });
  await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true; __t.persist(); __t.restructure(); });
  await L.tab(p, 'tab-home'); await w(500);
  await p.focus('#mpBankIn'); await p.keyboard.type('900'); await p.evaluate(() => document.getElementById('mpBankSave').click()); await w(700);
  const add = await p.$('#mpCardAdd'); await add.evaluate(e => e.scrollIntoView({ block: 'end' })); await w(300); await add.tap(); await w(900);
  const r = await p.evaluate(() => { const top = el => { const q = el.getBoundingClientRect(); return document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2); };
    const s = document.getElementById('mpCardSave'), c = document.getElementById('mpCardNo'), q = s.getBoundingClientRect();
    return { saveHit: top(s) === s || s.contains(top(s)), cancelHit: top(c) === c || c.contains(top(c)), bottom: Math.round(q.bottom), vh: innerHeight }; });
  ck('after opening Add a card, Save can be tapped (nothing on top of it)', r.saveHit, r);
  ck('after opening Add a card, Cancel can be tapped', r.cancelHit, r);
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc10_card_form: ${bad} FAIL` : 'qc10_card_form: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc10_card_form: FAIL'); process.exit(1); });
