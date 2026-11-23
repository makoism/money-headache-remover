#!/usr/bin/env node
/* The Plan tab on the made-up Mako book kept on this device (pay on the 10th, period 10 Nov to 9 Dec), on Wed 25 Nov
   2026, then on Thu 10 Dec 2026 after both pays are ticked: every figure is the engine's for the saved book; a line,
   Free to spend, a bill, a goal (in the bank and in its own account), a loan and a card's days are added or changed
   through the forms, each one saved record with told, at, by; a change for this pay period only; a bill changed from a
   date; Undo from the bar; the pay period gone by shows what was spent. No page errors; no sideways scroll at 320.
   Every amount is made up. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const PE = require('../../engine/periods.js'), I = require('../../engine/ids.js');
const BANK = 'k7m2qa-f3n8p1x6wd-1', CARD_A = 'k7m2qa-f3n8p1x6wd-2', RENT = 'k7m2qa-f3n8p1x6wd-6';
let DAY = '2026-11-25';
const seed = (p, bk) => p.evaluate(bk => new Promise(res => { const rq = indexedDB.open('burrow3', 1); rq.onupgradeneeded = () => rq.result.createObjectStore('slice1'); rq.onsuccess = () => { const db = rq.result, tx = db.transaction('slice1', 'readwrite'); tx.objectStore('slice1').put({ v: 1, book: bk, t: 1 }, 'book'); tx.oncomplete = () => { db.close(); res(); }; }; }), bk);
const saved = p => p.evaluate(() => new Promise(res => { const rq = indexedDB.open('burrow3', 1); rq.onsuccess = () => { const db = rq.result, g = db.transaction('slice1').objectStore('slice1').get('book'); g.onsuccess = () => { db.close(); res(g.result && g.result.book); }; }; }));
const amt = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); const a = e && (e.dataset.amt !== undefined ? e : e.querySelector('[data-amt]')); return a ? Number(a.dataset.amt) : null; }, sel);
async function fill(p, vals) {
  for (const [k, v] of Object.entries(vals)) {
    await p.$eval('#pl-' + k, (e, v) => { if (e.tagName === 'SELECT') { e.value = v; e.dispatchEvent(new Event('change', { bubbles: true })); } else { e.focus(); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.blur(); } }, String(v));
  }
}
const save = async (p, i) => { await p.click(`[data-plbtn="${i || 0}"]`); await T.w(400); };
const err = p => p.$eval('#plErr', e => e.textContent).catch(() => null);
const formOpen = p => p.$('[data-card=plan-form]').then(Boolean);
const view = bk => T.L.lookahead(bk, DAY);

(async () => {
  const prof = require('fs').mkdtempSync(require('os').tmpdir() + '/a3plan-');
  const { b, p, errs } = await T.open({ profile: prof });
  await p.goto(T.URL0 + '?today=' + DAY); await T.w(300);
  await seed(p, T.book()); await p.reload(); await T.w(400);
  await p.tap('[data-tab="plan"]'); await T.w(300);
  ck('the Plan tab shows its panel and hides Home', await p.$eval('#a3Plan', e => !e.hidden) && await p.$eval('#a3Home', e => e.hidden));
  let bk = await saved(p), r = view(bk), v = PE.scheduleView(bk, DAY);
  const per = await p.$eval('[data-fig=plan-period]', e => [e.dataset.start, e.dataset.end, e.textContent]);
  ck('this pay period by the engine\'s dates: 10 Nov to 9 Dec', per[0] === r.period.start && per[1] === r.period.end && per[2] === '10 Nov to 9 Dec', JSON.stringify(per));
  const bills = await p.$$eval('[data-bill]', bs => bs.map(x => [x.dataset.bill, Number(x.querySelector('[data-amt]').dataset.amt), x.textContent]));
  ck('four bills, each with the engine\'s amount', bills.length === 4 && bills.every(([id, a]) => a === v[id].amount), JSON.stringify(bills));
  ck('Rent says its day and its next date (27 Nov)', /day 27 each month, next 27 Nov/.test((bills.find(x => x[0] === RENT) || [])[2]), JSON.stringify(bills));
  ck('both pays listed with their day', (await p.$$('[data-pay]')).length === 2);
  const cardTxt = await p.$eval(`#a3Plan [data-owed="${CARD_A}"]`, e => e.textContent);
  ck('Card A: its payment day, paid from the bank, close day not sure, owed the engine\'s', /paid on day 10 from Main bank, close day not sure/.test(cardTxt) && await amt(p, `#a3Plan [data-owed="${CARD_A}"] [data-fig=owed-now]`) === r.cards[CARD_A].owedNow, cardTxt);
  ck('no pay period gone by yet', /None yet/.test(await p.$eval('[data-card=plan-past]', e => e.textContent)));
  await T.shot(p, 'plan_start_' + DAY);

  /* a budget line */
  await p.click('#plAddLine'); await T.w(200);
  await fill(p, { name: 'Food', amount: '40000' }); await save(p);
  bk = await saved(p); r = view(bk);
  const food = bk.plan.budgets[0];
  ck('Food saved as one line with an ordinary id, told, at and by', !!food && I.isOrdinary(food.id) && food.name === 'Food' && food.told && food.at && food.by && food.steps[0].amount === 40000, JSON.stringify(food));
  ck('the form closed and the line shows the engine\'s left and amount', !(await formOpen(p)) && await amt(p, `[data-line="${food.id}"] [data-fig=line-left]`) === r.period.lines[0].left && await amt(p, `[data-line="${food.id}"] [data-fig=line-amount]`) === 40000);
  const undoBar = await p.$eval('#a3Msg .burrow-msg', e => e.textContent).catch(() => '');
  ck('the Undo bar says what happened', /Line added/.test(undoBar) && /Undo/.test(undoBar), undoBar);
  /* a refused one, in plain words, nothing saved */
  await p.click('#plAddLine'); await T.w(200);
  await fill(p, { name: 'food', amount: '5' }); await save(p);
  ck('a second Food is refused in plain words', /already one called food/.test(await err(p)), await err(p));
  ck('and nothing was saved', (await saved(p)).plan.budgets.length === 1);
  await p.click('#plBack'); await T.w(200);

  /* Free to spend */
  await p.click('#plSetFree'); await T.w(200);
  await fill(p, { amount: '60000' }); await save(p);
  bk = await saved(p); r = view(bk);
  ck('Free to spend shows the engine\'s left and amount', await amt(p, '[data-fig=free-left]') === r.period.free.left && await amt(p, '[data-fig=free-amount]') === 60000, JSON.stringify(r.period.free));

  /* this pay period only */
  await p.click(`[data-line="${food.id}"]`); await T.w(200);
  await fill(p, { amount: '50000', when: 'once' }); await save(p);
  bk = await saved(p); r = view(bk);
  ck('Food for this pay period only: a once key named by the pay, the period shows 50,000', Object.keys(bk.plan.budgets[0].once || {}).join() === r.period.startsWith && await amt(p, `[data-line="${food.id}"] [data-fig=line-amount]`) === 50000);

  /* a bill: add, then change Rent from a date */
  await p.click('#plAddBill'); await T.w(200);
  await fill(p, { name: 'Gym', amount: '8000', day: '1', acct: BANK }); await save(p);
  bk = await saved(p);
  const gym = bk.schedules.find(s => s.name === 'Gym');
  ck('Gym saved as a bill from today on day 1', !!gym && gym.kind === 'bill' && gym.from === DAY && gym.rules[0].rule.days[0] === 1 && gym.told && gym.by, JSON.stringify(gym));
  ck('Gym shows next 1 Dec', /day 1 each month, next 1 Dec/.test(await p.$eval(`[data-bill="${gym.id}"]`, e => e.textContent)));
  await p.tap('[data-tab="home"]'); await T.w(200);
  ck('Home counts Gym in what is due before next pay', /Gym/.test(await p.$eval('[data-card=due]', e => e.textContent)));
  await p.tap('[data-tab="plan"]'); await T.w(300);
  await p.click(`[data-bill="${RENT}"]`); await T.w(200);
  ck('changing Rent offers today as the first day', await p.$eval('#pl-from', e => e.value) === DAY);
  await fill(p, { amount: '75000', from: '2026-12-01' }); await save(p);
  bk = await saved(p);
  const rent = bk.schedules.find(s => s.id === RENT);
  ck('Rent changed from 1 Dec: a new step, the old one kept', JSON.stringify(rent.steps.map(x => [x.from, x.amount])) === JSON.stringify([[null, 72000], ['2026-12-01', 75000]]) && !!rent.steps[1].at, JSON.stringify(rent.steps));
  ck('the 27 Nov rent stays 72,000 (the change starts later)', await amt(p, `[data-bill="${RENT}"]`) === 72000 && PE.scheduleView(bk, DAY)[RENT].next.amount === 72000);

  /* a goal in the bank, money set aside */
  await p.click('#plAddGoal'); await T.w(200);
  await fill(p, { name: 'Trip', target: '150000', due: '2027-08-01' }); await save(p);
  bk = await saved(p);
  const trip = bk.places.find(g => g.name === 'Trip');
  ck('Trip saved, kept in the bank by default', !!trip && trip.keptIn.mode === 'inBank' && trip.keptIn.acct === BANK && trip.due === '2027-08-01');
  const room0 = view(bk).accounts[BANK].headroom;
  await p.click(`[data-goal="${trip.id}"]`); await T.w(200);
  await fill(p, { amount: '20000' }); await save(p);
  bk = await saved(p); r = view(bk);
  ck('setting 20,000 aside: the goal holds the engine\'s figure, its bar shows it, the bank\'s room to spend is lower by it',
    await amt(p, `[data-goal="${trip.id}"] [data-fig=goal-kept]`) === 20000 && r.places[trip.id].kept === 20000 && await p.$eval(`[data-goal="${trip.id}"] meter`, e => [e.value, e.max].join()) === '20000,150000' && r.accounts[BANK].headroom === room0 - 20000, JSON.stringify([await amt(p, `[data-goal="${trip.id}"] [data-fig=goal-kept]`), r.places[trip.id], await p.$eval(`[data-goal="${trip.id}"] meter`, e => [e.value, e.max].join()), r.accounts[BANK].headroom, room0, await err(p)]));
  const pace = await p.$eval(`[data-goal="${trip.id}"] [data-fig=goal-pace]`, e => [Number(e.querySelector('[data-amt]').dataset.amt), e.textContent]).catch(() => [null, '']);
  ck('Trip says what each pay needs, the engine\'s figure: about X each pay to reach it by 1 Aug 2027', r.places[trip.id].perPeriod > 0 && pace[0] === r.places[trip.id].perPeriod && /^about .+ each pay to reach it by 1 Aug 2027$/.test(pace[1]), JSON.stringify(pace) + ' ' + JSON.stringify(r.places[trip.id]));
  /* a goal in its own account */
  await p.click('#plAddGoal'); await T.w(200);
  await fill(p, { name: 'House', target: '1000000', mode: 'ownAccount' }); await save(p);
  bk = await saved(p);
  const house = bk.places.find(g => g.name === 'House');
  ck('House in an account of its own, opened with nothing', !!house && house.keptIn.mode === 'ownAccount' && bk.accounts.some(a => a.id === house.keptIn.acct && a.name === 'House account'));
  ck('its row says where it is kept', /in House account/.test(await p.$eval(`[data-goal="${house.id}"]`, e => e.textContent)));

  /* a loan, and a card's day */
  await p.click('#plAddLoan'); await T.w(200);
  await fill(p, { name: 'Car loan', owed: '900000', amount: '25000', payDay: '27' }); await save(p);
  bk = await saved(p); r = view(bk);
  const loan = bk.accounts.find(a => a.name === 'Car loan');
  ck('the loan owns its payment day; owed and next payment are the engine\'s', !!loan && loan.type === 'loan' && await amt(p, `#a3Plan [data-owed="${loan.id}"] [data-fig=owed-now]`) === r.owed[loan.id].owedNow && /Next payment ¥25,000 on 27 Nov/.test(await p.$eval(`#a3Plan [data-owed="${loan.id}"]`, e => e.textContent)));
  await p.click(`#a3Plan [data-owed="${CARD_A}"]`); await T.w(200);
  await fill(p, { cutDay: '25' }); await save(p);
  ck('Card A now closes on day 25', /closes on day 25/.test(await p.$eval(`#a3Plan [data-owed="${CARD_A}"]`, e => e.textContent)) && (await saved(p)).accounts.find(a => a.id === CARD_A).cutDay === 25);
  await p.click('#a3Msg .burrow-msg button'); await T.w(400);
  ck('Undo from the bar puts the close day back to not sure', /close day not sure/.test(await p.$eval(`#a3Plan [data-owed="${CARD_A}"]`, e => e.textContent)) && (await saved(p)).accounts.find(a => a.id === CARD_A).cutDay == null);

  /* provenance: every figure on the Plan tab carries a mark */
  const audit = await p.evaluate(() => BurrowScreens.provenance.audit(document.getElementById('a3Plan')));
  ck('every figure on the Plan tab is marked typed or worked out', audit.length === 0 && (await p.$$('#a3Plan [data-figure]')).length > 10, JSON.stringify(audit).slice(0, 300));
  await T.shot(p, 'plan_filled_' + DAY);
  await p.setViewport({ width: 320, height: 700, deviceScaleFactor: 1, isMobile: true, hasTouch: true }); await T.w(200);
  ck('no sideways scroll at 320', await p.evaluate(() => document.documentElement.scrollWidth <= 320), await p.evaluate(() => document.documentElement.scrollWidth));
  await T.shot(p, 'plan_320_' + DAY);
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });

  /* 10 Dec: both pays ticked at Check your bank; the period gone by shows what happened */
  DAY = '2026-12-10';
  await p.goto(T.URL0 + '?today=' + DAY); await T.w(400);
  await p.click('#a3CheckGo'); await T.w(200);
  const names = await p.$$eval('.a3-tick', rs => rs.map(r => [r.dataset.item, r.querySelector('label span').textContent]));
  for (const [it, nm] of names) if (!/job/.test(nm)) await p.click(`.a3-tick[data-item="${it}"] input[type=checkbox]`);
  for (const el of await p.$$('[data-bankfig]')) { const id = await el.evaluate(e => e.dataset.bankfig); await el.tap(); await p.keyboard.type(id === BANK ? '450000' : '0'); }
  await p.click('#a3CheckSave'); await T.w(400);
  ck('the check-in saved', await p.$eval('#a3Check', e => e.hidden), await p.$eval('#a3CheckErr', e => e.textContent).catch(() => ''));
  await p.tap('[data-tab="plan"]'); await T.w(300);
  bk = await saved(p);
  const pp = PE.periods(bk, DAY);
  ck('a new pay period from 10 Dec', await p.$eval('[data-fig=plan-period]', e => e.dataset.start) === '2026-12-10' && pp.current.start === '2026-12-10');
  const pastTxt = await p.$eval('[data-past="2026-11-10"]', e => e.textContent).catch(() => '');
  ck('10 Nov to 9 Dec is now gone by, with the engine\'s Food and Free to spend', pp.past.length === 1 && /10 Nov to 9 Dec/.test(pastTxt) && /Food/.test(pastTxt) && /Free to spend/.test(pastTxt), pastTxt);
  const pastFigs = await p.$$eval('[data-past="2026-11-10"] [data-amt]', es => es.map(e => [e.dataset.figure, Number(e.dataset.amt)]));
  const q = pp.past[0];
  ck('its figures are the engine\'s: Food spent and started, money in, bills paid', JSON.stringify(pastFigs.filter(f => /lines/.test(f[0])).map(f => f[1])) === JSON.stringify([q.lines[0].spent, q.lines[0].start]) && pastFigs.some(f => f[0] === 'periods.*.billsPaid.total' && f[1] === q.billsPaid.total), JSON.stringify(pastFigs) + ' ' + JSON.stringify(q.lines));
  /* the car loan's 27 Nov payment was not ticked: it is overdue and never disappears; the next one is 27 Dec */
  const loanId = bk.accounts.find(a => a.name === 'Car loan').id, lo = T.L.lookahead(bk, DAY).owed[loanId];
  const od = await p.$$eval(`#a3Plan [data-owed="${loanId}"] [data-fig=overdue]`, es => es.map(e => [Number(e.querySelector('[data-amt]').dataset.amt), e.dataset.state, e.textContent]));
  ck('Plan shows the overdue loan payment with the engine\'s amount, day and state', lo.overdue.length === 1 && od.length === 1 && od[0][0] === lo.overdue[0].amount && od[0][1] === lo.overdue[0].state && /27 Nov/.test(od[0][2]), JSON.stringify(od) + ' ' + JSON.stringify(lo.overdue));
  const nextTxt = 'Next payment ¥25,000 on ' + require('../../screens/names.js').dayLabel(lo.next.payment_date);
  ck('and its next payment is the engine\'s, today or later (' + lo.next.payment_date + ')', lo.next.payment_date >= DAY && (await p.$eval(`#a3Plan [data-owed="${loanId}"]`, e => e.textContent)).includes(nextTxt), nextTxt + ' | ' + await p.$eval(`#a3Plan [data-owed="${loanId}"]`, e => e.textContent));
  await p.tap('[data-tab="home"]'); await T.w(300);
  const hod = await p.$$eval('#a3Home [data-fig=overdue]', es => es.map(e => [e.dataset.owed, Number(e.querySelector('[data-amt]').dataset.amt), e.textContent]));
  ck('Home shows it too', hod.some(x => x[0] === loanId && x[1] === lo.overdue[0].amount && /Car loan/.test(x[2]) && /27 Nov/.test(x[2])), JSON.stringify(hod));
  await p.tap('[data-tab="plan"]'); await T.w(300);
  await p.click('[data-past="2026-11-10"] summary'); await T.w(200);
  await T.shot(p, 'plan_after_pay_' + DAY);
  ck('no page errors', errs.length === 0, errs.join(' | '));
  await b.close(); T.done('e3_plan');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
