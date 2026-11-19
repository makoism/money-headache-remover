/* PERSONAS FOR THE LEDGER (tests only, 2026-11-19). Made-up numbers only, never anyone's real figures.
   Each persona is a setup (accounts, mode) and a list of steps run by tests/next/ledger_conservation.js. A step is an event in the
   design's shape (wip/team/LEDGER_DESIGN.md) or one of:
     { do: 'undo' } { do: 'redo' } { do: 'reload' }        undo the last event, put it back, save and open the copy again
     { do: 'backup', as } { do: 'restore', from }          a copy taken now, and later opened on a new phone
     { do: 'expect', <name>: value }                       a number the screen must show at this point (money units)
   Event fields: k (kind), a (amount), acct / acct2 (account ids), place / place2 (place ids), sub (the kind shown to the person),
   date, typedA (for a check: the balance the person typed).
   Kinds: open, in, borrow, move, spend, hand, transfer, convert (a2 = what landed), repay, check, adjust. */

const MAKO = {
  name: "Mako's shape: one bank, two cards paid in full on the 10th and 11th, pay on the 10th, everything by card",
  setup: { cur: 'JPY', mode: 'track', accounts: [
    { id: 'bank', name: 'Main bank', type: 'bank' },
    { id: 'cardA', name: 'Card A', type: 'card', inFull: true, payDay: 10 },
    { id: 'cardB', name: 'Card B', type: 'card', inFull: true, payDay: 11 } ] },
  steps: [
    { k: 'open', acct: 'bank', a: 152340, date: '2026-11-01' },
    { k: 'open', acct: 'cardA', a: 61200, date: '2026-11-01' },
    { k: 'open', acct: 'cardB', a: 23450, date: '2026-11-01' },
    { do: 'expect', waiting: 67690, forCards: 84650, total: 152340, owed: 84650 },
    { k: 'move', a: 30000, place: 'waiting', place2: 'bills' },
    { k: 'move', a: 30000, place: 'waiting', place2: 'free' },
    { k: 'move', a: 7690, place: 'waiting', place2: 'emergency' },
    { k: 'spend', sub: 'spend', acct: 'cardA', a: 4380, place: 'free', date: '2026-11-03' },
    { k: 'spend', sub: 'bill', acct: 'cardB', a: 12000, place: 'bills', date: '2026-11-05' },
    { do: 'expect', total: 152340, free: 25620, billsOnly: 18000, forCards: 101030, owed: 101030, bankAfterCards: 51310 },
    { k: 'check', acct: 'cardA', typedA: 66880, date: '2026-11-08' },
    { do: 'expect', unexplainedOf: ['cardA', 1300] },
    { k: 'adjust', acct: 'cardA', a: 1300, place: 'free', date: '2026-11-08' },
    { k: 'in', sub: 'pay', acct: 'bank', a: 410000, date: '2026-11-10' },
    { k: 'repay', sub: 'card payment', acct: 'bank', acct2: 'cardA', a: 66880, date: '2026-11-10' },
    { k: 'repay', sub: 'card payment', acct: 'bank', acct2: 'cardB', a: 35450, date: '2026-11-11' },
    { do: 'expect', forCards: 0, owed: 0, bank: 460010, waiting: 410000 },
    { k: 'move', a: 120000, place: 'waiting', place2: 'bills' },
    { k: 'move', a: 80000, place: 'waiting', place2: 'free' },
    { k: 'move', a: 50000, place: 'waiting', place2: 'emergency' },
    { k: 'move', a: 30000, place: 'waiting', place2: 'trip' },
    { k: 'move', a: 40000, place: 'waiting', place2: 'invest' },
    { k: 'spend', sub: 'bill', acct: 'bank', a: 85000, place: 'bills', date: '2026-11-12' },
    { k: 'spend', sub: 'spend', acct: 'cardA', a: 25000, place: 'free', date: '2026-11-15' },
    { k: 'spend', sub: 'take out', acct: 'cardB', a: 18000, place: 'trip', date: '2026-11-16' },
    { k: 'check', acct: 'bank', typedA: 373770, date: '2026-11-18' },
    { do: 'expect', unexplainedOf: ['bank', -1240] },
    { k: 'adjust', acct: 'bank', a: -1240, place: 'bills', date: '2026-11-18' },
    { k: 'check', acct: 'bank', typedA: 373770, date: '2026-11-18' },
    { do: 'expect', unexplainedOf: ['bank', 0], bankAfterCards: 330770 },
    /* L1: spending more than Free to spend holds goes below zero (amber), never refused */
    { k: 'spend', sub: 'spend', acct: 'cardA', a: 90000, place: 'free', date: '2026-11-19' },
    { do: 'expect', freeBelowZero: true },
    { do: 'undo' }, { do: 'reload' }, { do: 'redo' }, { do: 'undo' },
  ],
};

const PH_FREELANCER = {
  name: 'Philippine freelance editor paid per project (USD via Payoneer), sends money home, GCash and two banks, Wallet mode',
  setup: { cur: 'PHP', mode: 'wallet', accounts: [
    { id: 'bdo', name: 'BDO', type: 'bank' }, { id: 'bpi', name: 'BPI', type: 'bank' },
    { id: 'gcash', name: 'GCash', type: 'ewallet' }, { id: 'payoneer', name: 'Payoneer', type: 'bank', cur: 'USD' },
    { id: 'wallet', name: 'Wallet (cash)', type: 'wallet', tracked: false }, { id: 'jun', name: 'Jun owes me', type: 'owedToYou' } ] },
  steps: [
    { k: 'open', acct: 'bdo', a: 18250.40 }, { k: 'open', acct: 'bpi', a: 3120 }, { k: 'open', acct: 'gcash', a: 845.75 },
    { k: 'open', acct: 'payoneer', a: 120 },
    { do: 'expect', total: 22216.15, foreignUSD: 120 },
    { k: 'in', sub: 'pay', acct: 'payoneer', a: 850 },
    { do: 'expect', total: 22216.15, foreignUSD: 970 },
    { k: 'convert', acct: 'payoneer', acct2: 'bdo', a: 850, a2: 47302.55 },
    { do: 'expect', total: 69518.70, foreignUSD: 120, waiting: 69518.70 },
    { k: 'move', a: 25000, place: 'waiting', place2: 'bills' },
    { k: 'move', a: 10000, place: 'waiting', place2: 'emergency' },
    { k: 'move', a: 3000, place: 'waiting', place2: 'give' },
    { k: 'hand', acct: 'bpi', acct2: 'wallet', a: 3000, place: 'waiting' },
    { do: 'expect', free: 3000, total: 66518.70 },
    { k: 'transfer', acct: 'bdo', acct2: 'gcash', a: 10000 },
    { k: 'spend', sub: 'family support', acct: 'gcash', a: 8000, place: 'bills' },
    { k: 'spend', sub: 'family support', acct: 'gcash', a: 2500, place: 'waiting' },
    { k: 'transfer', sub: 'lent', acct: 'gcash', acct2: 'jun', a: 200 },
    { do: 'expect', total: 56018.70 },
    { k: 'in', sub: 'pay', acct: 'bpi', a: 12500.75 },
    { do: 'expect', free: 0 },
    { k: 'transfer', sub: 'paid back to you', acct: 'jun', acct2: 'gcash', a: 200 },
    { k: 'check', acct: 'gcash', typedA: 344.25 },
    { do: 'expect', unexplainedOf: ['gcash', -1.50] },
    { k: 'adjust', acct: 'gcash', a: -1.50, place: 'bills' },
    { k: 'check', acct: 'bdo', typedA: 55552.95 },
    { do: 'expect', unexplainedOf: ['bdo', 0] },
    { do: 'undo' }, { do: 'undo' }, { do: 'redo' }, { do: 'redo' },
  ],
};

const PH_SALARIED = {
  name: 'Philippine salaried editor paid on the 15th and 30th, pay-later habit, borrowed from family',
  setup: { cur: 'PHP', mode: 'track', accounts: [
    { id: 'bpi', name: 'BPI', type: 'bank' }, { id: 'gcash', name: 'GCash', type: 'ewallet' },
    { id: 'spl', name: 'SPayLater', type: 'paylater' }, { id: 'gg', name: 'GGives', type: 'paylater' },
    { id: 'tita', name: 'Tita Rose', type: 'loan' } ] },
  steps: [
    { k: 'open', acct: 'bpi', a: 4210.30 }, { k: 'open', acct: 'gcash', a: 512 }, { k: 'open', acct: 'gg', a: 3600 },
    { do: 'expect', total: 4722.30, owed: 3600 },
    { k: 'in', sub: 'pay', acct: 'bpi', a: 21000, date: '2026-11-15' },
    { k: 'move', a: 11000, place: 'waiting', place2: 'bills' }, { k: 'move', a: 6000, place: 'waiting', place2: 'free' },
    { k: 'move', a: 2000, place: 'waiting', place2: 'emergency' },
    { k: 'spend', sub: 'spend', acct: 'spl', a: 5999.97, place: 'free' },
    { do: 'expect', owed: 9599.97, free: 6000, total: 25722.30 },
    { k: 'transfer', acct: 'bpi', acct2: 'gcash', a: 3000 },
    { k: 'repay', sub: 'pay-later instalment', acct: 'gcash', acct2: 'spl', a: 1999.99, place: 'bills' },
    { k: 'repay', sub: 'pay-later instalment', acct: 'gcash', acct2: 'gg', a: 1200, place: 'bills' },
    { k: 'borrow', sub: 'borrowed', acct: 'gcash', acct2: 'tita', a: 5000 },
    { do: 'expect', owed: 11399.98, total: 27522.31 },
    { k: 'spend', sub: 'bill', acct: 'gcash', a: 4800, place: 'waiting' },
    { k: 'in', sub: 'pay', acct: 'bpi', a: 21000, date: '2026-11-30' },
    { k: 'repay', sub: 'paid back', acct: 'bpi', acct2: 'tita', a: 2500, place: 'bills' },
    { do: 'expect', owed: 8899.98 },
    { k: 'spend', sub: 'spend', acct: 'bpi', a: 7000, place: 'free' },
    { do: 'expect', freeBelowZero: true },
    { do: 'reload' }, { do: 'undo' }, { do: 'expect', freeBelowZero: false },
  ],
};

const JAPAN = {
  name: 'Salaried person in Japan, card paid in full next month, Suica, a refund on the card',
  setup: { cur: 'JPY', mode: 'track', accounts: [
    { id: 'bank', name: 'Bank', type: 'bank' }, { id: 'card', name: 'Card', type: 'card', inFull: true, payDay: 27 },
    { id: 'suica', name: 'Suica', type: 'ewallet' } ] },
  steps: [
    { k: 'open', acct: 'bank', a: 312400 }, { k: 'open', acct: 'card', a: 0 }, { k: 'open', acct: 'suica', a: 1830 },
    { k: 'in', sub: 'pay', acct: 'bank', a: 268000, date: '2026-11-25' },
    { k: 'move', a: 150000, place: 'waiting', place2: 'bills' }, { k: 'move', a: 60000, place: 'waiting', place2: 'free' },
    { k: 'move', a: 200000, place: 'waiting', place2: 'emergency' },
    { k: 'spend', sub: 'spend', acct: 'card', a: 4980, place: 'free' }, { k: 'spend', sub: 'bill', acct: 'card', a: 9800, place: 'bills' },
    { k: 'in', sub: 'refund', acct: 'card', a: 1200, place: 'free' },
    { do: 'expect', owed: 13580, forCards: 13580, free: 56220, total: 582230 },
    { k: 'transfer', acct: 'bank', acct2: 'suica', a: 3000 },
    { k: 'spend', sub: 'spend', acct: 'suica', a: 420, place: 'free' },
    { k: 'in', sub: 'pay', acct: 'bank', a: 268000, date: '2026-12-25' },
    { k: 'repay', sub: 'card payment', acct: 'bank', acct2: 'card', a: 13580, date: '2026-12-27' },
    { do: 'expect', owed: 0, forCards: 0 },
  ],
};

const FRANCE = {
  name: 'Student in France: Revolut, a small bank account, cash, shared rent paid in full and half paid back',
  setup: { cur: 'EUR', mode: 'track', accounts: [
    { id: 'rev', name: 'Revolut', type: 'bank' }, { id: 'ca', name: 'Bank', type: 'bank' },
    { id: 'cash', name: 'Cash', type: 'cash' }, { id: 'lea', name: 'Léa owes me', type: 'owedToYou' } ] },
  steps: [
    { k: 'open', acct: 'rev', a: 642.18 }, { k: 'open', acct: 'ca', a: 85 }, { k: 'open', acct: 'cash', a: 23.40 },
    { k: 'in', sub: 'grant', acct: 'ca', a: 450 }, { k: 'in', sub: 'gift', acct: 'rev', a: 300 },
    { k: 'move', a: 390, place: 'waiting', place2: 'bills' }, { k: 'move', a: 250, place: 'waiting', place2: 'free' },
    { k: 'spend', sub: 'bill', acct: 'rev', a: 390, place: 'bills' },
    { k: 'transfer', sub: 'lent', acct: 'rev', acct2: 'lea', a: 390 },
    { do: 'expect', total: 1110.58, billsOnly: 0 },
    { k: 'transfer', acct: 'ca', acct2: 'cash', a: 40 },
    { k: 'spend', sub: 'spend', acct: 'cash', a: 12.80, place: 'free' },
    { k: 'transfer', sub: 'paid back to you', acct: 'lea', acct2: 'rev', a: 390 },
    { k: 'check', acct: 'cash', typedA: 49.10 },
    { do: 'expect', unexplainedOf: ['cash', -1.50], total: 1097.78 },
    { k: 'adjust', acct: 'cash', a: -1.50, place: 'free' },
    { do: 'expect', free: 235.70, total: 1096.28 },
  ],
};

const MISSED = {
  name: 'Someone who misses a month and starts fresh from today',
  setup: { cur: 'PHP', mode: 'track', accounts: [ { id: 'bank', name: 'Bank', type: 'bank' }, { id: 'card', name: 'Card', type: 'card', inFull: true, payDay: 5 } ] },
  steps: [
    { k: 'open', acct: 'bank', a: 30500, date: '2027-01-01' }, { k: 'open', acct: 'card', a: 2100, date: '2027-01-01' },
    { k: 'in', sub: 'pay', acct: 'bank', a: 40000, date: '2027-01-15' },
    { k: 'move', a: 20000, place: 'waiting', place2: 'bills' }, { k: 'move', a: 5000, place: 'waiting', place2: 'free' },
    { k: 'move', a: 30000, place: 'waiting', place2: 'emergency' },
    { k: 'spend', acct: 'card', a: 1500, place: 'free', date: '2027-01-20' },
    /* nothing logged in February. In March: start fresh from today, one typed balance per account */
    { k: 'check', acct: 'bank', typedA: 51234.56, date: '2027-03-02' }, { k: 'check', acct: 'card', typedA: 8820, date: '2027-03-02' },
    { do: 'expect', unexplainedOf: ['bank', -19265.44] },
    { k: 'adjust', sub: 'start fresh', acct: 'bank', a: -19265.44, place: 'waiting', date: '2027-03-02' },
    { k: 'adjust', sub: 'start fresh', acct: 'card', a: 5220, place: 'waiting', date: '2027-03-02' },
    { k: 'check', acct: 'bank', typedA: 51234.56, date: '2027-03-02' }, { k: 'check', acct: 'card', typedA: 8820, date: '2027-03-02' },
    { do: 'expect', unexplainedOf: ['card', 0], total: 51234.56, owed: 8820, waitingBelowZero: true },
    { k: 'move', a: 12000, place: 'emergency', place2: 'waiting' },
    { do: 'expect', waitingBelowZero: false },
  ],
};

const NEW_PHONE = {
  name: 'Someone whose phone is replaced and restores a backup',
  setup: { cur: 'PHP', mode: 'wallet', accounts: [ { id: 'bank', name: 'Bank', type: 'bank' }, { id: 'gcash', name: 'GCash', type: 'ewallet' }, { id: 'wallet', name: 'Wallet', type: 'wallet', tracked: false } ] },
  steps: [
    { k: 'open', acct: 'bank', a: 9100 }, { k: 'open', acct: 'gcash', a: 640.20 },
    { k: 'in', sub: 'pay', acct: 'bank', a: 35000 },
    { k: 'move', a: 18000, place: 'waiting', place2: 'bills' }, { k: 'hand', acct: 'bank', acct2: 'wallet', a: 4000, place: 'waiting' },
    { k: 'move', a: 10000, place: 'waiting', place2: 'emergency' },
    { do: 'undo' },
    { do: 'backup', as: 'cloud' },
    { k: 'spend', acct: 'bank', a: 2500, place: 'bills' },
    { k: 'spend', acct: 'gcash', a: 300, place: 'waiting' },
    { do: 'restore', from: 'cloud' },
    { do: 'expect', total: 40740.20, free: 4000, restoredEqualsBackup: true },
    { do: 'redo' },
    { do: 'expect', saved: 10000 },
    { k: 'spend', acct: 'bank', a: 2500, place: 'bills' },
    { do: 'expect', total: 38240.20 },
  ],
};

const PH_TEAM = {
  name: 'Standard Philippine team shape (Mako, 2026-11-19): two banks, GCash, Maya, cash, two cards (one with an older balance), pay-later, monthly pay on the 15th plus a side income',
  setup: { cur: 'PHP', mode: 'track', payDays: [15], accounts: [
    { id: 'bdo', name: 'BDO', type: 'bank' }, { id: 'bpi', name: 'BPI', type: 'bank' },
    { id: 'gcash', name: 'GCash', type: 'ewallet' }, { id: 'maya', name: 'Maya', type: 'ewallet' }, { id: 'cash', name: 'Cash', type: 'cash' },
    { id: 'bpiCard', name: 'BPI card', type: 'card', inFull: true, payDay: 5 },
    { id: 'mbCard', name: 'Metrobank card', type: 'card', inFull: true, payDay: 20 },
    { id: 'mbOld', name: 'Metrobank card, older balance', type: 'loan', payDay: 20 },
    { id: 'spl', name: 'SPayLater', type: 'paylater' } ] },
  steps: [
    { k: 'open', acct: 'bdo', a: 12480.60, date: '2026-11-14' }, { k: 'open', acct: 'bpi', a: 3050, date: '2026-11-14' },
    { k: 'open', acct: 'gcash', a: 920.15, date: '2026-11-14' }, { k: 'open', acct: 'maya', a: 410, date: '2026-11-14' },
    { k: 'open', acct: 'cash', a: 1200, date: '2026-11-14' }, { k: 'open', acct: 'bpiCard', a: 8760, date: '2026-11-14' },
    { k: 'open', acct: 'mbOld', a: 24000, date: '2026-11-14' },
    { do: 'expect', total: 18060.75, forCards: 8760, waiting: 9300.75, owed: 32760 },
    { k: 'in', sub: 'pay', acct: 'bdo', a: 38000, date: '2026-11-15' },
    { k: 'in', sub: 'pay', acct: 'gcash', a: 6500, date: '2026-11-15', startsPeriod: false },
    { k: 'move', a: 18000, place: 'waiting', place2: 'bills', date: '2026-11-15' }, { k: 'move', a: 7000, place: 'waiting', place2: 'free', date: '2026-11-15' },
    { k: 'move', a: 4000, place: 'waiting', place2: 'emergency', date: '2026-11-15' }, { k: 'move', a: 1000, place: 'waiting', place2: 'give', date: '2026-11-15' },
    { k: 'spend', sub: 'spend', acct: 'bpiCard', a: 2350, place: 'free', date: '2026-11-16' },
    { k: 'spend', sub: 'bill', acct: 'mbCard', a: 1499, place: 'bills', date: '2026-11-18' },
    { k: 'spend', sub: 'spend', acct: 'spl', a: 3600, place: 'free', date: '2026-11-20' },
    { k: 'spend', sub: 'family support', acct: 'gcash', a: 5000, place: 'bills', date: '2026-11-21' },
    { k: 'repay', sub: 'card payment', acct: 'bdo', acct2: 'bpiCard', a: 8760, date: '2026-12-05' },
    { k: 'repay', sub: 'card payment (older balance)', acct: 'bdo', acct2: 'mbOld', a: 2500, place: 'bills', date: '2026-12-05' },
    { k: 'spend', sub: 'interest', acct: 'mbOld', a: 380, place: 'bills', date: '2026-12-06' },
    { do: 'expect', owed: 29329, forCards: 3849, total: 46300.75, free: 4650 },
    { k: 'transfer', acct: 'bdo', acct2: 'maya', a: 2000, date: '2026-12-07' },
    { k: 'spend', sub: 'spend', acct: 'maya', a: 1250.50, place: 'free', date: '2026-12-08' },
    { k: 'check', acct: 'bdo', typedA: 37150.60, date: '2026-12-09' },
    { do: 'expect', unexplainedOf: ['bdo', -70] },
    { k: 'adjust', acct: 'bdo', a: -70, place: 'bills', date: '2026-12-09' },
    { k: 'check', acct: 'cash', typedA: 950, date: '2026-12-09' },
    { k: 'adjust', acct: 'cash', a: -250, place: 'free', date: '2026-12-09' },
    { do: 'expect', total: 44730.25, free: 3149.50 },
    { do: 'reload' }, { do: 'undo' }, { do: 'redo' },
  ],
};

/* moving a saved 38.31 copy into the ledger (made-up shape and numbers) */
const MIGRATIONS = [
  { name: '38.31 copy with a bank, two cards and two goal starts', old: { cur: 'JPY', freeMode: 'track', bankStart: 152340, bankAt: '2026-11-18',
      cards: [{ name: 'Card A', owed: 61200, payDay: 10 }, { name: 'Card B', owed: 23450, payDay: 11 }],
      goals: [{ id: 'emergency', start: 6100 }, { id: 'trip', start: 2750 }], planFigures: { bankEnd: 201000 } },
    expect: { total: 161190, waiting: 67690, forCards: 84650, saved: 8850, owed: 84650 } },
  { name: '38.31 copy with a bank below zero', old: { cur: 'PHP', bankStart: -2400.50, bankAt: '2026-11-18', cards: [], goals: [{ id: 'emergency', start: 1000 }] },
    expect: { total: -1400.50, waiting: -2400.50, saved: 1000, owed: 0 } },
];

module.exports = { PERSONAS: [MAKO, PH_TEAM, PH_FREELANCER, PH_SALARIED, JAPAN, FRANCE, MISSED, NEW_PHONE], MIGRATIONS };
