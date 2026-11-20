/* Q2 (launch checklist): one bank story. After Check your bank and a card, the top of Home showed the bank now (typed) and the bank after
   the cards, lower Home showed "Bank at month end" (planned from the bank at the start of the month) and Plan said "Bank stays at ...".
   Three figures, two names, nothing tying them. The one right answer: the planned figure has one name on both tabs ("Bank at month end"),
   both tabs name the start figure it is planned from, and Home's note names the bank now next to it, so the reader can see why they differ.
   Made-up numbers.  Run: node tests/qc/qc10_bank_story.js */
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 500)); } };
const clock = (p, iso) => p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, iso);
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
const open = async () => { const x = await R.phone({ w: 390, h: 844, dpr: 1, mobile: true, keep: true }); await clock(x.p, '2026-11-19T10:00:00'); await x.p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(x.p); return x; };
const setup = async (p, defs) => {
  await L.zero(p); await p.evaluate(() => { __t.S.ui.cur = '¥'; });
  await L.base(p, { pay: 300000, bank: 100000, min: 0, defs, tT: 600000, tM: 15000, eT: 900000, eS: 50000, eM: 10000 });
  await w(400); await skip(p);
  await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true; __t.persist(); __t.restructure(); });
  await L.tab(p, 'tab-month'); await L.tab(p, 'tab-home'); await w(500);
};
const click = async (p, sel) => { await p.evaluate(s => { const e = document.querySelector(s); if (e) e.click(); }, sel); await w(600); };
/* Check your bank, then one card, by the buttons on Home */
const checkBankAndCard = async p => {
  if (await p.$('#mpCheck')) await click(p, '#mpCheck');
  await L.typeIn(p, '#mpBankIn', '94200'); await click(p, '#mpBankSave');
  await click(p, '#mpCardAdd'); await L.typeIn(p, '#mpCardName', 'Visa'); await L.typeIn(p, '#mpCardOwed', '26000'); await L.typeIn(p, '#mpCardDay', '27');
  await click(p, '#mpCardSave'); await w(800);
};
const yen = s => { const m = String(s || '').match(/[−-]?¥[\d,]+/); return m ? m[0] : null; };
const home = p => p.evaluate(() => { const t = e => e ? e.innerText.replace(/\s+/g, ' ').trim() : '';
  return { key: t(document.querySelector('#hMap [data-part="bank"]')), note: t(document.querySelector('#hMap [data-planfrom]')), now: t(document.querySelector('#hMap .mp-now-v')), after: t(document.querySelector('#hMap .mp-after')) }; });
const plan = async p => { await L.tab(p, 'tab-month'); await L.clickText(p, 'Month'); await w(400); const s = await p.evaluate(() => document.getElementById('bankLine').innerText.trim()); await L.tab(p, 'tab-home'); await w(400); return s; };

(async () => {
  let errsAll = [];
  /* ---------- the bank goes up in the plan: start 100,000, 50,000 of pay not placed ---------- */
  { const { b, p, errs } = await open();
    await setup(p, {});
    let h = await home(p), s = await plan(p);
    ck('before Check your bank: Home key says Bank at month end ¥150,000', /^Bank at month end ¥150,000/.test(h.key), h.key);
    ck('before Check your bank: Plan uses the same name and figure, "Bank at month end: ¥150,000"', /^Bank at month end: ¥150,000/.test(s), s);
    ck('before Check your bank: Plan names the start figure and month, "from ¥100,000 at the start of Nov"', /from ¥100,000 at the start of Nov/.test(s), s);
    ck('before Check your bank: Home note names the start figure ¥100,000', /¥100,000/.test(h.note) && /start of Nov/.test(h.note), h.note);
    ck('before Check your bank: Home note names no bank-now figure (none typed yet)', (h.note.match(/¥[\d,]+/g) || []).length === 1, h.note);
    await checkBankAndCard(p);
    h = await home(p); s = await plan(p);
    ck('after Check your bank: the top of Home shows ¥94,200 now and ¥68,200 after the card', yen(h.now) === '¥94,200' && /¥68,200/.test(h.after), h);
    ck('after Check your bank: Home note ties the two, start ¥100,000 and bank now ¥94,200', /¥100,000/.test(h.note) && /¥94,200/.test(h.note) && /bank now/.test(h.note), h.note);
    ck('after Check your bank: Home key and Plan say the same Bank at month end figure', yen(h.key) === '¥150,000' && /^Bank at month end: ¥150,000/.test(s), { key: h.key, plan: s });
    ck('after Check your bank: the planned figure is still planned from the start, not from the bank now', /from ¥100,000 at the start of Nov/.test(s), s);
    errsAll = errsAll.concat(errs); await b.close(); }

  /* ---------- the bank stays the same: every coin of pay placed ---------- */
  { const { b, p, errs } = await open();
    await setup(p, { invest: 70000 });
    await checkBankAndCard(p);
    const h = await home(p), s = await plan(p);
    ck('stays: Home key Bank at month end ¥100,000', yen(h.key) === '¥100,000', h.key);
    ck('stays: Plan says "Bank at month end: ¥100,000 planned, the same as at the start of Nov"', /^Bank at month end: ¥100,000 planned, the same as at the start of Nov\.$/.test(s), s);
    ck('stays: Home note names start ¥100,000 and bank now ¥94,200', /¥100,000/.test(h.note) && /¥94,200/.test(h.note), h.note);
    errsAll = errsAll.concat(errs); await b.close(); }

  /* ---------- spending past plan: 50,000 of Free to spend logged against 40,000 planned ---------- */
  { const { b, p, errs } = await open();
    await setup(p, { invest: 70000 });
    await p.evaluate(() => { const S = __t.S; S.receipts = [{ id: 'q10a', d: '2026-11-05', a: 30000, c: 'envelope', cn: 'Free to spend', n: '' }, { id: 'q10b', d: '2026-11-12', a: 20000, c: 'envelope', cn: 'Free to spend', n: '' }]; __t.persist(); __t.restructure(); });
    await L.tab(p, 'tab-month'); await L.tab(p, 'tab-home'); await w(500);
    await checkBankAndCard(p);
    const h = await home(p), s = await plan(p);
    ck('over: Home key Bank at month end ¥90,000', yen(h.key) === '¥90,000', h.key);
    ck('over: Plan starts with the same name and figure, then why', /^Bank at month end: ¥90,000\. ¥100,000 planned, less ¥10,000 spent over plan so far\.$/.test(s), s);
    errsAll = errsAll.concat(errs); await b.close(); }

  /* ---------- QC10 numbers blocker 3: the bank after the cards cannot cover Free to spend (money rule 3) ---------- */
  { const { b, p, errs } = await open();
    await setup(p, {});
    const chest = () => p.evaluate(() => { const t = e => e ? e.innerText.replace(/\s+/g, ' ').trim() : ''; const r = document.querySelector('#mpRooms [data-room="play"]');
      return { chest: t(r && r.closest('.hb-b, li, div')) || (r ? r.getAttribute('aria-label') : ''), aria: r ? r.getAttribute('aria-label') : '', now: t(document.querySelector('#hMap .mp-now')) }; });
    let c = await chest();
    ck('no bank typed yet: Free to spend is safe to spend (the plan covers it)', /safe to spend/.test(c.aria), c);
    if (await p.$('#mpCheck')) await click(p, '#mpCheck');
    await L.typeIn(p, '#mpBankIn', '10000'); await click(p, '#mpBankSave');
    await click(p, '#mpCardAdd'); await L.typeIn(p, '#mpCardName', 'Visa'); await L.typeIn(p, '#mpCardOwed', '15000'); await L.typeIn(p, '#mpCardDay', '25'); await click(p, '#mpCardSave'); await w(800);
    c = await chest();
    ck('bank after the card is −¥5,000: Free to spend is not called safe to spend', !/safe to spend/.test(c.aria) && /planned/.test(c.aria), c);
    ck('the bank-now card says why: less than Free to spend, not safe to spend yet', /not safe to spend yet/.test(c.now), c.now);
    await click(p, '#mpCheck'); await L.typeIn(p, '#mpBankIn', '200000'); await click(p, '#mpBankSave'); await w(600);
    c = await chest();
    ck('bank after the card covers it again (¥185,000): safe to spend comes back', /safe to spend/.test(c.aria) && !/not safe to spend yet/.test(c.now), c);
    errsAll = errsAll.concat(errs); await b.close(); }

  const errs = errsAll.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', errs.length === 0, errs.slice(0, 3));
  console.log(bad ? `qc10_bank_story: ${bad} FAIL` : 'qc10_bank_story: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); process.exit(1); });
