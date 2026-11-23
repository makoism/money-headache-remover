// S1: lunch typed at noon, evening check-in includes it, the statement imported a week later replaces the typed lunch.
const { lookahead, sc, bank } = require('./base');
const s = sc({ accounts: [bank('b', '2027-01-04', 100000)], events: [
  { id: 't1', date: '2027-01-06', told: '2027-01-06T12:00', kind: 'spend', account: 'b', amount: 1000, note: 'lunch typed' },
  { id: 'c1', date: '2027-01-06', told: '2027-01-06T20:00', kind: 'check', account: 'b', amount: 99000, note: 'bank app shows lunch gone' },
  { id: 'i1', date: '2027-01-06', posted: '2027-01-06', told: '2027-01-13T09:00', kind: 'spend', account: 'b', amount: 1000, source: 'statement' } ] });
let r = lookahead(s, '2027-01-13');
console.log('S1a typed+import: bank', r.accounts.b.bank, 'expected 99000; filler', JSON.stringify(r.accounts.b.fillers.map(f=>f.amount)));
// S1b: no typed line; the check holds the lunch (filler 1000); the later import should shrink the filler, not lower the bank.
const s2 = JSON.parse(JSON.stringify(s)); s2.events = s2.events.filter(e => e.id !== 't1');
r = lookahead(s2, '2027-01-13');
console.log('S1b import only: bank', r.accounts.b.bank, 'expected 99000; fillers', JSON.stringify(r.accounts.b.fillers.map(f=>f.amount)), 'expected [0]');
// S1c: import of a line posted on the OPENING day (the morning coffee before setup at noon), imported later.
const s3 = sc({ accounts: [bank('b', '2027-01-04', 100000, { opening: { date: '2027-01-04', told: '2027-01-04T12:00', amount: 100000 } })], events: [
  { id: 'i2', date: '2027-01-04', posted: '2027-01-04', told: '2027-01-10T09:00', kind: 'spend', account: 'b', amount: 500, source: 'statement', note: 'coffee at 8:00, before setup' } ] });
r = lookahead(s3, '2027-01-10');
console.log('S1c opening-day line imported later: bank', r.accounts.b.bank, 'expected 100000 (the opening figure held it)');
