/* screens/names.js: one name per figure, one figure per name (sweep2_repeats A8). */
'use strict';
const assert = require('assert');
const { test, run } = require('./harness');
const names = require('../names.js');
/* the one engine (engine/lookahead.js) on the scenario files, turned into saved books by the engine's converter */
const { lookahead: engineLookahead } = require('../../engine/lookahead.js');
const { convert } = require('../../engine/test/scenario_to_book.js');
const lookahead = (sc, d) => { const { book, opts } = convert(sc); return engineLookahead(book, d, opts); };

const keys = Object.keys(names.NAMES);
const STATES = ['decided', 'in use', 'for Mako'];

test('every name says its label, the figure it names, how settled it is and where that comes from', () => {
  assert.ok(keys.length >= 15);
  for (const k of keys) {
    const n = names.NAMES[k];
    assert.ok(typeof n.label === 'string' && n.label, k + ' label');
    assert.ok(Array.isArray(n.figures) && n.figures.length, k + ' figures');
    assert.ok(STATES.includes(n.state), k + ' state ' + n.state);
    assert.ok(typeof n.source === 'string' && n.source, k + ' source');
    if (n.state === 'for Mako') assert.ok(Array.isArray(n.choices) && n.choices.length >= 2 && n.choices.includes(n.label), k + ' choices hold the label in use');
  }
});

test('one name, one figure: no label is used twice, also counting the wording used when there is no fixed pay', () => {
  const seen = {};
  for (const k of keys) for (const l of [names.NAMES[k].label].concat(Object.values(names.NAMES[k].when || {}))) {
    const low = l.toLowerCase();
    assert.ok(!seen[low], `"${l}" names both ${seen[low]} and ${k}`);
    seen[low] = k;
  }
});

test('one figure, one name: no figure is named by two entries', () => {
  const seen = {};
  for (const k of keys) for (const f of names.NAMES[k].figures) {
    assert.ok(!seen[f], `${f} is named by both ${seen[f]} and ${k}`);
    seen[f] = k;
  }
});

test('the figures the task names are all in the table', () => {
  for (const k of ['bankToday', 'bankAfterCards', 'safeToSpend', 'freeToSpendLeft', 'notPlacedYet', 'setAside', 'owed', 'total', 'period']) assert.ok(names.NAMES[k], k);
});

test('labels follow VOICE: sentence case, no full stop or colon at the end, no dashes, glossary words exact', () => {
  for (const k of keys) for (const l of [names.NAMES[k].label].concat(Object.values(names.NAMES[k].when || {}))) {
    assert.ok(/^[A-Z]/.test(l), l);
    assert.ok(!/[.:;!]$/.test(l), l);
    assert.ok(!/[–—]/.test(l), l);
    assert.ok(!/\b(income|allocation|unassigned|liabilities|play money|fun money|pot)\b/i.test(l), l);
    const rest = l.slice(1).replace(/\bFree to spend\b/g, '');
    assert.ok(!/[A-Z]/.test(rest), 'sentence case: ' + l);
  }
  assert.strictEqual(names.label('freeToSpendLeft').indexOf('Free to spend'), 0);
  assert.strictEqual(names.label('total'), 'Total');
  assert.strictEqual(names.label('notPlacedYet'), 'Not placed yet');
});

test('label() gives the one label and refuses a name that is not in the table', () => {
  assert.strictEqual(names.label('safeToSpend'), names.NAMES.safeToSpend.label);
  assert.throws(() => names.label('leftToSpend'), /not in the name table/);
});

test('with no fixed pay, the due list uses its own wording', () => {
  assert.strictEqual(names.label('dueBeforeNextPay'), 'Due before next pay');
  assert.strictEqual(names.label('dueBeforeNextPay', { noFixedPay: true }), 'Due in the next 30 days');
});

test('byFigure finds the one name for an engine figure', () => {
  assert.strictEqual(names.byFigure('safeToSpend.headline'), 'safeToSpend');
  assert.strictEqual(names.byFigure('accounts.*.bank'), 'bankToday');
  assert.strictEqual(names.byFigure('nothing.here'), null);
});

test('check() catches a screen that puts a label on a figure it does not name', () => {
  assert.deepStrictEqual(names.check([{ label: names.label('safeToSpend'), figure: 'safeToSpend.headline' }]), []);
  const bad = names.check([{ label: names.label('safeToSpend'), figure: 'accounts.*.headroom' }, { label: 'Left', figure: 'safeToSpend.headline' }]);
  assert.strictEqual(bad.length, 2);
  assert.match(bad[0], /names safeToSpend\.headline/);
  assert.match(bad[1], /not in the name table/);
});

/* every figure the table names is a field the engine really returns, in at least one made-up situation; the ones the
   engine does not return yet are marked engine: false and listed, so nobody wires a screen to a field that is not there */
test('every figure with engine: true is in the engine result; the missing ones are listed', () => {
  const results = [['mako_shape', '2026-11-25'], ['freelancer', '2027-02-04'], ['goal_removed', '2027-01-08'], ['loans_and_carried', '2026-12-26'], ['opening_free_typed', '2026-12-05']]
    .map(([f, d]) => lookahead(require('../../foundation_review/scenarios/' + f + '.json'), d, {}));
  const strict = r => p => { const seg = p.split('.'); let o = r; for (const s of seg) { if (o == null) return false; if (s === '*') { const v = Object.values(o).find(x => x && typeof x === 'object'); if (!v) return false; o = v; } else o = o[s]; } return o !== undefined; };
  for (const k of keys) {
    const n = names.NAMES[k];
    for (const f of n.figures) {
      const found = results.some(r => strict(r)(f));
      if (n.engine === false) assert.ok(!found, `${k}: ${f} is in the engine result now, set engine: true`);
      else assert.ok(found, `${k}: ${f} is not in any engine result`);
    }
  }
  assert.deepStrictEqual(names.notInEngine().sort(), []);
  assert.deepStrictEqual(names.NAMES.freeToSpendLeft.figures, ['period.free.left']);
});

test('a day reads "10 Nov", a period "10 Nov to 9 Dec"', () => {
  assert.strictEqual(names.dayLabel('2026-11-10'), '10 Nov');
  assert.strictEqual(names.dayLabel('2026-12-01'), '1 Dec');
  assert.strictEqual(names.periodLabel('2026-11-10', '2026-12-09'), '10 Nov to 9 Dec');
});

test('a period across the new year shows both years', () => {
  assert.strictEqual(names.periodLabel('2026-12-28', '2027-01-27'), '28 Dec 2026 to 27 Jan 2027');
});

test('a day that is not a real YYYY-MM-DD, or a period that ends before it starts, is refused', () => {
  for (const bad of ['2026-13-01', '2026-11-31', '10 Nov', '', null]) assert.throws(() => names.dayLabel(bad), /day/);
  assert.throws(() => names.periodLabel('2026-12-09', '2026-11-10'), /ends before/);
});

test('forMako() lists every undecided name with its choices and source, for the copy pass', () => {
  const list = names.forMako();
  assert.ok(list.length > 0);
  for (const x of list) { assert.ok(x.key && x.label && x.choices && x.source); assert.strictEqual(names.NAMES[x.key].state, 'for Mako'); }
});

test('a month as VOICE: "Feb 2027", never "2027-02"', () => {
  assert.strictEqual(names.monthLabel('2027-02-01'), 'Feb 2027');
  assert.strictEqual(names.monthLabel('2026-12-31'), 'Dec 2026');
  assert.throws(() => names.monthLabel('2027-02'), /day/);
});

/* several days in one phrase, as VOICE says: "10 and 11 Dec", "8 and 12 Jan", "11 Dec, 8 Jan and 12 Jan" */
test('dayList writes several days once each, the month once when they share it', () => {
  assert.strictEqual(names.dayList(['2026-12-10']), '10 Dec');
  assert.strictEqual(names.dayList(['2026-12-10', '2026-12-11']), '10 and 11 Dec');
  assert.strictEqual(names.dayList(['2027-01-08', '2027-01-10', '2027-01-12']), '8, 10 and 12 Jan');
  assert.strictEqual(names.dayList(['2026-12-11', '2027-01-08', '2027-01-12']), '11 Dec, 8 Jan and 12 Jan');
  assert.strictEqual(names.dayList(['2026-12-11', '2027-01-08'], true), '11 Dec 2026 and 8 Jan 2027');
  assert.strictEqual(names.dayList([]), '');
  assert.deepStrictEqual(names.NAMES.bankAfterCards.figures, ['bankAfterCards.*.amount']);
});

run('names.js');
