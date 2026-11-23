/* screens/provenance.js: typed or sample on every shown value; sample never shown as the person's (sweep2_repeats A3). */
'use strict';
const assert = require('assert');
const { test, run } = require('./harness');
const pv = require('../provenance.js');

test('a value carries where it came from, and only a known origin', () => {
  const v = pv.mark(250000, 'typed');
  assert.deepStrictEqual({ value: v.value, from: v.from }, { value: 250000, from: 'typed' });
  assert.ok(Object.isFrozen(v));
  for (const o of ['typed', 'imported', 'worked', 'sample']) assert.strictEqual(pv.mark(1, o).from, o);
  assert.throws(() => pv.mark(1, 'guess'), /origin/);
  assert.throws(() => pv.mark(1), /origin/);
});

test('a figure worked from the person\'s values is theirs; from sample values it is sample', () => {
  assert.strictEqual(pv.combine([pv.mark(1, 'typed'), pv.mark(2, 'imported'), pv.mark(3, 'worked')]), 'worked');
  assert.strictEqual(pv.combine([pv.mark(1, 'sample'), pv.mark(2, 'sample')]), 'sample');
});

test('sample and the person\'s values never mix into one figure', () => {
  assert.throws(() => pv.combine([pv.mark(300000, 'sample'), pv.mark(250000, 'typed')]), /mix/);
  assert.throws(() => pv.combine([]), /nothing/);
});

test('a sample value on the person\'s screen is refused, and the person\'s value on a sample screen too', () => {
  assert.throws(() => pv.display(pv.mark(300000, 'sample'), { screen: 'typed' }), /sample/);
  assert.throws(() => pv.display(pv.mark(250000, 'typed'), { screen: 'sample' }), /sample/);
  assert.throws(() => pv.display(250000, { screen: 'typed' }), /mark/);
});

test('on a sample screen every value says Sample; on the person\'s screen none does', () => {
  const s = pv.display(pv.mark(300000, 'sample'), { screen: 'sample' });
  assert.deepStrictEqual(s, { value: 300000, from: 'sample', sample: true, badge: pv.BADGE });
  const t = pv.display(pv.mark(250000, 'typed'), { screen: 'typed' });
  assert.deepStrictEqual(t, { value: 250000, from: 'typed', sample: false, badge: null });
});

test('the screen origin is typed or sample, nothing in between', () => {
  assert.throws(() => pv.display(pv.mark(1, 'typed'), { screen: 'worked' }), /screen/);
  assert.throws(() => pv.display(pv.mark(1, 'typed'), {}), /screen/);
});

test('the move keeps the person\'s records and never moves sample ones as real', () => {
  const recs = [{ id: 'a', from: 'typed' }, { id: 'b', from: 'sample' }, { id: 'c', from: 'imported' }];
  assert.deepStrictEqual(pv.keepForMove(recs).map(r => r.id), ['a', 'c']);
  assert.throws(() => pv.keepForMove([{ id: 'd' }]), /origin/);
});

test('the engine result gets one origin for all its figures', () => {
  const res = { safeToSpend: { headline: 182000 } };
  const m = pv.markResult(res, 'sample');
  assert.strictEqual(m.from, 'sample');
  assert.strictEqual(m.value, res);
  assert.throws(() => pv.markResult(res, 'imported'), /typed or sample/);
});

run('provenance.js');
