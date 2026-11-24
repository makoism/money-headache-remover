/* screens/status.js: one status (state, reason, next step) every screen reads (sweep2_repeats A1, B2). Made-up money. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { test, run } = require('./harness');
const status = require('../status.js');
const { lookahead } = require('../../foundation_review/ref/lookahead_ref.js');

const SC = path.join(__dirname, '../../foundation_review/scenarios');
const scen = f => JSON.parse(fs.readFileSync(path.join(SC, f + '.json'), 'utf8'));
const engine = (f, d) => lookahead(scen(f), d, {});
const clone = x => JSON.parse(JSON.stringify(x));
const YEN = { currency: 'JPY', origin: 'typed' };

test('Mako\'s shape, five days after setup: safe, with the amount and the day of the next pay', () => {
  const s = status.statusOf(engine('mako_shape', '2026-11-25'), YEN);
  assert.strictEqual(s.state, 'ok');
  assert.strictEqual(s.level, 'good');
  assert.deepStrictEqual(s.reason, { code: 'safe', amount: 182000, currency: 'JPY', until: '2026-12-10', capped: false });
  assert.strictEqual(s.text.reason, '¥182,000 is safe to spend until pay on 10 Dec');
  assert.strictEqual(s.next, null);
});

test('the status is frozen: a screen cannot write its own verdict into it', () => {
  const s = status.statusOf(engine('mako_shape', '2026-11-25'), YEN);
  assert.ok(Object.isFrozen(s) && Object.isFrozen(s.reason) && Object.isFrozen(s.text) && Object.isFrozen(s.also));
});

test('sample numbers are never judged as the person\'s money', () => {
  const s = status.statusOf(engine('mako_shape', '2026-11-25'), { currency: 'JPY', origin: 'sample' });
  assert.strictEqual(s.state, 'sample');
  assert.strictEqual(s.underlying, 'ok');
  assert.match(s.text.reason, /made up/);
  assert.strictEqual(s.next.code, 'put_yours_in');
});

test('the origin must be said: typed or sample, nothing else', () => {
  const r = engine('mako_shape', '2026-11-25');
  assert.throws(() => status.statusOf(r, { currency: 'JPY' }), /origin/);
  assert.throws(() => status.statusOf(r, { currency: 'JPY', origin: 'mixed' }), /origin/);
  assert.throws(() => status.statusOf(r, { origin: 'typed' }), /currency/);
});

test('no bank figure yet: the next step is to check in', () => {
  const r = clone(engine('mako_shape', '2026-11-25'));
  r.accounts = {};
  const s = status.statusOf(r, YEN);
  assert.strictEqual(s.state, 'empty');
  assert.strictEqual(s.next.code, 'check_in');
});

test('short: says by how much, from when, and what to do before then', () => {
  const r = clone(engine('mako_shape', '2026-11-25'));
  r.safeToSpend.headline = 0; r.safeToSpend.shortfall = 12000;
  r.warnings.push({ account: 'bank', code: 'below_minimum', day: '2026-12-07', short: 12000 });
  const s = status.statusOf(r, Object.assign({ names: { bank: 'Main bank' } }, YEN));
  assert.strictEqual(s.state, 'short');
  assert.strictEqual(s.level, 'bad');
  assert.strictEqual(s.text.reason, 'You\'re short by ¥12,000 on 7 Dec');
  /* [BL3] with the engine's short (the sum's own total, the pay after the lowest point), the status says the headline's words */
  r.safeToSpend.short = { account: 'bank', day: '2026-12-07', amount: 15000, minimum: null, beforePay: '2026-12-25', first: 12000 };
  const s2 = status.statusOf(r, Object.assign({ names: { bank: 'Main bank' } }, YEN));
  assert.strictEqual(s2.text.reason, 'You\'re short by ¥15,000 before pay on 25 Dec, below zero from 7 Dec');
  r.safeToSpend.short = Object.assign({}, r.safeToSpend.short, { minimum: 5000, beforePay: null });
  assert.strictEqual(status.statusOf(r, Object.assign({ names: { bank: 'Main bank' } }, YEN)).text.reason, 'You\'re short by ¥15,000, below your minimum from 7 Dec');
  assert.strictEqual(s2.text.next, 'Move money in before 7 Dec');
  assert.strictEqual(s.next.code, 'move_money_in');
  assert.strictEqual(s.text.next, 'Move money in before 7 Dec');
  assert.ok(!s.also.includes('below_minimum'), 'the warning that makes the state is not repeated under it');
});

test('one account under its minimum while the headline is fine: never "ok" (freelancer)', () => {
  const s = status.statusOf(engine('freelancer', '2027-02-04'), { currency: 'PHP', origin: 'typed', names: { ewallet: 'E-wallet' } });
  assert.strictEqual(s.state, 'warning');
  assert.strictEqual(s.level, 'bad');
  assert.strictEqual(s.reason.account, 'ewallet');
  assert.strictEqual(s.text.reason, 'E-wallet goes ₱1,500 below zero on 12 Mar');
  assert.ok(s.also.includes('later_on'));
});

test('a question the engine asks comes before the check-in and the plain safe line', () => {
  const r = clone(engine('mako_shape', '2026-11-25'));
  r.warnings.push({ account: 'bank', code: 'gain_to_ask', day: '2026-11-24', gain: 300000 });
  const s = status.statusOf(r, YEN);
  assert.strictEqual(s.state, 'question');
  assert.strictEqual(s.next.code, 'answer');
});

test('a warning code the status does not know is never dropped', () => {
  const r = clone(engine('mako_shape', '2026-11-25'));
  r.warnings.push({ account: 'bank', code: 'something_new' });
  const s = status.statusOf(r, YEN);
  assert.strictEqual(s.state, 'question');
  assert.strictEqual(s.reason.code, 'unknown_warning');
  assert.strictEqual(s.reason.warning, 'something_new');
});

test('notes only (another currency, a reopened account) sit under the state and do not change it', () => {
  const r = clone(engine('mako_shape', '2026-11-25'));
  r.warnings.push({ account: 'bank', code: 'income_other_currency' }, { account: 'bank', code: 'reopened' });
  const s = status.statusOf(r, YEN);
  assert.strictEqual(s.state, 'ok');
  assert.deepStrictEqual(s.also.slice().sort(), ['income_other_currency', 'reopened']);
});

test('pay late: the day it was due, and check in once it lands', () => {
  const s = status.statusOf(engine('late_pay', '2027-01-09'), Object.assign({}, YEN, { currency: scen('late_pay').currency }));
  assert.strictEqual(s.state, 'late');
  assert.strictEqual(s.reason.since, '2027-01-08');
  assert.strictEqual(s.next.code, 'check_in_when_it_lands');
});

test('things to tick off since the last check-in', () => {
  const r = clone(engine('mako_shape', '2026-11-25'));
  r.checkIn.toConfirm = [{ item: 'rent@2026-11-24', lands: '2026-11-24', amount: 80000, account: 'bank' }];
  const s = status.statusOf(r, YEN);
  assert.strictEqual(s.state, 'check');
  assert.deepStrictEqual(s.reason, { code: 'to_confirm', count: 1, since: '2026-11-20' });
  assert.strictEqual(s.text.reason, '1 thing to tick off since 20 Nov');
});

test('an old bank figure asks for a check-in (after staleDays, 7 unless set)', () => {
  const r = clone(engine('mako_shape', '2026-11-25'));
  r.accounts.bank.ageDays = 8;
  assert.strictEqual(status.statusOf(r, YEN).reason.code, 'old_figure');
  assert.strictEqual(status.statusOf(r, Object.assign({ staleDays: 10 }, YEN)).state, 'ok');
});

test('nothing safe: says when it turns safe, and with no fixed pay says what to do', () => {
  const r = clone(engine('mako_shape', '2026-11-25'));
  r.safeToSpend.headline = 0;
  const s = status.statusOf(r, YEN);
  assert.strictEqual(s.state, 'zero');
  assert.strictEqual(s.text.reason, 'Nothing\'s safe to spend until pay on 10 Dec');
  r.daysToNextPay = { days: null };
  const t = status.statusOf(r, YEN);
  assert.strictEqual(t.next.code, 'log_money_in');
});

test('every made-up situation and every ask day: one known state, never "ok" next to a shortfall or an account under its minimum', () => {
  const STATES = ['sample', 'empty', 'short', 'warning', 'set_aside', 'question', 'late', 'check', 'zero', 'no_free', 'ok'];
  let n = 0, refused = 0;
  for (const f of fs.readdirSync(SC).filter(x => x.endsWith('.json'))) {
    const sc = JSON.parse(fs.readFileSync(path.join(SC, f), 'utf8'));
    const days = [...new Set((sc.asks || []).filter(a => a.question !== 'refused').map(a => a.date + '|' + (a.at || '')))];
    for (const k of days) {
      const [d, at] = k.split('|');
      let r;
      try { r = lookahead(sc, d, { at: at || undefined }); } catch (e) { refused++; continue; }   // a copy the engine refuses is not shown
      const s = status.statusOf(r, { currency: sc.currency, origin: 'typed' });
      n++;
      assert.ok(STATES.includes(s.state), f + ' ' + d + ' ' + s.state);
      /* [BM2] money goes short when the real money does (short, below_minimum) or goals hold more than it can spare */
      const danger = !!r.safeToSpend.short || r.warnings.some(w => w.code === 'below_minimum' || w.code === 'set_aside_over');
      if (danger) assert.ok(s.level === 'bad', `${f} ${d}: ${s.state} while money goes short`);
      if (s.state === 'ok') assert.ok(r.safeToSpend.headline > 0 && !danger, f + ' ' + d);
      for (const part of ['state', 'reason']) assert.ok(typeof s.text[part] === 'string' && s.text[part] && !/undefined|NaN|null/.test(s.text[part]), `${f} ${d} ${part}: ${s.text[part]}`);
    }
  }
  assert.ok(n > 250 && refused < 20, `situations judged: ${n}, refused by the engine: ${refused}`);
});

test('the words are drafts for Mako\'s copy pass and follow VOICE: no full stop at the end, no dashes but the spaced hyphen', () => {
  for (const [k, w] of Object.entries(status.WORDS)) {
    assert.strictEqual(w.forMako, true, k);
    assert.ok(!/[.;!]$/.test(w.text) && !/[–—]/.test(w.text), k + ': ' + w.text);
  }
});

test('warnings are worded here from the engine\'s data, never its text: "below zero" with no minimum, days and months as VOICE', () => {
  const ctx = { currency: 'USD', names: { bank: 'Checking' } };
  const iso = /\d{4}-\d{2}/;
  const zero = status.warningText({ account: 'bank', code: 'below_minimum', day: '2027-01-05', amount: 1000, short: 1000, minimum: null, text: 'engine 2027-01-05' }, ctx);
  assert.strictEqual(zero, 'Checking goes $10 below zero on 5 Jan');
  const min = status.warningText({ account: 'bank', code: 'below_minimum', day: '2027-01-05', amount: 1000, short: 1000, minimum: 5000, text: 'x' }, ctx);
  assert.strictEqual(min, 'Checking goes $10 below its minimum of $50 on 5 Jan');
  const later = status.laterText({ account: 'bank', day: '2027-02-01', balance: -2500, amount: 2500, minimum: null, text: 'Later on: Checking goes below zero in 2027-02' }, ctx);
  assert.strictEqual(later, 'Later on: Checking goes below zero in Feb 2027');
  const again = status.warningText({ account: 'bank', code: 'check_again', day: '2026-12-03', text: 'raw 2026-12-03' }, ctx);
  assert.ok(!iso.test(again) && /3 Dec/.test(again), again);
  for (const code of ['reopened', 'gain_to_ask', 'minimum_other_currency', 'card_other_currency', 'loan_other_currency', 'something_new']) {
    const s = status.warningText({ account: 'bank', card: 'visa', loan: 'car', code, day: '2026-12-03', gain: 100, text: 'raw 2026-12-03' }, ctx);
    assert.ok(s && !iso.test(s) && !/raw/.test(s) && !/[.;!]$/.test(s), code + ': ' + s);
  }
  // the status line under a minimum of none says below zero too
  const r = engine('mako_shape', '2026-11-25');
  r.warnings = [{ account: Object.keys(r.accounts)[0], code: 'below_minimum', day: '2026-12-07', amount: 12000, short: 12000, minimum: null }];
  const s = status.statusOf(r, YEN);
  assert.match(s.text.reason, /goes ¥12,000 below zero on 7 Dec/);
});

test('no Free to spend and no budget line: Home asks for everyday spending in place of "Fine for now" (north star F1)', () => {
  const r = clone(engine('mako_shape', '2026-11-25'));
  r.period = { start: '2026-11-10', end: '2026-12-09', free: null, lines: [] };
  const s = status.statusOf(r, YEN);
  assert.strictEqual(s.state, 'no_free');
  assert.strictEqual(s.level, 'wait');
  assert.strictEqual(s.text.reason, 'Add what you spend on everyday things so safe to spend leaves room for it');
  assert.deepStrictEqual(s.next, { code: 'set_free' });
  assert.strictEqual(s.text.next, 'Set Free to spend');
  // Free to spend set, or a budget line with an amount: fine again
  r.period.free = { amount: 40000, counts: 40000, left: 40000 };
  assert.strictEqual(status.statusOf(r, YEN).state, 'ok');
  r.period.free = null; r.period.lines = [{ id: 'food', amount: 30000 }];
  assert.strictEqual(status.statusOf(r, YEN).state, 'ok');
  // anything that needs doing first still wins
  r.period.lines = []; r.safeToSpend.headline = 0;
  assert.strictEqual(status.statusOf(r, YEN).state, 'zero');
});
/* [BM2] goals holding more than the bank can spare: their own warning, worded here from the engine's data, never
   "goes below zero"; the real money is fine, so the state is never "short". The numbers QC case: Trip 254,001 set aside
   in Main bank, which can spare 254,000 on 5 Jan. */
const goalOver = () => {
  const r = clone(engine('mako_shape', '2026-11-25'));
  r.safeToSpend.headline = 0; r.safeToSpend.shortfall = 1; r.safeToSpend.short = null;
  r.warnings = r.warnings.filter(w => w.code !== 'below_minimum');
  r.warnings.push({ account: 'bank', code: 'set_aside_over', day: '2027-01-05', amount: 1, places: [{ place: 'trip', name: 'Trip' }] });
  return r;
};
test('goals over what the bank can spare: their own state and words, never short or below zero [BM2]', () => {
  const r = goalOver();
  const s = status.statusOf(r, Object.assign({ names: { bank: 'Main bank' } }, YEN));
  assert.strictEqual(s.state, 'set_aside');
  assert.strictEqual(s.level, 'bad');
  assert.strictEqual(s.text.reason, 'Trip\'s money is ¥1 more than Main bank can spare on 5 Jan');
  assert.ok(!/below zero|short/i.test(s.text.state + ' ' + s.text.reason + ' ' + s.text.next), JSON.stringify(s.text));
  assert.strictEqual(status.warningText(r.warnings[r.warnings.length - 1], { currency: 'JPY', names: { bank: 'Main bank' } }), 'Trip\'s money is ¥1 more than Main bank can spare on 5 Jan');
  const two = Object.assign({}, r.warnings[r.warnings.length - 1], { places: [{ place: 'trip', name: 'Trip' }, { place: 'pc', name: 'New laptop' }], later: { day: '2027-01-27', amount: 3000 } });
  assert.strictEqual(status.warningText(two, { currency: 'JPY', names: { bank: 'Main bank' } }), 'The money set aside for Trip and New laptop is ¥1 more than Main bank can spare on 5 Jan');
  assert.strictEqual(status.laterLowText(two, { currency: 'JPY', names: { bank: 'Main bank' } }), 'Later on: the money set aside for Trip and New laptop is ¥3,000 more than Main bank can spare on 27 Jan');
});
test('a shortfall with no real money short (goals or plan lines) is never the "short" state [BM2]', () => {
  const r = goalOver();
  r.warnings = r.warnings.filter(w => w.code !== 'set_aside_over');
  const s = status.statusOf(r, YEN);
  assert.notStrictEqual(s.state, 'short');
  /* [LISTFIX A2] with no goal over and the bank not under, the shortfall is the plan's: said, with its amount */
  assert.strictEqual(s.state, 'plan_over');
  assert.ok(/^Your plan lines need .+ more than your bank can spare/.test(s.text.reason), s.text.reason);
  assert.strictEqual(s.text.next, 'Lower a plan line, or move money in');
});

run('status.js');
