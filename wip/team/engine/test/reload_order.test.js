// A figure must not change when the page is reopened (QC numbers, blocker 1). The page holds its events in the order they
// were written; the store hands them back sorted by id, and an id's session part is drawn at random on every open, so
// after a reload the same book comes back in another order. The look ahead must give the same answer for every order
// of the same events, and in every time zone of the machine running it.
// The book: the reviewer's repro (made-up yen), set up 24 Nov, Card A 5,000 logged, checked 28 Nov (43,000),
// 11 Dec (all ticked, 8,000) and 9 Jan (8,000), all typed in Tokyo.
'use strict';
const path = require('path');
const { spawnSync } = require('child_process');
const { t, done, eq } = require('./t.js');
const { lookahead } = require('../lookahead.js');
const BOOK = require('./fixtures/reload_order_book.json');

const cardId = BOOK.accounts.find(a => a.type === 'card').id;
const bankId = BOOK.accounts.find(a => a.type !== 'card').id;
const withOrder = f => Object.assign({}, BOOK, { events: f(BOOK.events.slice()) });
const shuffle = seed => list => { let s = seed; const r = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648); for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; } return list; };
const orders = {
  written: l => l,
  'by id, as the store gives them': l => l.sort((x, y) => (x.id < y.id ? -1 : x.id > y.id ? 1 : 0)),
  reversed: l => l.reverse(),
};
for (const seed of [1, 7, 42, 99, 1234, 31337]) orders['shuffled ' + seed] = shuffle(seed);
const figures = (book, day) => { const r = lookahead(book, day); return JSON.stringify({ cards: r.cards, accounts: r.accounts, safe: r.safeToSpend, warnings: r.warnings }); };

if (process.argv[2] === '--print') { console.log(figures(BOOK, process.argv[3])); process.exit(0); }

for (const [day, card, bank] of [['2026-11-28', 43000, 150000], ['2026-12-11', 8000, 352000], ['2027-01-09', 8000, 592000]]) {
  t(`${day}: Card A owes ${card} and the bank holds ${bank}, as typed`, () => {
    const r = lookahead(BOOK, day);
    eq(r.cards[cardId].owedNow, card);
    eq(r.accounts[bankId].bank, bank);
  });
  const want = figures(BOOK, day);
  for (const [name, f] of Object.entries(orders)) t(`${day}: the same figures with the events ${name}`, () => eq(figures(withOrder(f), day), want));
}
// the engine reads no local time: the same answer in every machine time zone
for (const day of ['2026-12-11', '2027-01-09']) {
  const want = figures(BOOK, day);
  for (const tz of ['Asia/Tokyo', 'Pacific/Kiritimati', 'America/Los_Angeles', 'UTC']) t(`${day}: the same figures with TZ=${tz}`, () => {
    const r = spawnSync(process.execPath, [__filename, '--print', day], { encoding: 'utf8', env: Object.assign({}, process.env, { TZ: tz }) });
    eq(r.stdout.trim(), want);
  });
}
done(path.basename(__filename));
