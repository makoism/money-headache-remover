'use strict';
// [BZ3, qc-foundation finding 3 on CONTROLS_PLAN] A removed record comes back when a live record names it. The life
// (qc-foundation's goneacct.js, with the marks act3 really writes): on the desktop an e-wallet added by mistake is
// removed (the account, its opening and its opening check, all `goneBy` that step); meanwhile the phone, offline, logs a
// 3,000 spend on it. After the sync the spend counts, the e-wallet is back, the look ahead warns `revived` and afterSync
// gives a notice. The same for a removed line and a removed bill. Every amount is made up.
const { t, done, eq, ok } = require('./t.js');
const fs = require('fs'), path = require('path');
const { lookahead } = require('../lookahead.js');
const SY = require('../sync.js');

const ID = n => 'k7m2qa-f3n8p1x6wd-' + n;
const BANK = ID(1), FOOD = ID(40), WALLET = ID(70), RENT = ID(6), STEP = 'k7m2qa-p9x2rm4tqe-1', DAY = '2026-11-24';
const AT = d => d + 'T10:00:00.000+09:00';
function base() {
  const b = JSON.parse(fs.readFileSync(path.join(__dirname, '../../app3/fixtures/mako_madeup_book.json'), 'utf8'));
  b.events = b.events.filter(e => e.k === 'open' || e.k === 'check');
  b.plan.budgets = [{ id: FOOD, name: 'Food', place: 'bills', cur: 'JPY', per: 'pay', from: '2026-11-20', steps: [{ from: null, amount: 40000 }], told: AT('2026-11-20'), at: AT('2026-11-20'), by: 'k7m2qa' }];
  b.accounts.push({ id: WALLET, name: 'PayPay', type: 'ewallet', cur: 'JPY', told: AT('2026-11-21'), at: AT('2026-11-21'), by: 'k7m2qa' });
  b.events.push({ id: ID(71), k: 'open', acct: WALLET, date: '2026-11-21', a: 5000, told: AT('2026-11-21'), at: AT('2026-11-21'), by: 'k7m2qa', grp: 'k7m2qa-g7' });
  b.events.push({ id: ID(72), k: 'check', acct: WALLET, date: '2026-11-21', a: 5000, told: AT('2026-11-21'), at: AT('2026-11-21'), by: 'k7m2qa', grp: 'k7m2qa-g7' });
  return b;
}
const clone = x => JSON.parse(JSON.stringify(x));
const goneBy = (r, day) => Object.assign(r, { gone: day, goneBy: STEP, at: AT(day).replace('10:00', '11:00') });
// the desktop removes the e-wallet (true remove: the account and its own records, one step)
function desktop(b) {
  const d = clone(b);
  goneBy(d.accounts.find(a => a.id === WALLET), '2026-11-23');
  for (const e of d.events) if (e.acct === WALLET) goneBy(e, '2026-11-23');
  return d;
}
// the phone, offline, logs a 3,000 spend on it (on a line, or on Free to spend)
function phone(b, line) {
  const p = clone(b);
  p.events.push(Object.assign({ id: 'p4r9zz-abcdefghij-1', k: 'spend', acct: WALLET, a: 3000, date: '2026-11-22', told: AT('2026-11-22'), at: AT('2026-11-22'), by: 'p4r9zz', grp: 'p4r9zz-s1' }, line ? { line } : {}));
  return p;
}

for (const line of [null, FOOD]) {
  t(`[BZ3] two devices: an e-wallet removed on the desktop, a 3,000 spend on it logged on the phone (${line ? 'on Food' : 'Free to spend'}): it counts, the e-wallet is back, and both say so`, () => {
    const b = base(), joined = SY.sync(b, desktop(b), phone(b, line));
    const r = lookahead(joined, DAY);
    ok(r.accounts[WALLET], 'the e-wallet is back in the look ahead');
    eq(r.accounts[WALLET].bank, 2000, 'its opening 5,000 back, less the 3,000');
    eq(r.warnings.filter(w => w.code === 'revived').map(w => [w.account, w.by]), [[WALLET, ['p4r9zz-abcdefghij-1']]]);
    if (line) eq(r.period.lines.map(l => [l.name, l.spent]), [['Food', 3000]]);
    const a = SY.afterSync(joined);
    eq(a.notices, [{ account: WALLET, notice: 'revived', by: ['p4r9zz-abcdefghij-1'] }]);
    eq(a.questions, []);
    eq(joined.accounts.find(x => x.id === WALLET).gone, '2026-11-23', 'nothing is written by the sync: it is read the same on both devices');
  });
}
t('[BZ3] the 3,000 is counted the same as if the e-wallet had never been removed', () => {
  const b = base(), joined = SY.sync(b, desktop(b), phone(b, FOOD)), never = phone(b, FOOD);
  const r = lookahead(joined, DAY), n = lookahead(never, DAY);
  eq([r.total.amount, r.safeToSpend.headline], [n.total.amount, n.safeToSpend.headline]);
});
t('[BZ3] a removed line that a live spend names comes back for that spend, with a notice', () => {
  const b = base(), d = clone(b);
  goneBy(d.plan.budgets[0], '2026-11-23');
  const joined = SY.sync(b, d, phone(b, FOOD));
  joined.accounts.find(a => a.id === WALLET).gone = undefined;   // the e-wallet itself is live here
  const r = lookahead(joined, DAY);
  eq(r.period.lines.map(l => [l.name, l.spent]), [['Food', 3000]], 'not dropped into Free to spend');
  eq(r.warnings.filter(w => w.code === 'revived').map(w => [w.line, w.name]), [[FOOD, 'Food']]);
  eq(SY.afterSync(joined).notices, [{ line: FOOD, notice: 'revived', by: ['p4r9zz-abcdefghij-1'] }]);
});
t('[BZ3] a removed bill that a live tick settles comes back, with a notice', () => {
  const b = base(), d = clone(b), p = clone(b);
  goneBy(d.schedules.find(s => s.id === RENT), '2026-11-23');
  p.events.push({ id: 'set:' + RENT + '@2026-11-27', k: 'spend', acct: BANK, a: 72000, date: '2026-11-22', told: AT('2026-11-22'), at: AT('2026-11-22'), by: 'p4r9zz', grp: 'p4r9zz-s2', settles: [RENT + '@2026-11-27'] });
  const joined = SY.sync(b, d, p);
  const r = lookahead(joined, DAY), never = lookahead(p, DAY);
  eq(r.warnings.filter(w => w.code === 'revived').map(w => [w.schedule, w.name]), [[RENT, 'Rent']]);
  eq(r.safeToSpend.headline, never.safeToSpend.headline, 'the rent counts as paid, as on the phone');
  eq(SY.afterSync(joined).notices, [{ schedule: RENT, notice: 'revived', by: ['set:' + RENT + '@2026-11-27'] }]);
});
t('[BZ3] a removed record nothing live names stays removed, with no notice; a book with nothing removed reads the same', () => {
  const b = base(), d = desktop(b);
  const r = lookahead(d, DAY);
  ok(!r.accounts[WALLET]);
  eq(r.warnings.filter(w => w.code === 'revived'), []);
  eq(SY.afterSync(d).notices, []);
});
t('[BZ3] the spend removed with the account in the same step does not bring it back (only a live record does)', () => {
  const b = phone(base(), FOOD), d = desktop(b);
  for (const e of d.events) if (e.acct === WALLET && !e.gone) goneBy(e, '2026-11-23');
  ok(!lookahead(d, DAY).accounts[WALLET]);
});
done('revive.test.js');
