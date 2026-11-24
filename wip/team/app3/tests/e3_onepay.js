#!/usr/bin/env node
/* Two incomes that land on the 10th, entered as ONE pay (MAKO_SAYS M28: "Two incomes land on the 10th, entered as one
   number"). Setup through the page as a plain file on Fri 20 Nov 2026, the made-up Mako shape the other tests use:
   Main bank 286,000; one pay, "Pay", 240,000 on the 10th (the working day after a weekend); card A 54,000 paid on the
   10th (after a weekend), card B 23,000 paid on the 11th (the working day before), close days not sure; rent 72,000 on
   the 27th, power 7,400 on the 26th, phone 4,800 on the 20th, internet 5,200 on the 27th; no minimum.
   Hand-worked (yen):
   - 20 Nov: the period is 10 Nov to 9 Dec, the next pay 10 Dec (a Thursday). Phone left today. Before the pay: power,
     rent, internet = 84,600. The cards leave on the pay day or after it, so the pay covers them.
     Safe to spend 286,000 - 84,600 = 201,400.
   - 9 Dec: nothing logged, the same: 201,400, the next pay tomorrow, the period still 10 Nov to 9 Dec.
   - 10 Dec, Check your bank with everything ticked as listed (the November bills, the one pay, card A):
     the bank is 286,000 - 84,600 + 240,000 - 54,000 = 387,400, typed. The next pay is due 10 Jan 2027, a Sunday, and
     Mon 11 Jan is Coming of Age Day (a holiday in Japan), so it lands Tue 12 Jan. Before it: card B 23,000 (11 Dec) and
     December's bills 4,800 + 7,400 + 72,000 + 5,200 = 89,400 = 112,400. Card A's January payment leaves with the pay on
     12 Jan; card B owes nothing more after 11 Dec. Safe to spend 387,400 - 112,400 = 275,000.
     The period is 10 Dec 2026 to 11 Jan 2027.
   - The same figures as the made-up try book, which has the two incomes (180,000 and 60,000) on the same day: entering
     them as one number changes nothing on Home. */
'use strict';
const { finishSetup } = require('./setup_sections.js');   // setup is saved one section at a time (M16, item 14)
const T = require('./lib3.js'), { ck } = T;
const fs = require('fs'), os = require('os');
const typeIn = async (p, sel, v) => { await p.click(sel, { clickCount: 3 }); await p.keyboard.press('Backspace'); await p.type(sel, String(v)); };
const home = async p => { const f = await T.figs(p); return { one: k => f.filter(x => x.fig === k), period: await p.$eval('[data-fig=period]', e => e.textContent).catch(() => null) }; };
(async () => {
  const prof = fs.mkdtempSync(os.tmpdir() + '/a3onepay-');
  let o = await T.open({ profile: prof }), p = o.p;
  await p.goto(T.URL0 + '?today=2026-11-20'); await T.w(400);
  await p.click('#a3SetupGo'); await T.w(300);
  await typeIn(p, '#s3Bank', '286000');
  await p.select('#s3PayDay', '10'); await p.select('#s3PayShift', 'after');
  await typeIn(p, '#s3PayAmt', '240000'); await typeIn(p, '#s3PayName', 'Pay');
  for (const [n, name, owed, day, shift] of [[1, 'Card A', 54000, '10', 'after'], [2, 'Card B', 23000, '11', 'before']]) {
    await p.click('#s3AddCard'); await T.w(100);
    const r = `[data-row=card${n}] `;
    await typeIn(p, r + '[data-f=name]', name); await typeIn(p, r + '[data-f=owed]', owed);
    await p.select(r + '[data-f=payDay]', day); await p.select(r + '[data-f=shift]', shift);
  }
  let n = 0;
  for (const [name, amt, day] of [['Rent', 72000, '27'], ['Power', 7400, '26'], ['Phone', 4800, '20'], ['Internet', 5200, '27']]) {
    n++; await p.click('#s3AddBill'); await T.w(100);
    const r = `[data-row=bill${n}] `;
    await typeIn(p, r + '[data-f=name]', name); await typeIn(p, r + '[data-f=amount]', amt); await p.select(r + '[data-f=day]', day);
  }
  ck('only one pay row in setup', (await p.$$('[data-row^=pay]')).length <= 1);
  /* each section's own Save, in order, then See my money: the way a person does it now. The figures are unchanged */
  const secErr = await finishSetup(p); await T.w(700);
  ck('every section saved on its own, then See my money', secErr === '', secErr);
  ck('saved', await p.$eval('#a3Setup', e => e.hidden), await p.$eval('#a3SetupErr', e => e.textContent).catch(() => ''));

  /* the same figures as the try book (two incomes on the 10th) on that day, from the engine */
  const tb = T.book(), same = iso => T.L.lookahead(tb, iso);
  const at = async (day, want) => {
    const h = await home(p), safe = h.one('safe')[0], np = h.one('nextpay')[0];
    ck(`${day}: safe to spend ${want.safe}, hand-worked`, safe && safe.amt === want.safe, JSON.stringify(safe));
    if (want.sameAsTry) ck(`${day}: the same as the try book with two incomes`, safe && safe.amt === same(want.sameAsTry).safeToSpend.headline, same(want.sameAsTry).safeToSpend.headline);
    ck(`${day}: the period is ${want.period}`, h.period === want.period, h.period);
    ck(`${day}: the next pay is ${want.next}`, np && np.text.includes(want.next) && np.text.includes('Next pay') && !/late|not been seen/.test(np.text), np && np.text);
    return h;
  };
  await at('20 Nov', { safe: 201400, period: '10 Nov to 9 Dec', next: '10 Dec', sameAsTry: '2026-11-20' });
  const why = (await home(p)).one('why')[0];
  ck('20 Nov: the sum behind it is the bank less power, rent and internet', why && /286,000/.test(why.text) && /7,400/.test(why.text) && /72,000/.test(why.text) && /5,200/.test(why.text) && /201,400/.test(why.text), why && why.text);

  await p.goto(T.URL0 + '?today=2026-12-09'); await T.w(500);
  await at('9 Dec', { safe: 201400, period: '10 Nov to 9 Dec', next: '10 Dec', sameAsTry: '2026-12-09' });

  /* 10 Dec: Check your bank with everything ticked as listed */
  await p.goto(T.URL0 + '?today=2026-12-10'); await T.w(500);
  await p.click('#a3CheckGo'); await T.w(300);
  const rows = await p.$$eval('.a3-tick', rs => rs.map(r => ({ text: r.textContent.replace(/\s+/g, ' '), on: !!(r.querySelector('input[type=checkbox]') || {}).checked, amt: (r.querySelector('[data-amt]') || {}).value })));
  const pays = rows.filter(r => /^Pay\b|^Pay\d/.test(r.text.trim()));
  ck('10 Dec: Check your bank lists the one pay once, at 240,000, ticked', pays.length === 1 && pays[0].on && String(pays[0].amt).replace(/,/g, '') === '240000', JSON.stringify(rows));
  ck('10 Dec: everything listed is ticked', rows.length > 0 && rows.every(r => r.on), JSON.stringify(rows));
  await p.tap('[data-bankfig]'); await p.keyboard.type('387,400');
  await p.click('#a3CheckSave'); await T.w(500);
  ck('10 Dec: the sheet closed', await p.$eval('#a3Check', e => e.hidden));
  const h = await at('10 Dec after Check your bank', { safe: 275000, period: '10 Dec 2026 to 11 Jan 2027', next: '12 Jan 2027' });
  ck('10 Dec: Home shows the bank typed', h.one('bank')[0] && h.one('bank')[0].amt === 387400, JSON.stringify(h.one('bank')));
  const due = h.one('duetotal')[0];
  ck('10 Dec: due before next pay is card B and December\'s bills, 112,400', due && due.amt === 112400, JSON.stringify(due));
  await p.reload(); await T.w(500);
  await at('10 Dec after a reload', { safe: 275000, period: '10 Dec 2026 to 11 Jan 2027', next: '12 Jan 2027' });
  ck('no page errors', o.errs.length === 0, o.errs.join(' | '));
  await o.b.close();
  T.done('e3_onepay');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
