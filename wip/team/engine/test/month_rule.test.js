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
done('month_rule.test.js');
