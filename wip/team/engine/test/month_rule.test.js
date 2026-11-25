'use strict';
// A person who types an amount a month is charged exactly that amount in every calendar month (coordinator's ruling,
// 25 Nov 2026, after qc-numbers: "December is charged 40,767 against the 40,000 typed"; MAKO_SAYS M36, M51).
// With no fixed pay the plan comes off by the day. The old rule was amount x 12 / the year's days a day, with the rest
// of the month's own share on its last day, so a 31 day month cost 40,767 and February 36,821 for 40,000 typed.
// The rule now: each day of a month costs floor(amount / the month's days) and the month's last day carries the rest,
// so every month adds up to the amount typed, to the yen.
// Made-up yen: no fixed pay, bank 2,000,000, everyday 40,000 a month, a budget of nothing else, set up 1 Nov 2026.
// Seen on the last day of a month, the walk's by-day parts start on the 1st of the next month: the first <that month's
// days> parts are that month. Every month from Dec 2026 to Nov 2027, and Feb 2028 (29 days), must add up to 40,000.
const { t, done, eq, ok } = require('./t.js');
const BB = require('../build_book.js'), LA = require('../lookahead.js'), IDS = require('../ids.js');
function book(free) {
  const out = BB.buildBook({ day: '2026-11-01', told: '2026-11-01T09:00:00.000+09:00', currency: 'JPY', country: 'JP',
    banks: [{ key: 'bank1', name: 'Main bank', amount: 2000000, main: true, min: null }],
    pays: [{ key: 'pay1', name: 'Work', bank: 'bank1', amount: null, every: 'none' }], cards: [], bills: [], free }, { newId: IDS.idMaker('q8w3hz') });
  return out.book || out;
}
const daysIn = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();   // m is 1 to 12
const pad = n => String(n).padStart(2, '0');
// the by-day parts of the month after the month seen from its last day
function monthParts(b, y, m) {
  const py = m === 1 ? y - 1 : y, pm = m === 1 ? 12 : m - 1, seen = `${py}-${pad(pm)}-${pad(daysIn(py, pm))}`;
  const r = LA.lookahead(b, seen), bank = Object.keys(r.accounts)[0];
  return r.accounts[bank].whyParts.filter(p => /Free to spend \(by day\)/.test(p.label)).slice(0, daysIn(y, m)).map(p => -p.amount);
}
const MONTHS = [[2026, 12], [2027, 1], [2027, 2], [2027, 3], [2027, 4], [2027, 5], [2027, 6], [2027, 7], [2027, 8], [2027, 9], [2027, 10], [2027, 11], [2028, 2]];
t('40,000 a month: every calendar month of a year, and a 29 day February, is charged exactly 40,000', () => {
  const b = book(40000);
  for (const [y, m] of MONTHS) { const parts = monthParts(b, y, m); eq([y, m, parts.length, parts.reduce((s, x) => s + x, 0)], [y, m, daysIn(y, m), 40000]); }
});
t('each day costs floor(amount / the month\'s days) and the last day carries the rest: December 1,290 a day and 1,300 on the 31st', () => {
  const parts = monthParts(book(40000), 2026, 12);
  eq([parts[0], parts[29], parts[30]], [1290, 1290, 1300]);
});
t('an amount that does not divide: 100,001 a month is 100,001 in a 30 day and in a 31 day month', () => {
  const b = book(100001);
  for (const [y, m] of [[2027, 4], [2027, 5]]) eq(monthParts(b, y, m).reduce((s, x) => s + x, 0), 100001);
});

// ----- found by qc-foundation on the plan (qc_reports/2026-11-25_monthrule/foundation_plan.md) -----
// A later month is charged the amount in force on its first day, not the amount this month began with.
const stampAt = (r, told) => Object.assign(r, { told, at: told, by: 'q8w3hz' });
const byDay = (b, seen, name) => { const r = LA.lookahead(b, seen), bank = Object.keys(r.accounts)[0]; return r.accounts[bank].whyParts.filter(p => p.label === name + ' (by day)').map(p => -p.amount); };
const sum = l => l.reduce((s, x) => s + x, 0);
t('40,000 changed to 60,000 on 16 Dec: seen 31 Dec, January is charged 60,000 and February runs at floor(60,000 / 28) = 2,142 a day', () => {
  const b = book(40000), newId = IDS.idMaker('q8w3hz');
  b.plan.shares.push(stampAt({ id: newId(), from: '2026-12-16', cur: 'JPY', per: { free: 'month' }, free: 60000, goals: {} }, '2026-12-16T20:10:00.000+09:00'));
  const parts = byDay(b, '2026-12-31', 'Free to spend');
  // 45 days: 31 of January (30 x floor(60,000 / 31) = 30 x 1,935 = 58,050, the 31st carries 1,950), then 14 of February
  eq([parts.length, sum(parts.slice(0, 31)), parts[0], parts[30], parts[31], sum(parts)], [45, 60000, 1935, 1950, 2142, 60000 + 14 * 2142]);
});
t('an amount set to change next month: 40,000 now, 10,000 from 1 Jan. Seen 31 Dec, January runs at floor(10,000 / 31) = 322 a day and its 31st carries 340', () => {
  const b = book(40000), newId = IDS.idMaker('q8w3hz');
  b.plan.shares.push(stampAt({ id: newId(), from: '2027-01-01', cur: 'JPY', per: { free: 'month' }, free: 10000, goals: {} }, '2026-12-18T08:40:00.000+09:00'));
  const r = LA.lookahead(b, '2026-12-31'), bank = Object.keys(r.accounts)[0];
  const jan = r.accounts[bank].whyParts.filter(p => p.label === 'Free to spend (by day)').slice(0, 31).map(p => -p.amount);
  eq([jan[0], jan[29], jan[30], sum(jan)], [322, 322, 340, 10000]);
});
t('a plan line too: Food 30,000 a month is charged 30,000 in January (967 a day, the 31st carries 990) and in a 28 day February', () => {
  const b = book(40000), newId = IDS.idMaker('q8w3hz');
  b.plan.budgets.push(stampAt({ id: newId(), name: 'Food', place: 'bills', cur: 'JPY', per: 'month', from: '2026-11-01', steps: [{ from: null, amount: 30000 }] }, '2026-11-01T09:05:00.000+09:00'));
  const jan = byDay(b, '2026-12-31', 'Food').slice(0, 31), feb = byDay(b, '2027-01-31', 'Food').slice(0, 28);
  eq([jan[0], jan[30], sum(jan), sum(feb)], [967, 990, 30000, 30000]);
});
t('an amount smaller than the month\'s days: 20 a month costs nothing for 30 days and 20 on the 31st', () => {
  eq(byDay(book(20), '2026-12-31', 'Free to spend'), [20]);   // 45 days from 1 Jan: January's 31st only; 14 days of February carry nothing
});
done('month_rule.test.js');
