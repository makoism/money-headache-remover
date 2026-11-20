/* QC round 4 data safety (confusing 5) and north-star agent check C8: after a big change (a backup or cloud copy loaded, Set all to
   zero) the numbers from before are kept for 3 days, but the only way back was the Undo bar, which goes after about 25 seconds and
   comes back only on the next open. Settings shows the kept copy with Put them back while it is kept, and putting it back keeps what
   was there instead. Made-up numbers.  Run: node tests/qc/qc11_keep_back.js */
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 400)); } };
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
(async () => {
  const { b, p, errs } = await R.phone({ w: 412, h: 915, dpr: 1, mobile: true, keep: true });
  await p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(p);
  await L.zero(p); await p.evaluate(() => { __t.S.ui.cur = '$'; });
  await L.base(p, { pay: 3200, bank: 1500, min: 0 }); await w(300); await skip(p);
  await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true; __t.persist(); __t.restructure(); });
  await L.rc(p, 123, 'envelope', null, 'Made-up lunch');
  await L.zero(p); await w(500);   /* Set all to zero: the numbers from before are kept */
  await p.evaluate(() => { const u = document.getElementById('undoBar'); if (u) u.hidden = true; }); await w(200);   /* the bar has gone, as after 25 seconds */
  await L.tab(p, 'tab-home'); await L.settings(p); await w(500);
  const line = await p.evaluate(() => { const e = document.getElementById('keepLine'); return e && !e.hidden && e.getClientRects().length ? e.innerText.replace(/\s+/g, ' ') : ''; });
  ck('Settings shows the kept copy and when it goes', /kept until/.test(line) && /Put them back/.test(line), line);
  await p.evaluate(() => { const k = document.getElementById('keepBack'); k && k.click(); }); await w(800);
  const s = await p.evaluate(() => ({ pay: __t.calcAll(__t.S).byYm['2026-11'].a, kept: !!__t.S.ui.keep }));
  ck('Put them back brings the numbers back (pay 3,200)', s.pay === 3200, s);
  ck('what was there before putting back is kept in its place', s.kept, s);
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc11_keep_back: ${bad} FAIL` : 'qc11_keep_back: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc11_keep_back: FAIL'); process.exit(1); });
