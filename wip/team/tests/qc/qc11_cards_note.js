/* QC round 4 novice C6 (and north-star gate polish): right after adding a card on Home, Plan > Burrows said "Nothing here yet: add a
   card or loan" under Cards and loans, while Home listed the card. It says where cards paid in full are. Made-up numbers.
   Run: node tests/qc/qc11_cards_note.js */
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 400)); } };
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
const click = async (p, sel) => { await p.evaluate(s => { const e = document.querySelector(s); if (e) e.click(); }, sel); await w(500); };
const note = async p => { await L.tab(p, 'tab-month'); await L.clickText(p, 'Burrows'); await w(500); return p.evaluate(() => { const e = document.getElementById('secDebts'); return e ? e.innerText.replace(/\s+/g, ' ') : ''; }); };
(async () => {
  const { b, p, errs } = await R.phone({ w: 412, h: 915, dpr: 1, mobile: true, keep: true });
  await p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(p);
  await L.zero(p); await p.evaluate(() => { __t.S.ui.cur = '$'; });
  await L.base(p, { pay: 3200, bank: 1500, min: 0 }); await w(300); await skip(p);
  await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true; __t.persist(); __t.restructure(); });
  const a = await note(p);
  ck('no card anywhere: it says nothing about Home', !/on Home/.test(a), a.slice(0, 200));
  await L.tab(p, 'tab-home'); await w(300);
  if (await p.$('#mpCheck')) await click(p, '#mpCheck');
  await L.typeIn(p, '#mpBankIn', '1400'); await click(p, '#mpBankSave');
  await click(p, '#mpCardAdd'); await L.typeIn(p, '#mpCardName', 'Visa'); await L.typeIn(p, '#mpCardOwed', '620'); await L.typeIn(p, '#mpCardDay', '27'); await click(p, '#mpCardSave'); await w(500);
  const c = await note(p);
  ck('after a card on Home: Cards and loans says cards paid in full are on Home', /Cards you pay in full are on Home/.test(c), c.slice(0, 300));
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc11_cards_note: ${bad} FAIL` : 'qc11_cards_note: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc11_cards_note: FAIL'); process.exit(1); });
