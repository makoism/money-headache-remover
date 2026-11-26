'use strict';
// [CHECKFIX_PLAN FD1, FA, After confirm 2] Every new check names that account's latest live check in `prev`; a removed
// check comes back only when a live check of the same account names it (ledger.revive, read by the look ahead and by
// sync.afterSync), with every record removed in its step (one goneBy) and its check-in record, as a chain. The join
// keeps a check-in's fillerPlace account by account. Mako's made-up book (one bank, two cards). Kenji's moment (M98):
// he removes a wrong check on his phone and checks again (no revive); his computer, offline, had checked after the
// wrong one (it comes back, with the plain notice). Every amount is made up.
const { t, done, eq, ok } = require('./t.js');
const fs = require('fs'), path = require('path');
const LA = require('../lookahead.js'), CK = require('../checkin.js'), SY = require('../sync.js'), LG = require('../ledger.js'), BB = require('../build_book.js'), IDS = require('../ids.js');

const ID = n => 'k7m2qa-f3n8p1x6wd-' + n;
const BANK = ID(1), CARD_A = ID(2), C0 = ID(11), DAY = '2026-11-26';
const AT = (d, h) => d + 'T' + (h || '10') + ':00:00.000+09:00';
const clone = x => JSON.parse(JSON.stringify(x));
function base() {
  const b = JSON.parse(fs.readFileSync(path.join(__dirname, '../../app3/fixtures/mako_madeup_book.json'), 'utf8'));
  b.events = b.events.filter(e => e.k === 'open' || e.k === 'check');
  return b;
}
// a check-in of the bank (and a card when given), as Check your bank writes it
function check(b, day, fig, maker, card, h) {
  const out = CK.checkIn(b, { day, told: AT(day, h), newId: IDS.idMaker(maker), figures: Object.assign({ [BANK]: fig }, card != null ? { [CARD_A]: card } : {}), ticked: [], unticked: [], amounts: {}, expected: {}, lands: {}, landed: {} });
  return { book: CK.apply(b, out), ci: out.checkins[0], check: out.events.find(e => e.acct === BANK) };
}
// removeCheck's marks (FA): the account's check and the records of its step, one goneBy; the check-in record only when
// nothing in it is live
function remove(b, checkId, step, day) {
  const c = b.events.find(e => e.id === checkId);
  Object.assign(c, { gone: day, goneBy: step, at: AT(day, '11') });
  const ci = b.checkins.find(k => k.id === c.grp);
  if (ci && !b.events.some(e => !e.gone && e.grp === ci.id)) Object.assign(ci, { gone: day, goneBy: step, at: AT(day, '11') });
  return b;
}
const bankOn = (b, d) => LA.lookahead(b, d || DAY).accounts[BANK].bank;
const revivedChecks = b => LA.lookahead(b, DAY).warnings.filter(w => w.code === 'revived' && w.check);

// --- prev, written by every writer
t('[FD1] Check your bank names the account\'s latest live check in prev; the first check after setup names the opening check', () => {
  const r = check(base(), '2026-11-24', 280000, 'p4r9zz');
  eq(r.check.prev, C0);
  const r2 = check(r.book, '2026-11-25', 279000, 'p4r9zz', 50000);
  eq(r2.check.prev, r.check.id);
  eq(r2.book.events.find(e => e.acct === CARD_A && e.grp === r2.ci.id).prev, ID(13), 'the card\'s names its own opening check');
});
t('[FD1] a removed check is not named: the check after a remove names the one before it', () => {
  const r = check(base(), '2026-11-24', 280000, 'p4r9zz');
  remove(r.book, r.check.id, 'p4r9zz-st-1', '2026-11-24');
  eq(check(r.book, '2026-11-25', 279000, 'p4r9zz').check.prev, C0);
});
t('[FD1] latestCheck goes by date, then told: two checks on one day, the later told is the latest', () => {
  const a = check(base(), '2026-11-24', 280000, 'p4r9zz', null, '09'), b2 = check(a.book, '2026-11-24', 279000, 'p4r9zz', null, '18');
  eq(CK.prevCheck(b2.book, BANK), b2.check.id);
  eq(b2.check.prev, a.check.id);
});
t('[FD1] setup\'s statement check names the card\'s opening check', () => {
  const out = BB.buildBook({ day: '2026-11-24', told: AT('2026-11-24'), currency: 'JPY', country: 'JP',
    banks: [{ key: 'b1', name: 'Main bank', amount: 200000, main: true }],
    pays: [{ key: 'p1', name: 'Pay', bank: 'b1', amount: 300000, every: 'month', day: 10, shift: 'none', startsPeriod: true }],
    cards: [{ key: 'c1', name: 'Card A', owed: 40000, payDay: 27, closeDay: 15, payFrom: 'b1', statement: 30000 }], bills: [], free: 50000 }, { newId: IDS.idMaker('s3tupx') });
  const book = out.book || out, card = book.accounts.find(a => a.type === 'card').id;
  const checks = book.events.filter(e => e.k === 'check' && e.acct === card);
  eq(checks.length, 2);
  ok(!checks[0].prev, 'the opening has none before it');
  eq(checks[1].prev, checks[0].id);
});

// --- the revive
function kenji() {
  const b0 = base();
  const c1 = check(b0, '2026-11-24', 182400, 'p4r9zz');   // the phone's C1, a typo; both devices have it
  return { shared: c1.book, c1: c1.check };
}
t('[FD1] remove then check again on one device: C1 stays gone, the new check names C0', () => {
  const { shared, c1 } = kenji();
  const phone = check(remove(clone(shared), c1.id, 'p4r9zz-st-9', '2026-11-25'), '2026-11-25', 128400, 'p4r9zz');
  eq(phone.check.prev, C0);
  eq(revivedChecks(phone.book), []);
  ok(LA.lookahead(phone.book, DAY).accounts[BANK].bank === 128400);
});
for (const order of ['phone first', 'computer first']) {
  t(`[FD1] an offline computer checked after C1 (prev C1); the phone removed C1: on the join (${order}) C1 comes back with the notice`, () => {
    const { shared, c1 } = kenji();
    const phone = remove(clone(shared), c1.id, 'p4r9zz-st-9', '2026-11-25');
    const comp = check(clone(shared), '2026-11-25', 175000, 'd8sk7q');
    eq(comp.check.prev, c1.id);
    const joined = order === 'phone first' ? SY.sync(shared, phone, comp.book) : SY.sync(shared, comp.book, phone);
    eq(joined.events.find(e => e.id === c1.id).gone, '2026-11-25', 'nothing is written by the join');
    eq(joined.events.find(e => e.id === comp.check.id).prev, c1.id, 'the sync round trip keeps prev');
    const w = revivedChecks(joined);
    eq(w.map(x => [x.check, x.acct, x.by]), [[c1.id, BANK, [comp.check.id]]]);
    eq(w[0].text, 'A bank check of Main bank you removed came back, because another device added a later one');
    const a = SY.afterSync(joined);
    eq(a.notices.filter(n => n.check).map(n => [n.check, n.notice]), [[c1.id, 'revived']]);
    // the C1 check-in record comes back too (it was gone with the check)
    const rv = LG.revive(joined).book;
    ok(!rv.checkins.find(k => k.id === c1.grp).gone, 'its check-in record is back');
  });
}
t('[FD1] the device that removed C1 sees it come back too (the look ahead reads the revive)', () => {
  const { shared, c1 } = kenji();
  const phone = remove(clone(shared), c1.id, 'p4r9zz-st-9', '2026-11-25');
  const comp = check(clone(shared), '2026-11-25', 175000, 'd8sk7q');
  const joined = SY.sync(shared, phone, comp.book), never = comp.book;
  eq(bankOn(joined), bankOn(never));
  eq(LA.lookahead(joined, DAY).safeToSpend.headline, LA.lookahead(never, DAY).safeToSpend.headline, 'counted as if it had never been removed');
});
t('[FD1] an old book with no prev never brings a check back', () => {
  const { shared, c1 } = kenji();
  const phone = remove(clone(shared), c1.id, 'p4r9zz-st-9', '2026-11-25');
  const comp = check(clone(shared), '2026-11-25', 175000, 'd8sk7q');
  delete comp.check.prev; delete comp.book.events.find(e => e.id === comp.check.id).prev;
  eq(revivedChecks(SY.sync(shared, phone, comp.book)), []);
});
t('[FD1] prev naming a check of another account is ignored', () => {
  const { shared, c1 } = kenji();
  const b = remove(clone(shared), c1.id, 'p4r9zz-st-9', '2026-11-25');
  b.events.push({ id: 'd8sk7q-abcdefghij-1', k: 'check', acct: CARD_A, date: '2026-11-25', a: 50000, prev: c1.id, told: AT('2026-11-25'), at: AT('2026-11-25'), by: 'd8sk7q', grp: 'd8sk7q-g1' });
  eq(revivedChecks(b), []);
});
t('[FA] a revived check-in brings back its ticks and its gap spend (same goneBy), and they count as before the remove', () => {
  const { shared, c1 } = kenji();
  // C1's step had a gap spend logged with it (old fixed shape) and a ticked bill
  const gap = { id: 'p4r9zz-abcdefghij-90', k: 'spend', acct: BANK, a: 3000, date: '2026-11-24', dayInside: true, line: 'free', grp: c1.grp, told: AT('2026-11-24'), at: AT('2026-11-24'), by: 'p4r9zz', note: 'Found at a bank check' };
  shared.events.push(gap);
  const step = 'p4r9zz-st-9', phone = clone(shared);
  remove(phone, c1.id, step, '2026-11-25');
  Object.assign(phone.events.find(e => e.id === gap.id), { gone: '2026-11-25', goneBy: step });
  const comp = check(clone(shared), '2026-11-25', 175000, 'd8sk7q');
  const joined = SY.sync(shared, phone, comp.book), rv = LG.revive(joined).book;
  ok(!rv.events.find(e => e.id === gap.id).gone, 'the gap spend is back');
  eq(bankOn(joined), bankOn(comp.book));
});
t('[FD1] a chain: C1 and C1b (prev C1) both removed, a live C2\' names C1b: C1b comes back, then C1 because C1b names it', () => {
  const { shared, c1 } = kenji();
  const c1b = check(shared, '2026-11-25', 180000, 'p4r9zz');
  eq(c1b.check.prev, c1.id);
  const comp = check(clone(c1b.book), '2026-11-26', 170000, 'd8sk7q');
  eq(comp.check.prev, c1b.check.id);
  const phone = remove(remove(clone(c1b.book), c1b.check.id, 'p4r9zz-st-8', '2026-11-26'), c1.id, 'p4r9zz-st-9', '2026-11-26');
  // step one: only C1b gone and named: C1b back
  const one = remove(clone(c1b.book), c1b.check.id, 'p4r9zz-st-8', '2026-11-26');
  eq(revivedChecks(SY.sync(c1b.book, one, comp.book)).map(w => w.check), [c1b.check.id]);
  // the chain: both back
  const joined = SY.sync(c1b.book, phone, comp.book);
  eq(revivedChecks(joined).map(w => w.check).sort(), [c1.id, c1b.check.id].sort());
  const rv = LG.revive(joined).book;
  ok(!rv.events.find(e => e.id === c1.id).gone && !rv.events.find(e => e.id === c1b.check.id).gone);
});

// --- the join keeps fillerPlace per account
t('[After confirm 2] two devices change where the gap went for different accounts in one check-in: both kept', () => {
  const r = check(base(), '2026-11-24', 280000, 'p4r9zz', 50000);
  const b = r.book, ci = b.checkins[0];
  const m = clone(b), th = clone(b);
  Object.assign(m.checkins[0], { fillerPlace: { [BANK]: 'line:food' }, at: AT('2026-11-25', '09') });
  Object.assign(th.checkins[0], { fillerPlace: { [CARD_A]: 'line:fun' }, at: AT('2026-11-25', '10'), by: 'd8sk7q' });
  const j = SY.sync(b, m, th);
  eq(j.checkins.find(k => k.id === ci.id).fillerPlace, { [BANK]: 'line:food', [CARD_A]: 'line:fun' });
  eq(SY.afterSync(j).questions, []);
});
done('check_revive.test.js');
