/* QC round 4 north-star agent check C4: with no card added, the More card (Free to spend) said "your bank after the cards is less than
   your bills still to pay and Free to spend". Cards are named only when there is one. Made-up numbers.
   Run: node tests/qc/qc11_after_cards.js */
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 500)); } };
const clock = (p, iso) => p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, iso);
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
const click = async (p, sel) => { await p.evaluate(s => { const e = document.querySelector(s); if (e) e.click(); }, sel); await w(600); };
const spend = async p => { await L.tab(p, 'tab-month'); await L.tab(p, 'tab-home'); await w(500); return p.evaluate(() => { const e = document.getElementById('hSpend'); return e ? e.textContent.replace(/\s+/g, ' ') : ''; }); };
(async () => {
  const { b, p, errs } = await R.phone({ w: 412, h: 915, dpr: 1, mobile: true, keep: true });
  await clock(p, '2026-11-19T10:00:00'); await p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(p);
  await L.zero(p); await p.evaluate(() => { __t.S.ui.cur = '¥'; });
  await L.base(p, { pay: 300000, bank: 300000, min: 0 }); await w(400); await skip(p);
  await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true; __t.persist(); __t.restructure(); });
  await L.tab(p, 'tab-home'); await w(300);
  if (await p.$('#mpCheck')) await click(p, '#mpCheck');
  await L.typeIn(p, '#mpBankIn', '100000'); await click(p, '#mpBankSave');
  const a = await spend(p);
  ck('no card: Free to spend says not safe to spend yet', /Not safe to spend yet/.test(a), a);
  ck('no card: it does not talk about "the cards"', !/after the cards/.test(a), a.match(/Not safe.{0,120}/));
  await click(p, '#mpCardAdd'); await L.typeIn(p, '#mpCardName', 'Made-up card'); await L.typeIn(p, '#mpCardOwed', '26000'); await L.typeIn(p, '#mpCardDay', '27'); await click(p, '#mpCardSave'); await w(600);
  const c = await spend(p);
  ck('with a card: it says "your bank after the cards"', /your bank after the cards is less/.test(c), c.match(/Not safe.{0,120}/));
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc11_after_cards: ${bad} FAIL` : 'qc11_after_cards: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc11_after_cards: FAIL'); process.exit(1); });
