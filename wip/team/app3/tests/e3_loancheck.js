#!/usr/bin/env node
/* [LOAN_CHECK_PLAN, M13, M7, M36, M91, M14] "Still owed today" on a loan's sheet in Plan, phone size. Kenji's car loan on
   the kept made-up book (e3_act_book.js): 900,000 owed when added on 25 Nov 2026, 30,000 on the 27th from the main bank
   (no weekend shift), 27 Nov and 27 Dec ticked on their days. Book 4 of the plan:
   - 3 Feb: the sheet shows today's figure and today, and asks about the 27 Jan payment; he types 812,400 and says Not
     now: the book is byte for byte the same; closed and opened again, the figure and its day are there, "Not saved yet";
   - 4 Feb the bank is checked with 27 Jan unticked; 8 Feb 27 Jan is ticked (dated 5 Feb, the day after that check);
   - 9 Feb: the 3 Feb draft is refused with words built from the data, and the draft is kept; dated 5 Feb it is taken,
     owed counted once (812,400); Undo on the bar; dated today with the same figure, owed once; Settings > Recent
     changes names it with its own Undo;
   - Forget it drops a draft, the book untouched. Made-up yen. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const fs = require('fs'), path = require('path');
const { actBook, LOAN } = require('./e3_act_book.js');
const E = path.join(__dirname, '../../engine/');
const CK = require(E + 'checkin.js'), I = require(E + 'ids.js');
const AT = '2026-11-25T21:00:00.000+09:00';
function kenjiBook() {
  const b = actBook(), bank = b.home.main.v.acct, rec = x => Object.assign({ told: AT, at: AT, by: 'k7m2qa' }, x);
  Object.assign(b.accounts.find(a => a.id === LOAN), { payDay: 27, shift: 'none', payFrom: bank, amount: 30000 });
  b.events.push(rec({ id: 'k7m2qa-f3n8p1x6wd-96', k: 'open', acct: LOAN, date: '2026-11-25', a: 900000, grp: 'k7m2qa-f3n8p1x6wd-95' }),
    rec({ id: 'k7m2qa-f3n8p1x6wd-97', k: 'check', acct: LOAN, date: '2026-11-25', a: 900000, grp: 'k7m2qa-f3n8p1x6wd-95' }));
  const newId = I.idMaker('k7m2qa');
  let out = b;
  for (const due of ['2026-11-27', '2026-12-27']) {
    const occ = LOAN + '@' + due, r = CK.checkIn(out, { day: due, told: due + 'T21:00:00.000+09:00', newId, figures: {}, ticked: [occ], expected: { [occ]: 30000 }, lands: { [occ]: due }, unticked: [], by: 'k7m2qa' });
    for (const e of r.events.concat(r.checkins)) e.at = e.told;
    out = CK.apply(out, r);
  }
  return out;
}
const saved = p => p.evaluate(async () => { const s = await BurrowStore.open(); try { const r = await s.load(); return r.copy; } finally { s.close(); } });
(async () => {
  const prof = fs.mkdtempSync(require('os').tmpdir() + '/a3loanck-');
  const { b, p, errs } = await T.open({ profile: prof });
  try {
    const bk0 = kenjiBook(), bank = bk0.home.main.v.acct;
    const day = async d => { await p.goto(T.URL0 + '?today=' + d); await T.w(600); };
    await day('2027-02-03');
    await p.evaluate(async bk => { const s = await BurrowStore.open(); await s.load(); const r = await s.save(bk, { full: true }); s.close(); return r.ok; }, bk0);
    await p.reload(); await T.w(600);
    const plan = async () => { await p.tap('[data-tab="plan"]'); await T.w(300); while (await p.$('#plBack')) { await p.click('#plBack'); await T.w(200); } };
    const sheet = async () => { await plan(); await p.evaluate(id => document.querySelector(`#a3Plan [data-owed="${id}"]`).click(), LOAN); await T.w(500); };
    const val = sel => p.$eval(sel, e => e.value).catch(() => null);
    const text = sel => p.$eval(sel, e => (e.hidden ? '' : e.textContent.replace(/\s+/g, ' ').trim())).catch(() => '');
    const owed = () => p.evaluate(id => BurrowApp3.E3.view(BurrowApp3.E3.today()).owed[id].owedNow, LOAN);
    const fill = async (sel, v) => { await p.$eval(sel, e => { e.value = ''; }); await p.type(sel, v); };
    const setDay = (d) => p.$eval('#plLcDay', (e, v) => { e.value = v; e.dispatchEvent(new Event('change', { bubbles: true })); }, d);
    const undo = () => p.evaluate(() => { const x = [...document.querySelectorAll('#a3Msg button')].find(y => /Undo/.test(y.textContent)); if (x) x.click(); return !!x; });
    const qs = () => p.$$eval('#plLcQs [data-lcq]', l => l.map(x => x.textContent.replace(/\s+/g, ' ').trim()));
    const loanChecks = bk => bk.events.filter(e => e.k === 'check' && e.acct === LOAN && !e.gone && e.date > '2026-11-25');

    /* 3 Feb: the sheet, then Not now */
    await sheet();
    ck('the loan\'s sheet has Still owed today with today\'s figure (840,000) and today\'s day', (await val('#plLcAmt') || '').replace(/\D/g, '') === '840000' && await val('#plLcDay') === '2027-02-03', await val('#plLcAmt'));
    const q0 = await qs();
    ck('it asks about the 27 Jan payment, Yes or No', q0.length === 1 && /Has the 27 Jan payment of ¥30,000 left your bank\?/.test(q0[0]) && /Yes, it left/.test(q0[0]) && /No, not yet/.test(q0[0]), JSON.stringify(q0));
    ck('no Not saved yet and no Forget it before anything is kept', !(await text('#plLcDraft')) && await p.$eval('#plLcForget', e => e.hidden));
    const before = JSON.stringify(await saved(p));
    await fill('#plLcAmt', '812400'); await p.click('#plLcLater'); await T.w(500);
    const notice = await text('#a3Msg');
    ck('Not now says nothing is saved and how to finish', /Nothing saved yet\. ¥812,400 is kept here on this device: when you know whether the 27 Jan payment had left your bank, open Car loan again and answer Yes or No/.test(notice), notice);
    ck('Not now: the book is byte for byte the same', JSON.stringify(await saved(p)) === before);
    await sheet();
    ck('opened again: the figure and its day are there, marked Not saved yet, with Forget it', (await val('#plLcAmt') || '').replace(/\D/g, '') === '812400' && await val('#plLcDay') === '2027-02-03' && /Not saved yet/.test(await text('#plLcDraft')) && !(await p.$eval('#plLcForget', e => e.hidden)));
    await p.reload(); await T.w(600); await sheet();
    ck('after a reload too', (await val('#plLcAmt') || '').replace(/\D/g, '') === '812400' && /Not saved yet/.test(await text('#plLcDraft')));
    ck('still byte for byte the same book', JSON.stringify(await saved(p)) === before);

    /* 4 Feb the bank checked with 27 Jan unticked; 8 Feb 27 Jan ticked, dated 5 Feb */
    await day('2027-02-04');
    ck('4 Feb: the bank checked', await p.evaluate(async bnk => { const { E3, ACT3 } = BurrowApp3; return (await ACT3.addRecords('Check your bank', BurrowEngine.checkin.checkIn(E3.book, { day: E3.today(), told: E3.told(), newId: E3.newId, figures: { [bnk]: 500000 }, ticked: [], unticked: [], expected: {} }))).ok; }, bank));
    await day('2027-02-08');
    ck('8 Feb: 27 Jan ticked', await p.evaluate(async id => { const { E3, ACT3 } = BurrowApp3; const occ = id + '@2027-01-27'; return (await ACT3.addRecords('Check your bank', BurrowEngine.checkin.checkIn(E3.book, { day: E3.today(), told: E3.told(), newId: E3.newId, figures: {}, ticked: [occ], expected: { [occ]: 30000 }, lands: { [occ]: '2027-01-27' }, unticked: [] }))).ok; }, LOAN));
    let bk = await saved(p);
    ck('the tick is dated 5 Feb, the day after the bank\'s check', (bk.events.find(e => e.id === 'set:' + LOAN + '@2027-01-27') || {}).date === '2027-02-05');

    /* 9 Feb: the 3 Feb draft is refused, kept; dated 5 Feb it is taken */
    await day('2027-02-09'); await sheet();
    ck('9 Feb: the draft is there, dated 3 Feb, and nothing is asked (27 Jan is ticked)', (await val('#plLcAmt') || '').replace(/\D/g, '') === '812400' && await val('#plLcDay') === '2027-02-03' && !(await qs()).length);
    const b9 = JSON.stringify(await saved(p));
    await p.click('#plLcSave'); await T.w(500);
    const e9 = await text('#plLcErr');
    ck('saving the 3 Feb draft is refused with the words built from the data', e9 === 'The 27 Jan payment is recorded as leaving on 5 Feb. Type what the lender shows today, or date this 5 Feb or later', e9);
    ck('nothing written, and the draft is kept', JSON.stringify(await saved(p)) === b9 && /Not saved yet/.test(await text('#plLcDraft')) && (await val('#plLcAmt') || '').replace(/\D/g, '') === '812400');
    await setDay('2027-02-05'); await T.w(200); await p.click('#plLcSave'); await T.w(600);
    bk = await saved(p);
    ck('dated 5 Feb it is saved: one loan check of 812,400 on 5 Feb', JSON.stringify(loanChecks(bk).map(e => [e.date, e.a])) === JSON.stringify([['2027-02-05', 812400]]), JSON.stringify(loanChecks(bk)));
    ck('owed counted once: 812,400', await owed() === 812400, await owed());
    ck('the sheet closed and Plan shows 812,400 owed', !(await p.$('#plLcAmt')) && /812,400/.test(await text(`#a3Plan [data-owed="${LOAN}"]`)), await text(`#a3Plan [data-owed="${LOAN}"]`));
    await sheet();
    ck('the draft is gone once saved', !(await text('#plLcDraft')) && (await val('#plLcAmt') || '').replace(/\D/g, '') === '812400' && await val('#plLcDay') === '2027-02-09');
    await plan();
    ck('Undo on the bar takes it back', await undo()); await T.w(600);
    ck('after Undo: 810,000 again (840,000 less the 27 Jan payment), the check marked gone, nothing deleted', await owed() === 810000 && !loanChecks(await saved(p)).length && (await saved(p)).events.some(e => e.k === 'check' && e.acct === LOAN && e.gone), await owed());

    /* today's date and figure */
    await sheet(); await fill('#plLcAmt', '812400'); await p.click('#plLcSave'); await T.w(600);
    ck('dated today with the lender\'s figure: owed counted once, 812,400', await owed() === 812400 && JSON.stringify(loanChecks(await saved(p)).map(e => e.date)) === '["2027-02-09"]', await owed());
    await p.reload(); await T.w(600);
    ck('after a reload it is kept', await owed() === 812400);
    await p.click('#a3SetGo'); await T.w(400);
    const rows = await p.$$eval('#a3SetChanges [data-changes] li', l => l.map(x => x.textContent.replace(/\s+/g, ' ').trim()));
    ck('Settings > Recent changes names it with its own Undo', /^Car loan: still owed ¥812,400 saved/.test(rows[0] || ''), JSON.stringify(rows));
    await p.evaluate(() => { const li = [...document.querySelectorAll('#a3SetChanges [data-changes] li')].find(l => /still owed/.test(l.textContent)); li.querySelector('[data-undoj]').click(); }); await T.w(600);
    ck('its Undo there takes it back', await owed() === 810000, await owed());
    await p.click('#a3SetClose'); await T.w(200);

    /* Forget it */
    await sheet(); await fill('#plLcAmt', '799000'); await p.click('#plLcLater'); await T.w(400);
    const bf = JSON.stringify(await saved(p));
    await sheet();
    ck('a new draft shows Not saved yet', /Not saved yet/.test(await text('#plLcDraft')));
    await p.click('#plLcForget'); await T.w(400);
    ck('Forget it: today\'s figure is back, no Not saved yet', (await val('#plLcAmt') || '').replace(/\D/g, '') === '810000' && !(await text('#plLcDraft')));
    await sheet();
    ck('and it stays forgotten, the book untouched', !(await text('#plLcDraft')) && JSON.stringify(await saved(p)) === bf);
    ck('no page errors', !errs.length, errs.join(' | '));
  } finally { await b.close(); fs.rmSync(prof, { recursive: true, force: true }); }

  T.done('e3_loancheck');
})();
