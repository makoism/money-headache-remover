/* QC round 4 wording and novice P2: Check your bank with the box left empty showed "Saved: $1,500 in your bank today." as if a balance
   had been typed, and "Saved" is the name of the burrows number on Home. Typed: "Bank updated: $X today." Left empty: it says the
   balance was kept and checked today. Made-up numbers.  Run: node tests/qc/qc11_bank_toast.js */
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 400)); } };
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
const click = async (p, sel) => { await p.evaluate(s => { const e = document.querySelector(s); if (e) e.click(); }, sel); await w(500); };
const said = p => p.evaluate(() => (window.__cheerLog || []).slice(-1)[0] || (document.getElementById('cheer') || {}).textContent || '');
(async () => {
  const { b, p, errs } = await R.phone({ w: 412, h: 915, dpr: 1, mobile: true, keep: true });
  await p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(p);
  await L.zero(p); await p.evaluate(() => { __t.S.ui.cur = '$'; });
  await L.base(p, { pay: 3200, bank: 1500, min: 0 }); await w(300); await skip(p);
  await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true; __t.persist(); __t.restructure(); });
  await L.tab(p, 'tab-home'); await w(300);
  if (await p.$('#mpCheck')) await click(p, '#mpCheck');
  await L.typeIn(p, '#mpBankIn', '1450'); await click(p, '#mpBankSave');
  const a = await said(p);
  ck('typed: "Bank updated: $1,450 today."', /Bank updated: \$1,450 today/.test(a) && !/^Saved:/.test(a), a);
  if (await p.$('#mpCheck')) await click(p, '#mpCheck');
  await click(p, '#mpBankSave');
  let c = ''; for (let i = 0; i < 20 && !/Kept/.test(c); i++) { await w(200); c = await said(p); }   /* a message right after another waits its turn */
  ck('left empty: it says the $1,450 was kept, not that one was saved', /\$1,450/.test(c) && /[Kk]ept/.test(c) && !/^Saved:/.test(c), c);
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc11_bank_toast: ${bad} FAIL` : 'qc11_bank_toast: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc11_bank_toast: FAIL'); process.exit(1); });
