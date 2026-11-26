'use strict';
// A second bank or cash that will be short has its gap come off safe to spend in the period its bill falls in, as a
// move out of the paying bank by the day before that bill (coordinator 16 and 18, 26 Nov 2026;
// foundation_review/SHORTGAP_PLAN.md; MAKO_SAYS M7, M12, M23, M36, M40, M45, M47).
// Made-up yen, Mako's shape (one main bank, pay 240,000 on the 10th, two cards, Rent, Power, Phone, Internet) plus a
// second bank, Beta Bank, with 32,000 in it. Card A (54,000 owed, paid 10 Dec) is paid from Beta.
//   24 Nov  setup: Main bank 286,000, Beta Bank 32,000
//    1 Dec  Power (7,400), Rent (72,000) and Internet (5,200) of late Nov ticked: Main bank 201,400
//           Beta: 32,000 - 54,000 (Card A, 10 Dec) = -22,000 from 10 Dec: a move of 22,000 by 9 Dec
//           Main: 201,400 - 22,000 (9 Dec) = 179,400, its lowest; pay 240,000 lands 10 Dec. canSpare 179,400
//           Rent (72,000, 27 Dec is a Sunday, so 28 Dec) moved to Beta: Beta -94,000 on 28 Dec, so 72,000 more by
//           27 Dec, after the pay: Main's lowest stays 179,400. Power (7,400, 26 Dec is a Saturday, so 28 Dec) too:
//           79,400 by 27 Dec. canSpare 179,400 all three times (the engine said 107,400 and 100,000 before).
//    5 Dec  the 22,000 moved ("Done"), a move between own accounts: Main 179,400, Beta 54,000: what is left is
//           79,400 by 27 Dec, and canSpare stays 179,400 (never counted twice)
const { t, done, eq, ok } = require('./t.js');
const BB = require('../build_book.js'), LA = require('../lookahead.js'), CI = require('../checkin.js'), IDS = require('../ids.js');
const A3 = require('../../app3/src/act3.js'), PW = require('../../app3/src/plan3_write.js');

const noon = day => day + 'T12:00:00.000+09:00';
function world(ans, seed) {
  const newId = IDS.idMaker(seed);
  const out = BB.buildBook(ans, { newId });
  const w = { book: out.book || out, ids: out.ids };
  let DAY = ans.day;
  const A = A3.make({ book: () => w.book, put: async x => { w.book = x; return true; }, told: () => noon(DAY), newId, today: () => DAY,
    queue: { post: () => {} }, check: x => LA.lookahead(x, DAY) });
  w.tickAll = day => {
    const r = LA.lookahead(w.book, day), list = r.checkIn.toConfirm;
    const expected = {}, lands = {}; for (const x of list) { expected[x.item] = x.amount; lands[x.item] = x.lands; }
    w.book = CI.apply(w.book, CI.checkIn(w.book, { day, told: noon(day), newId, figures: {}, ticked: list.map(x => x.item), unticked: [], amounts: {}, expected, lands, landed: {} }));
  };
  w.step = async (day, name, ...args) => { DAY = day; const r = await A.run(name, x => PW[name](x, ...args)); if (!r.ok) throw new Error(name + ': ' + JSON.stringify(r)); };
  w.move = async (day, a, from, to) => { DAY = day; const r = await A.moveMoney({ date: day, a, from, to }); if (!r.ok) throw new Error('move: ' + JSON.stringify(r)); };
  w.sch = name => w.book.schedules.find(s => s.name === name).id;
  return w;
}
const MAKO_BILLS = [{ key: 'rent', name: 'Rent', from: 'main', amount: 72000, day: 27 }, { key: 'power', name: 'Power', from: 'main', amount: 7400, day: 26 },
  { key: 'phone', name: 'Phone', from: 'main', amount: 4800, day: 20 }, { key: 'net', name: 'Internet', from: 'main', amount: 5200, day: 27 }];
const PAY = [{ key: 'pay', name: 'Pay', bank: 'main', amount: 240000, every: 'month', day: 10, shift: 'before', startsPeriod: true }];
function ans(o) {
  return Object.assign({ day: '2026-11-24', told: noon('2026-11-24'), currency: 'JPY', country: 'JP',
    banks: [{ key: 'main', name: 'Main bank', amount: 286000, main: true, min: null }, { key: 'beta', name: 'Beta Bank', amount: 32000 }],
    pays: PAY,
    cards: [{ key: 'ca', name: 'Card A', owed: 54000, payDay: 10, closeDay: 'not sure', payFrom: 'beta', shift: 'after', inFull: true },
      { key: 'cb', name: 'Card B', owed: 23000, payDay: 11, closeDay: 'not sure', payFrom: 'main', shift: 'before', inFull: true }],
    bills: MAKO_BILLS, free: null }, o);
}
const movesOf = (r, id) => (r.accounts[id].cover ? r.accounts[id].cover.moves : null);
const orders = [e => e, e => e.reverse(), e => e.sort((x, y) => (x.id < y.id ? -1 : 1)), e => e.sort((x, y) => (x.id < y.id ? 1 : -1)),
  e => e.sort((x, y) => (String(x.date) < String(y.date) ? 1 : -1)), e => e.slice(1).concat(e.slice(0, 1)), e => e.slice(-2).concat(e.slice(0, -2)),
  e => e.filter((x, i) => i % 2).concat(e.filter((x, i) => !(i % 2))), e => e.sort((x, y) => (String(x.told) + x.id < String(y.told) + y.id ? 1 : -1))];

(async () => {
  // ---- Mako's month ----
  const w = world(ans({}), 'h4q7zt');
  const main = w.ids.main, beta = w.ids.beta;
  w.tickAll('2026-12-01');
  const r1 = LA.lookahead(w.book, '2026-12-01');
  await w.step('2026-12-01', 'changeBill', w.sch('Rent'), { acct: beta });
  const r2 = LA.lookahead(w.book, '2026-12-01');
  await w.step('2026-12-01', 'changeBill', w.sch('Power'), { acct: beta });
  const r3 = LA.lookahead(w.book, '2026-12-01');
  const book3 = JSON.parse(JSON.stringify(w.book));
  await w.move('2026-12-05', 22000, main, beta);
  const r4 = LA.lookahead(w.book, '2026-12-05');

  t('1 Dec: the main bank is 201,400 and Beta 32,000', () => { eq([r1.accounts[main].bank, r1.accounts[beta].bank], [201400, 32000]); });
  t('before any move: canSpare 179,400', () => { eq(r1.canSpare.amount, 179400); });
  t('before any move: Beta is helped from the main bank, 22,000 by 9 Dec', () => {
    eq(r1.accounts[beta].cover.from, main);
    eq(movesOf(r1, beta), [{ day: '2026-12-09', amount: 22000 }]);
  });
  t('Rent to Beta: canSpare stays 179,400 (the engine said 107,400)', () => { eq(r2.canSpare.amount, 179400); });
  t('Rent to Beta: 22,000 by 9 Dec and 72,000 by 27 Dec', () => { eq(movesOf(r2, beta), [{ day: '2026-12-09', amount: 22000 }, { day: '2026-12-27', amount: 72000 }]); });
  t('Power too: canSpare stays 179,400 (the engine said 100,000)', () => { eq(r3.canSpare.amount, 179400); });
  t('Power too: 22,000 by 9 Dec and 79,400 by 27 Dec', () => { eq(movesOf(r3, beta), [{ day: '2026-12-09', amount: 22000 }, { day: '2026-12-27', amount: 79400 }]); });
  t('the main bank names each move in its sum, and its lowest is 179,400 on 9 Dec', () => {
    const parts = r3.accounts[main].whyParts.filter(p => /^Move to Beta Bank/.test(p.label));
    eq(parts.map(p => [p.label, p.amount]), [['Move to Beta Bank by 9 Dec', -22000]]);
    eq([r3.accounts[main].lowest, r3.accounts[main].lowestDay, r3.accounts[main].headroom], [179400, '2026-12-09', 179400]);
  });
  t('Beta\'s own walk stays the engine\'s fact: lowest -101,400, first under 10 Dec', () => {
    eq([r3.accounts[beta].lowest, r3.accounts[beta].firstUnder], [-101400, '2026-12-10']);
  });
  t('a covered account sets no short, and its warning says who helps it', () => {
    eq(r3.safeToSpend.short, null);
    const wb = r3.warnings.find(x => x.code === 'below_minimum' && x.account === beta);
    ok(wb, 'the warning is still there (the engine\'s fact)');
    eq(wb.covered.from, main);
    eq(wb.covered.moves, movesOf(r3, beta));
  });
  t('5 Dec, after the 22,000 is moved: 79,400 by 27 Dec is left', () => {
    eq([r4.accounts[main].bank, r4.accounts[beta].bank], [179400, 54000]);
    eq(movesOf(r4, beta), [{ day: '2026-12-27', amount: 79400 }]);
  });
  t('5 Dec, after the move: canSpare unchanged, 179,400 (never counted twice)', () => { eq(r4.canSpare.amount, 179400); });
  t('the same in nine orders the records can arrive in', () => {
    for (const o of orders) {
      const b = Object.assign({}, w.book, { events: o(w.book.events.slice()), accounts: o(w.book.accounts.slice()), schedules: o(w.book.schedules.slice()) });
      const r = LA.lookahead(b, '2026-12-05');
      eq([r.canSpare.amount, movesOf(r, beta), r.accounts[beta].cover.from], [179400, [{ day: '2026-12-27', amount: 79400 }], main]);
      const b3 = Object.assign({}, book3, { events: o(book3.events.slice()), accounts: o(book3.accounts.slice()), schedules: o(book3.schedules.slice()) });
      const q = LA.lookahead(b3, '2026-12-01');
      eq([q.canSpare.amount, movesOf(q, beta)], [179400, [{ day: '2026-12-09', amount: 22000 }, { day: '2026-12-27', amount: 79400 }]]);
    }
  });

  // ---- no bank can cover: the main bank is short itself (20,000 with a 30,000 bill on 5 Dec, before pay) ----
  // Main: 20,000 - 30,000 = -10,000 on 5 Dec; Beta -22,000 on 10 Dec. Nothing helps: canSpare 0 - 10,000 - 22,000 = -32,000
  {
    const n = world(ans({ day: '2026-12-01', told: noon('2026-12-01'), banks: [{ key: 'main', name: 'Main bank', amount: 20000, main: true, min: null }, { key: 'beta', name: 'Beta Bank', amount: 32000 }],
      bills: [{ key: 'tax', name: 'Tax', from: 'main', amount: 30000, day: 5 }] }), 'm2v9xa');
    const r = LA.lookahead(n.book, '2026-12-01');
    t('no bank can help: no move, the gap stays on canSpare as today (-32,000), and Beta is short', () => {
      eq(r.accounts[n.ids.beta].cover, undefined);
      eq(r.canSpare.amount, -32000);
      ok(r.safeToSpend.short, 'short is set');
    });
  }
  // ---- a partial cover: the main bank has 10,000 before pay ----
  // Main: 10,000 to 9 Dec, pay 240,000 on 10 Dec. It can spare 10,000 by 9 Dec; Beta is still 12,000 short on 10 Dec.
  // canSpare: 0 (main, after the 10,000 move) - 12,000 (Beta's rest) = -12,000
  {
    const n = world(ans({ day: '2026-12-01', told: noon('2026-12-01'), banks: [{ key: 'main', name: 'Main bank', amount: 10000, main: true, min: null }, { key: 'beta', name: 'Beta Bank', amount: 32000 }], bills: [] }), 'p5c8wd');
    const r = LA.lookahead(n.book, '2026-12-01');
    t('a partial cover: 10,000 by 9 Dec from the main bank, 12,000 still short on 10 Dec', () => {
      eq(r.accounts[n.ids.beta].cover, { from: n.ids.main, moves: [{ day: '2026-12-09', amount: 10000 }], rest: { day: '2026-12-10', amount: 12000 } });
      eq(r.canSpare.amount, -12000);
      eq(r.safeToSpend.short.account, n.ids.beta);
      eq(r.safeToSpend.short.amount, 12000);
    });
  }
  // ---- two banks he spends from could help: the one with the most room; a tie goes to the lower id ----
  {
    const banks = [{ key: 'main', name: 'Main bank', amount: 201400, main: true, min: null }, { key: 'beta', name: 'Beta Bank', amount: 32000 },
      { key: 'gamma', name: 'Gamma Bank', amount: 250000 }, { key: 'delta', name: 'Delta Bank', amount: 250000 }];
    const n = world(ans({ day: '2026-12-01', told: noon('2026-12-01'), banks, bills: [] }), 'g6j3ne');
    const r = LA.lookahead(n.book, '2026-12-01');
    const lower = [n.ids.gamma, n.ids.delta].sort()[0];
    t('two banks with the same most room: the lower id helps, 22,000 by 9 Dec', () => {
      eq(r.accounts[n.ids.beta].cover, { from: lower, moves: [{ day: '2026-12-09', amount: 22000 }] });
      eq(r.canSpare.amount, 201400 + 250000 + 250000 - 22000);
    });
    const banks2 = banks.map(b => (b.key === 'delta' ? Object.assign({}, b, { amount: 260000 }) : b));
    const n2 = world(ans({ day: '2026-12-01', told: noon('2026-12-01'), banks: banks2, bills: [] }), 'g6j3ne');
    const r2 = LA.lookahead(n2.book, '2026-12-01');
    t('the bank with the most room helps', () => { eq(r2.accounts[n2.ids.beta].cover.from, n2.ids.delta); });
  }
  // ---- a gap today: Beta pays a 40,000 bill today (1 Dec) ----
  {
    const n = world(ans({ day: '2026-11-24', banks: [{ key: 'main', name: 'Main bank', amount: 201400, main: true, min: null }, { key: 'beta', name: 'Beta Bank', amount: 32000 }],
      cards: [], bills: [{ key: 'gym', name: 'Gym', from: 'beta', amount: 40000, day: 1 }] }), 't3k7ra');
    const r = LA.lookahead(n.book, '2026-12-01');
    t('a gap today: the move is dated today, 8,000 by 1 Dec, off canSpare', () => {
      eq(r.accounts[n.ids.beta].cover, { from: n.ids.main, moves: [{ day: '2026-12-01', amount: 8000 }] });
      eq(r.canSpare.amount, 201400 - 8000);
    });
    const r0 = LA.lookahead(n.book, '2026-11-30');
    t('a gap tomorrow: the move is dated today', () => { eq(r0.accounts[n.ids.beta].cover.moves, [{ day: '2026-11-30', amount: 8000 }]); });
  }
  // ---- a bill on pay day and the day after pay ----
  // Card A (54,000) is paid from Beta on 10 Dec, pay day: its move is due 9 Dec, before the pay, so it comes off this
  // period (the Mako case above). A Beta bill of 54,000 on 11 Dec: its move is due 10 Dec, the day the pay lands (the
  // pay comes first), so the main bank's lowest stays today's 201,400 and canSpare is 201,400.
  {
    const n = world(ans({ day: '2026-12-01', told: noon('2026-12-01'), banks: [{ key: 'main', name: 'Main bank', amount: 201400, main: true, min: null }, { key: 'beta', name: 'Beta Bank', amount: 32000 }],
      cards: [], bills: [{ key: 'school', name: 'School', from: 'beta', amount: 54000, day: 11 }] }), 'd8f2um');
    const r = LA.lookahead(n.book, '2026-12-01');
    t('a bill the day after pay: 22,000 by 10 Dec, after the pay, so canSpare is all of the main bank, 201,400', () => {
      eq(r.accounts[n.ids.beta].cover.moves, [{ day: '2026-12-10', amount: 22000 }]);
      eq(r.canSpare.amount, 201400);
    });
  }
  // ---- cash: a wallet short is helped the same way (a cash withdrawal) ----
  {
    const n = world(ans({ day: '2026-12-01', told: noon('2026-12-01'), banks: [{ key: 'main', name: 'Main bank', amount: 201400, main: true, min: null }, { key: 'wallet', name: 'Wallet', amount: 3000, type: 'cash' }],
      cards: [], bills: [{ key: 'lessons', name: 'Lessons', from: 'wallet', amount: 8000, day: 15 }] }), 'w9b4ce');
    const r = LA.lookahead(n.book, '2026-12-01');
    t('a wallet short: 5,000 by 14 Dec from the main bank, after the pay', () => {
      eq(r.accounts[n.ids.wallet].cover, { from: n.ids.main, moves: [{ day: '2026-12-14', amount: 5000 }] });
      eq(r.canSpare.amount, 201400);
    });
  }
  done('shortgap.test.js');
})().catch(e => { console.log('FAIL setup: ' + (e && e.stack)); process.exitCode = 1; });
