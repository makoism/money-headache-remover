/* Finding of the v1 QC run (2026-11-19): on Home, "Check your bank" opened a box already holding the current balance ("1200").
   A person who tapped the box and typed 1150 without clearing it first got 12001150, a wrong bank figure.
   Now the box opens empty, with the current balance shown as its grey hint, so typing can only give what was typed.
   Saving the empty box keeps the old figure (and counts as checked today), the same as saving the untouched box did before.
   Every step below goes through the screen: real taps and real key presses, nothing cleared by the test. Made-up numbers.
   Run: node tests/qc/qc8_bank_field.js */
const { w } = require('/tmp/v39/real.js');
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js');
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 300)); } };
const state = p => p.evaluate(() => { const n = document.querySelector('#hMap .mp-now'), i = document.getElementById('mpBankIn');
  const c = __t.S.cfg, typed = typeof c.bankNow === 'number';
  return { bank: typed ? c.bankNow : c.bankStart, at: typed ? c.bankNowAt : c.bankAt, planned: c.bankStart, now: n ? n.innerText.replace(/\s+/g, ' ') : '', open: !!i, value: i ? i.value : null, hint: i ? i.placeholder : null }; });
const home = async p => { await L.tab(p, 'tab-month'); await L.tab(p, 'tab-home'); await w(400); };
const skipTour = async p => { for (let i = 0; i < 3; i++) { await p.evaluate(() => { const s = document.getElementById('tourSkip'); if (s && s.offsetParent) s.click(); }); await w(300); } };
const setup = async (p, cur, bank) => {
  await L.zero(p); await p.evaluate(c => { __t.S.ui.cur = c; }, cur);
  await L.base(p, { pay: 3200, bank, min: 200, defs: { 'bill:rent': 1100, 'bill:food': 400, envelope: 300, education: 50, invest: 100, give: 30 }, tT: 1200, tM: 150, eT: 5000, eS: 900, eM: 200 });
  for (let k = 0; k < 2; k++) {   /* leaving setup stamps the balance with today's date and the tour can come back a moment later: set the old date twice */
    await w(500); await skipTour(p);
    await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true }; S.ui.sampleHidden = true; S.cfg.bankAt = '2026-11-01'; delete S.cfg.bankNow; delete S.cfg.bankNowAt; __t.persist(); __t.restructure(); });
    await home(p);
  }
};
const open = async p => { await p.evaluate(() => document.getElementById('mpCheck').scrollIntoView({ block: 'center' })); await w(200); await p.tap('#mpCheck'); await w(500); };
(async () => {
  const { b, p, errs } = await L.start({ w: 390, h: 844, dpr: 1, mobile: true, keep: true });
  await setup(p, '$', 1200);
  const s0 = await state(p);
  ck('start: Home shows $1,200 in the bank, dated earlier, the question folded away', s0.bank === 1200 && /\$1,200\b/.test(s0.now) && !s0.open && s0.at === '2026-11-01', s0);

  /* 1. the finding: tap Check your bank, tap the box, type 1150 without clearing */
  await open(p); const o1 = await state(p);
  ck('1 Check your bank opens the question', o1.open, o1);
  ck('1 the box shows the current balance (1200) as what is there now', /1,?200/.test(String(o1.value) + ' ' + String(o1.hint)), o1);
  await p.tap('#mpBankIn'); await w(300); await p.keyboard.type('1150', { delay: 40 }); await w(200);
  const t1 = await state(p);
  ck('1 after tapping the box and typing 1150 the box reads 1150', t1.value === '1150', t1);
  await p.tap('#mpBankSave'); await w(700); const s1 = await state(p);
  ck('1 saved: the bank is 1,150, not 12,001,150', s1.bank === 1150, s1);
  ck('1 Home shows $1,150 in your bank now', /\$1,150\b/.test(s1.now) && !/12,001,150|1,200/.test(s1.now), s1);
  ck('1 the planned start of the month is left alone (1,200)', s1.planned === 1200, s1);
  ck('1 the question folds away and the balance is dated today', !s1.open && s1.at !== '2026-11-01' && /^\d{4}-\d\d-\d\d$/.test(s1.at || ''), s1);
  const saved1 = await p.evaluate(() => { try { return Object.keys(localStorage).map(k => localStorage.getItem(k)).some(v => /"bankNow":1150\b/.test(v || '')); } catch (e) { return 'err ' + e.message; } });
  ck('1 the saved plan holds 1150', saved1 === true, saved1);

  /* 2. no tap on the box at all: it has the cursor when it opens, so just type, then Enter */
  await open(p); await p.keyboard.type('1175', { delay: 40 }); await w(200); const t2 = await state(p);
  ck('2 typing straight after opening gives 1175 in the box', t2.value === '1175', t2);
  await p.keyboard.press('Enter'); await w(700); const s2 = await state(p);
  ck('2 Enter saves 1,175', s2.bank === 1175 && /\$1,175\b/.test(s2.now) && !s2.open, s2);

  /* 3. two taps on the box (a person who taps again to be sure), then type */
  await open(p); await p.tap('#mpBankIn'); await w(250); await p.tap('#mpBankIn'); await w(250); await p.keyboard.type('980.5', { delay: 40 }); await p.tap('#mpBankSave'); await w(700);
  const s3 = await state(p);
  ck('3 two taps then 980.5 saves $980.50', s3.bank === 980.5 && /\$980\.50/.test(s3.now), s3);

  /* 4. an untouched save keeps the old figure */
  await p.evaluate(() => { __t.S.cfg.bankNowAt = '2026-11-01'; __t.persist(); __t.restructure(); }); await home(p);
  await open(p); await p.tap('#mpBankSave'); await w(700); const s4 = await state(p);
  ck('4 Save with nothing typed keeps $980.50', s4.bank === 980.5 && /\$980\.50/.test(s4.now), s4);
  ck('4 and the question folds away, the balance counted as checked today', !s4.open && s4.at !== '2026-11-01', s4);

  /* 5. Keep the old balance still leaves everything as it was */
  await p.evaluate(() => { __t.S.cfg.bankNowAt = '2026-11-01'; __t.persist(); __t.restructure(); }); await home(p);
  await open(p); await p.tap('#mpBankIn'); await p.keyboard.type('77', { delay: 40 }); await p.tap('#mpBankNo'); await w(600); const s5 = await state(p);
  ck('5 Keep the old balance drops what was typed: still $980.50, same date', s5.bank === 980.5 && s5.at === '2026-11-01' && !s5.open, s5);

  /* 6. a minus balance (overdrawn) typed over a plus one */
  await open(p); await p.tap('#mpBankIn'); await p.keyboard.type('-45', { delay: 40 }); await p.tap('#mpBankSave'); await w(700); const s6 = await state(p);
  ck('6 typing -45 saves an overdrawn 45', s6.bank === -45, s6);
  await open(p); const o6 = await state(p);
  ck('6 the box then shows the minus balance as what is there now', /-45/.test(String(o6.value) + ' ' + String(o6.hint)), o6);
  await p.tap('#mpBankIn'); await p.keyboard.type('300', { delay: 40 }); await p.tap('#mpBankSave'); await w(700); const s6b = await state(p);
  ck('6 typing 300 over it saves 300, not -45300', s6b.bank === 300, s6b);

  /* 7. yen */
  await setup(p, '¥', 120000);
  await open(p); await p.tap('#mpBankIn'); await w(300); await p.keyboard.type('115000', { delay: 30 }); await p.tap('#mpBankSave'); await w(700); const s7 = await state(p);
  ck('7 yen: 120,000 then typing 115000 saves ¥115,000', s7.bank === 115000 && /115,000/.test(s7.now) && !/120,000115|120000115/.test(s7.now), s7);

  ck('no page errors', errs.length === 0, errs);
  await b.close();
  console.log(bad ? `FAILED (${bad})` : 'ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('FAIL crashed: ' + e.message); console.log('FAILED'); process.exit(1); });
