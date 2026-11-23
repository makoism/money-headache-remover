/* screens/inputs.js: one input behaviour. The pure part runs here; the tap and the typing run in Chromium (browser.test.js). */
'use strict';
const assert = require('assert');
const { test, run } = require('./harness');
const inputs = require('../inputs.js');

test('a typed amount is kept as whole minor units and the box shows it plainly', () => {
  assert.deepStrictEqual(inputs.commit('1,250.5', { code: 'USD' }), { ok: true, minor: 125050, value: '1250.50' });
  assert.deepStrictEqual(inputs.commit('250', { code: 'JPY' }), { ok: true, minor: 250, value: '250' });
});

test('a box that can\'t be read keeps what was typed and says what happened and what to do', () => {
  const r = inputs.commit('12.345', { code: 'USD' });
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.reason, 'decimals');
  assert.strictEqual(r.value, '12.345');
  assert.strictEqual(r.message, 'That has too many decimals. Use 2 at most');
  assert.strictEqual(inputs.commit('15.5', { code: 'JPY' }).message, 'Yen has no decimals. Type a whole amount');
});

test('an empty box is fine when the field is optional, and asked for when it is not', () => {
  assert.deepStrictEqual(inputs.commit('  ', { code: 'USD', optional: true }), { ok: true, minor: null, value: '' });
  assert.strictEqual(inputs.commit('', { code: 'USD' }).reason, 'empty');
});

test('every reason the money reader gives has words, drafts for Mako\'s copy pass', () => {
  for (const r of ['empty', 'not_a_number', 'decimals', 'decimals_none', 'minus', 'too_big']) {
    assert.ok(inputs.ERRORS[r] && inputs.ERRORS[r].forMako === true, r);
    assert.ok(!/[–—!]/.test(inputs.ERRORS[r].text), r);
  }
});

test('bind is there for pages, and needs an input box', () => {
  assert.strictEqual(typeof inputs.bind, 'function');
  assert.throws(() => inputs.bind(null), /input/);
});

run('inputs.js');
