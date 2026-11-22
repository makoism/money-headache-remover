/* QC round 8 wording confusing 3: Settings Backup said "Your numbers were set to zero. The numbers from before are kept until
   24 Nov 2026. Put them back" while new numbers had been typed since, so Put them back read as harmless. Once anything changed after
   the reset it says "Numbers from before 21 Nov are kept until 24 Nov 2026." and the button "Put them back (replaces what is here now)".
   Right after the reset, and after a reload with nothing typed, it keeps the first wording. Made-up numbers.
   QC round 10 data safety B1: Put them back now keeps everything done since, so a receipt logged since no longer counts as "changed";
   a new pay does, and the tap names it first.
   Run: PAGE=/abs/money-map-team.html node tests/qc/qc21_keep_changed.js */
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 400)); } };
const clock = (p, iso) => p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, iso);
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
const keepLine = async p => { await L.tab(p, 'tab-home'); await L.settings(p); await w(500);
  return p.evaluate(() => { const e = document.getElementById('keepLine'); return e && !e.hidden && e.getClientRects().length ? { txt: document.getElementById('keepTxt').innerText.replace(/\s+/g, ' ').trim(), btn: document.getElementById('keepBack').innerText.trim() } : null; }); };
const reload = async p => { await w(900); await p.reload(); await w(1500); await skip(p); };
const FIRST = 'Your numbers were set to zero. The numbers from before are kept until 24 Nov 2026.', AFTER = 'Numbers from before 21 Nov are kept until 24 Nov 2026.';
(async () => {
  const { b, p, errs } = await R.phone({ w: 412, h: 915, dpr: 1, mobile: true, keep: true });
  await clock(p, '2026-11-21T10:00:00'); await p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(p);
  await L.zero(p); await p.evaluate(() => { __t.S.ui.cur = '$'; });
  await L.base(p, { pay: 3200, bank: 1500, min: 0 }); await w(300); await skip(p);
  await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true; __t.persist(); __t.restructure(); });
  await L.rc(p, 123, 'envelope', null, 'Made-up lunch');
  await L.zero(p); await w(500);   /* Set all to zero: the numbers from before are kept */
  await p.evaluate(() => { const u = document.getElementById('undoBar'); if (u) u.hidden = true; }); await w(200);
  const a = await keepLine(p);
  ck('right after the reset: the first wording', a && a.txt === FIRST && a.btn === 'Put them back', a);
  await reload(p);
  const a2 = await keepLine(p);
  ck('after a reload with nothing typed: still the first wording', a2 && a2.txt === FIRST && a2.btn === 'Put them back', a2);
  await L.rc(p, 45, 'envelope', null, 'Made-up snack'); await w(400);   /* something typed after the reset */
  /* QC round 10 data safety B1: Put them back now keeps what was done since, so a receipt logged since changes nothing here */
  const c0 = await keepLine(p);
  ck('after a new receipt: still the first wording, Put them back keeps the receipt', c0 && c0.txt === FIRST && c0.btn === 'Put them back', c0);
  await p.evaluate(() => __t.ACT.setPay(2900)); await w(600);   /* a new pay typed after the reset: putting the old one back would replace it */
  const c = await keepLine(p);
  ck('after a new pay: "' + AFTER + '"', c && c.txt === AFTER, c);
  ck('after a new pay: the button says it replaces what is here now', c && c.btn === 'Put them back (replaces what is here now)', c);
  await reload(p);
  const c2 = await keepLine(p);
  ck('after a reload: still says it replaces what is here now', c2 && c2.txt === AFTER && c2.btn === 'Put them back (replaces what is here now)', c2);
  const ask = await p.evaluate(() => { const k = document.getElementById('keepBack'); k.click(); return k.innerText.trim(); }); await w(800);
  ck('the first tap names what it would replace ("' + ask + '")', /^Tap again: Undo also removes what you did since: your changes to your pay\./.test(ask), ask);
  ck('...and changes nothing yet', await p.evaluate(() => __t.calcAll(__t.S).byYm['2026-11'].a) === 2900);
  await p.evaluate(() => { const k = document.getElementById('keepBack'); k && k.click(); }); await w(800);
  const s = await p.evaluate(() => ({ pay: __t.calcAll(__t.S).byYm['2026-11'].a, kept: !!__t.S.ui.keep, rc: __t.S.receipts.map(r => r.a) }));
  ck('Put them back still brings the numbers back (pay 3,200)', s.pay === 3200, s);
  ck('and both receipts stay (123 and 45)', s.rc.indexOf(123) >= 0 && s.rc.indexOf(45) >= 0, s);
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc21_keep_changed: ${bad} FAIL` : 'qc21_keep_changed: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc21_keep_changed: FAIL'); process.exit(1); });
