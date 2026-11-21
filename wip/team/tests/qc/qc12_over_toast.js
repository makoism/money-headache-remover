/* QC round 5 north-star 6: logging a spend that goes over plan showed "Logged. ... over for this month." and then the Undo bar
   ("Logged $12.50: Transport. Undo") came up on top of it. The message sits above the Undo bar, on Home and on Receipts.
   Made-up numbers.  Run: node tests/qc/qc12_over_toast.js */
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 400)); } };
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
(async () => {
  const { b, p, errs } = await R.phone({ w: 412, h: 915, dpr: 1, mobile: true, keep: true });
  await p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(p);
  await L.zero(p); await p.evaluate(() => { __t.S.ui.cur = '$'; });
  await L.base(p, { pay: 3200, bank: 3000, min: 0, defs: { 'bill:rent': 1200, 'bill:food': 400, envelope: 385, education: 100, invest: 100, give: 50 }, tT: 600, tM: 100, eT: 4500, eS: 0, eM: 300 }); await w(300); await skip(p);
  await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true; delete S.ui.bd; __t.persist(); __t.restructure(); });
  await L.tab(p, 'tab-home'); await w(400);
  await L.rc(p, 500, 'envelope', null, 'Made-up earlier'); await w(9000);   /* past its Undo bar and messages */
  await L.tab(p, 'tab-home'); await w(400);
  await p.focus('#hAmt'); await p.keyboard.type('125'); await p.evaluate(() => document.getElementById('hSave').click());
  let seen = null;
  for (let i = 0; i < 35 && !seen; i++) { await w(200); seen = await p.evaluate(() => { const c = document.getElementById('cheer'), u = document.getElementById('undoBar');
    if (!c || !c.classList.contains('on') || !/over/.test(c.textContent)) return null; const cr = c.getBoundingClientRect(), ur = u && !u.hidden && u.getClientRects().length ? u.getBoundingClientRect() : null;
    return { text: c.textContent, bar: !!ur, clear: !ur || cr.bottom <= ur.top + 0.5 || cr.top >= ur.bottom - 0.5, inside: cr.top >= 0 && cr.bottom <= innerHeight, c: [cr.top, cr.bottom], u: ur && [ur.top, ur.bottom] }; }); }
  ck('the over message shows', !!seen, seen);
  ck('it shows while the Undo bar is up (the case in the report)', !!(seen && seen.bar), seen);
  ck('it is not behind the Undo bar, and inside the screen', !!(seen && seen.clear && seen.inside), seen);
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc12_over_toast: ${bad} FAIL` : 'qc12_over_toast: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc12_over_toast: FAIL'); process.exit(1); });
