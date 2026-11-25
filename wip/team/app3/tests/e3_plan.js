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
/* the book through the store (store/idb.js, IndexedDB burrow3), as the page keeps it since slice 1's merge */
const seed = (p, bk) => p.evaluate(async bk0 => { const s = await BurrowStore.open(); await s.load(); const r = await s.save(bk0, { full: true }); s.close(); return r.ok; }, bk);
const saved = p => p.evaluate(async () => { const s = await BurrowStore.open(); try { const r = await s.load(); return r.copy; } finally { s.close(); } });
const amt = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); const a = e && (e.dataset.amt !== undefined ? e : e.querySelector('[data-amt]')); return a ? Number(a.dataset.amt) : null; }, sel);
async function fill(p, vals) {
  for (const [k, v] of Object.entries(vals)) {
    await p.$eval('#pl-' + k, (e, v) => { if (e.tagName === 'SELECT') { e.value = v; e.dispatchEvent(new Event('change', { bubbles: true })); } else { e.focus(); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.blur(); } }, String(v));
  }
}
const save = async (p, i) => { await p.click(`[data-plbtn="${i || 0}"]`); await T.w(400); if (await p.$('[data-sureyes]')) { await p.$eval('[data-sureyes]', e => e.click()); await T.w(400); } };   // a remove asks first (tests/e3_removes.js walks the question)
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
  ck('the form closed and the line shows the engine\'s left and amount', !(await formOpen(p)) && await amt(p, `[data-line="${food.id}"] [data-fig=line-left]`) === r.period.lines[0].left && await amt(p, `[data-line="${food.id}"] [data-fig=line-amount]`) === r.period.lines[0].counts && r.period.lines[0].counts === 26666);   // [QC F5] the part that counts now, 20 of 30 days
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
  ck('Free to spend shows the engine\'s left and amount', await amt(p, '[data-fig=free-left]') === r.period.free.left && await amt(p, '[data-fig=free-amount]') === r.period.free.counts && r.period.free.counts === 40000, JSON.stringify(r.period.free));   // [QC F5] 20 of 30 days of 60,000

  /* this pay period only */
  await p.click(`[data-line="${food.id}"]`); await T.w(200);
  await fill(p, { amount: '50000', when: 'once' }); await save(p);
  bk = await saved(p); r = view(bk);
  ck('Food for this pay period only: a once key named by the pay, the period shows 50,000', Object.keys(bk.plan.budgets[0].once || {}).join() === r.period.startsWith && await amt(p, `[data-line="${food.id}"] [data-fig=line-amount]`) === r.period.lines[0].counts);

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

  /* Internet changed for the next one only */
  const NET = 'k7m2qa-f3n8p1x6wd-9';
  await p.click(`[data-bill="${NET}"]`); await T.w(200);
  await fill(p, { amount: '6000' }); await p.click('[data-plbtn="1"]'); await T.w(400);
  bk = await saved(p);
  const net = bk.schedules.find(x => x.id === NET);
  ck('Internet changed once: an amounts key on 27 Nov, the usual amount kept', net.amounts && net.amounts['2026-11-27'].amount === 6000 && net.steps.length === 1 && await amt(p, `[data-bill="${NET}"]`) === 6000, JSON.stringify(net.amounts));
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
  await p.click(`[data-goal="${trip.id}"]`); await T.w(200);
  await fill(p, { amount: '5000' }); await p.click('[data-plbtn="2"]'); await T.w(400);
  ck('taking 5,000 back out leaves the engine\'s 15,000', await amt(p, `[data-goal="${trip.id}"] [data-fig=goal-kept]`) === 15000 && view(await saved(p)).places[trip.id].kept === 15000);
  await p.click(`[data-goal="${trip.id}"]`); await T.w(200);
  await fill(p, { amount: '20000' }); await p.click('[data-plbtn="2"]'); await T.w(300);
  ck('taking out more than it holds is refused in plain words', /holds less/.test(await err(p)), await err(p));
  await p.click('#plBack'); await T.w(200);
  await p.click(`[data-goal="${trip.id}"]`); await T.w(200);
  await fill(p, { amount: '5000' }); await save(p);
  /* [BM2] past a goal's target: asked first, nothing written until "Set aside anyway" */
  await p.click('#plAddGoal'); await T.w(200);
  await fill(p, { name: 'Gift', target: '10000' }); await save(p);
  bk = await saved(p);
  const gift = bk.places.find(g => g.name === 'Gift'), nEv = bk.events.length;
  await p.click(`[data-goal="${gift.id}"]`); await T.w(200);
  await fill(p, { amount: '12000' }); await save(p);
  ck('setting aside past the target asks first, and writes nothing', await err(p) === 'That is more than Gift needs (¥10,000). Set aside ¥12,000 anyway?' && (await saved(p)).events.length === nEv && await formOpen(p), await err(p));
  ck('the question offers "Set aside anyway"', await p.$eval('#plAnyway', e => e.textContent).catch(() => null) === 'Set aside anyway');
  await p.click('#plAnyway'); await T.w(400);
  ck('"Set aside anyway" writes it: Gift holds the engine\'s 12,000', !(await formOpen(p)) && view(await saved(p)).places[gift.id].kept === 12000 && await amt(p, `[data-goal="${gift.id}"] [data-fig=goal-kept]`) === 12000);
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
  /* a card after setup (QC F1): Cards and loans offers "Add a card" beside "Add a loan" */
  ck('Cards and loans offers Add a card', /Add a card/.test(await p.$eval('[data-card=plan-owed]', e => e.textContent)));
  await p.click('#plAddCard'); await T.w(200);
  const asks = await p.$$eval('[data-card=plan-form] label', ls => ls.map(l => l.textContent));
  ck('it asks the name, what is on it now, the payment day, the close day or not sure, the paying account [E1b] and the weekend rule', JSON.stringify(asks) === JSON.stringify(['Name', 'What is on it now', 'Day of the month it is paid from your bank', 'Day its statement closes', 'Paid from', 'When that day is a weekend or holiday, it comes out']), JSON.stringify(asks));
  await fill(p, { name: 'Card C', owed: '12000', payDay: '27' }); await save(p);
  bk = await saved(p); r = view(bk);
  const cardC = bk.accounts.find(a => a.name === 'Card C');
  ck('Card C is saved through act3: a card paid in full from the main bank, close day not sure, moved after a weekend', !!cardC && cardC.type === 'card' && cardC.payFrom === BANK && cardC.cutDay === null && cardC.shift === 'after' && cardC.payDay === 27 && !!cardC.grp, JSON.stringify(cardC));
  ck('its owed and next payment are the engine\'s: all 12,000 on 27 Nov', r.cards[cardC.id].owedNow === 12000 && r.cards[cardC.id].next.amount === 12000 && /27 Nov/.test(await p.$eval(`#a3Plan [data-owed="${cardC.id}"]`, e => e.textContent)), await p.$eval(`#a3Plan [data-owed="${cardC.id}"]`, e => e.textContent));
  await p.click('#a3Msg .burrow-msg button'); await T.w(400);
  ck('Undo from the bar takes Card C away', !(await saved(p)).accounts.some(a => a.name === 'Card C' && !a.gone) && !(await p.$(`#a3Plan [data-owed="${cardC.id}"]`)));
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
  ck('no sideways scroll at 320', await p.evaluate(() => Math.max(document.documentElement.scrollWidth, document.getElementById('a3').scrollWidth) <= 320), await p.evaluate(() => Math.max(document.documentElement.scrollWidth, document.getElementById('a3').scrollWidth)));
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
  /* a loan that still owes does not close */
  await p.click(`#a3Plan [data-owed="${loanId}"]`); await T.w(200);
  await save(p, 1);
  ck('closing a loan that still owes is refused', /still owes/.test(await err(p)), await err(p));
  await p.click('#plBack'); await T.w(200);
  /* the main pay changed from a date: a new step; this pay period keeps its start */
  const MAIN = 'k7m2qa-f3n8p1x6wd-4';
  await p.click(`[data-pay="${MAIN}"]`); await T.w(200);
  const from = await p.$eval('#pl-from', e => e.value);
  await fill(p, { amount: '190000' }); await save(p);
  bk = await saved(p);
  const mj = bk.schedules.find(x => x.id === MAIN);
  ck('Main job changes from ' + from + ' (after the 10 Dec pay): a new step, the old kept; the next pay shows 190,000', from === '2026-12-11' && JSON.stringify(mj.steps.map(x => [x.from, x.amount])) === JSON.stringify([[null, 180000], [from, 190000]]) && await amt(p, `[data-pay="${MAIN}"]`) === 190000, JSON.stringify(mj.steps));
  ck('this pay period still starts 10 Dec', await p.$eval('[data-fig=plan-period]', e => e.dataset.start) === '2026-12-10');
  await p.click('[data-past="2026-11-10"] summary'); await T.w(200);
  await T.shot(p, 'plan_after_pay_' + DAY);
  /* [S5] one rule on Plan and Home: the made-up book is set up on 20 Nov and its figure is read at the end of that day,
     so the Phone bill due 20 Nov is inside it. Plan's next Phone is the December one (Sun 20 Dec moves to Mon 21 Dec), and Home does not take 20 Nov off. */
  await p.goto(T.URL0 + '?try=mako&today=2026-11-20'); await T.w(300);
  const homeDue = await p.$eval('[data-card=due]', e => e.textContent);
  await p.tap('[data-tab="plan"]'); await T.w(300);
  const phone = await p.$$eval('[data-bill]', bs => (bs.map(x => x.textContent).find(t => /Phone/.test(t)) || ''));
  ck('20 Nov: Plan\'s next Phone is 21 Dec, never the 20 Nov one inside the setup figure', /next 21 Dec/.test(phone) && !/20 Nov/.test(phone), phone);
  ck('20 Nov: Home does not take the 20 Nov Phone off either', !/Phone/.test(homeDue), homeDue);
  ck('no page errors', errs.length === 0, errs.join(' | '));
  await b.close(); T.done('e3_plan');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
