/* screens/money.js: the one amount formatter. All amounts are made up. */
'use strict';
const assert = require('assert');
const { test, run } = require('./harness');
const money = require('../money.js');
const ref = require('../../foundation_review/ref/lookahead_ref.js');

const M = '−⁠';   // the minus sign joined to the amount, as the app writes it today (ui0.js MINUS)

test('whole minor units in, the currency sign and grouped digits out', () => {
  assert.strictEqual(money.format(123450, 'USD'), '$1,234.50');
  assert.strictEqual(money.format(5, 'USD'), '$0.05');
  assert.strictEqual(money.format(0, 'JPY'), '¥0');
  assert.strictEqual(money.format(1234567, 'JPY'), '¥1,234,567');
  assert.strictEqual(money.format(1999, 'EUR'), '€19.99');
  assert.strictEqual(money.format(1999, 'GBP'), '£19.99');
  assert.strictEqual(money.format(1999, 'PHP'), '₱19.99');
});

test('a sign made of letters gets a space after it', () => {
  assert.strictEqual(money.format(1999, 'CHF'), 'CHF 19.99');
});

test('minus is U+2212 joined to the amount by U+2060, never a hyphen', () => {
  assert.strictEqual(money.format(-1500, 'JPY'), M + '¥1,500');
  assert.strictEqual(money.format(-5, 'USD'), M + '$0.05');
  assert.ok(!money.format(-5, 'USD').includes('-'));
});

test('a whole amount reads whole on its own, cents only when it has them', () => {
  assert.strictEqual(money.format(120000, 'USD'), '$1,200');
  assert.strictEqual(money.format(120000, 'USD', { cents: true }), '$1,200.00');
});

test('yen never shows decimals, even when cents are asked for', () => {
  assert.strictEqual(money.format(1500, 'JPY', { cents: true }), '¥1,500');
});

test('cents dropped from an amount that has them is refused, never rounded away', () => {
  assert.throws(() => money.format(8001, 'USD', { cents: false }), /cents/);
});

test('anything that is not a whole number of minor units is refused', () => {
  for (const bad of [12.5, NaN, Infinity, '1200', null, undefined, 2 ** 60]) assert.throws(() => money.format(bad, 'USD'), /minor units/);
});

test('a currency code that is not three capital letters is refused', () => {
  for (const bad of ['usd', '$', '', 'DOLLAR', undefined]) assert.throws(() => money.format(100, bad), /currency/);
});

test('minor units per code come from ISO 4217 and agree with the engine', () => {
  for (const code of ['JPY', 'PHP', 'USD', 'EUR', 'GBP', 'CHF']) assert.strictEqual(10 ** money.digits(code), ref.minor(1, code), code);
  assert.strictEqual(money.digits('KRW'), 0);
  assert.strictEqual(money.digits('BHD'), 3);
  assert.strictEqual(money.format(1234, 'BHD'), 'BHD 1.234');
});

test('the digits match the engine\'s own way of writing an amount', () => {
  for (const code of ['JPY', 'USD', 'EUR']) for (const n of [0, 7, 99, 100, 101, 123456, -123456, 100000000]) {
    assert.strictEqual(money.format(n, code, { cents: true, sign: false }).replace(M, '-'), ref.fmt(n, code), code + ' ' + n);
  }
});

test('one screen, one way of writing cents: any amount with cents gives every amount cents', () => {
  const f = money.formatter('USD', [12000, 8001]);
  assert.strictEqual(f(12000), '$120.00');
  assert.strictEqual(f(8001), '$80.01');
  const g = money.formatter('USD', [12000, 8000, -500]);
  assert.strictEqual(g(12000), '$120');
  assert.strictEqual(g(-500), M + '$5');
});

test('an amount the screen did not declare, with cents, makes the whole-number formatter refuse', () => {
  const g = money.formatter('USD', [12000]);
  assert.throws(() => g(8001), /cents/);
});

test('reading a typed amount: commas, a sign and spaces are fine, the result is whole minor units', () => {
  assert.deepStrictEqual(money.parse('1,234.5', 'USD'), { ok: true, minor: 123450 });
  assert.deepStrictEqual(money.parse('$ 12', 'USD'), { ok: true, minor: 1200 });
  assert.deepStrictEqual(money.parse(' 1500 ', 'JPY'), { ok: true, minor: 1500 });
  assert.deepStrictEqual(money.parse('0.1', 'USD'), { ok: true, minor: 10 });
  assert.deepStrictEqual(money.parse('.5', 'USD'), { ok: true, minor: 50 });
});

test('full-width digits from a Japanese keyboard read the same', () => {
  assert.deepStrictEqual(money.parse('１，２３４', 'JPY'), { ok: true, minor: 1234 });
});

test('more decimals than the currency has are refused, never rounded (12.345 is not 12.34)', () => {
  assert.deepStrictEqual(money.parse('12.345', 'USD'), { ok: false, reason: 'decimals' });
  assert.deepStrictEqual(money.parse('15.5', 'JPY'), { ok: false, reason: 'decimals' });
});

test('a comma not in a thousands place is refused with both readings, never read one way silently (qc-numbers run 1 B4)', () => {
  assert.deepStrictEqual(money.parse('1,0000', 'JPY'), { ok: false, reason: 'commas', means: [1000, 10000] });
  assert.deepStrictEqual(money.parse('10,00', 'JPY'), { ok: false, reason: 'commas', means: [1000, 10000] });
  assert.deepStrictEqual(money.parse('1,00.50', 'USD'), { ok: false, reason: 'commas', means: [10050, 100050] });
  assert.deepStrictEqual(money.parse('1,000', 'JPY'), { ok: true, minor: 1000 });
  assert.deepStrictEqual(money.parse('12,345,678', 'JPY'), { ok: true, minor: 12345678 });
  assert.deepStrictEqual(money.parse('1234', 'JPY'), { ok: true, minor: 1234 });
});

test('empty, not a number, minus and too big each say why', () => {
  assert.deepStrictEqual(money.parse('', 'USD'), { ok: false, reason: 'empty' });
  assert.deepStrictEqual(money.parse('abc', 'USD'), { ok: false, reason: 'not_a_number' });
  assert.deepStrictEqual(money.parse('1.2.3', 'USD'), { ok: false, reason: 'not_a_number' });
  assert.deepStrictEqual(money.parse('-5', 'USD'), { ok: false, reason: 'minus' });
  assert.deepStrictEqual(money.parse('-5', 'USD', { allowMinus: true }), { ok: true, minor: -500 });
  assert.deepStrictEqual(money.parse('−5', 'USD', { allowMinus: true }), { ok: true, minor: -500 });
  assert.deepStrictEqual(money.parse('10000000000000', 'USD'), { ok: false, reason: 'too_big' });
});

test('what an input box shows: plain digits with the currency\'s own decimals', () => {
  assert.strictEqual(money.toInput(123450, 'USD'), '1234.50');
  assert.strictEqual(money.toInput(120000, 'USD'), '1200');
  assert.strictEqual(money.toInput(1500, 'JPY'), '1500');
  assert.strictEqual(money.toInput(-5, 'USD'), '-0.05');
});

test('written then read back gives the same minor units', () => {
  for (const [n, code] of [[123450, 'USD'], [1500, 'JPY'], [7, 'EUR'], [100000000, 'JPY'], [-2550, 'USD']]) {
    assert.deepStrictEqual(money.parse(money.format(n, code, { cents: true }), code, { allowMinus: true }), { ok: true, minor: n });
    assert.deepStrictEqual(money.parse(money.toInput(n, code), code, { allowMinus: true }), { ok: true, minor: n });
  }
});

test('money.js offers writing and reading only: no adding, splitting or rounding of amounts', () => {
  assert.deepStrictEqual(Object.keys(money).sort(), ['MINUS', 'digits', 'format', 'formatter', 'hasCents', 'parse', 'sumLine', 'symbol', 'toInput']);
});

test('a sum line (numbers review S4): the engine\'s parts written with one minus sign, no "- 0 (minimum)", one way of writing cents', () => {
  const M = '\u2212';
  assert.strictEqual(money.sumLine([{ label: 'Main bank today', amount: 312000 }, { label: 'Trip, kept in it', amount: -100000 }, { label: 'minimum', amount: 0 }], 212000, 'JPY'),
    `¥312,000 (Main bank today) ${M} ¥100,000 (Trip, kept in it) = ¥212,000`);
  assert.strictEqual(money.sumLine([{ label: 'Bank today', amount: 150000 }, { label: 'Visa, all owed, paid 5 Jan', amount: -81240 }, { label: 'minimum', amount: -5000 }], 63760, 'USD'),
    `$1,500.00 (Bank today) ${M} $812.40 (Visa, all owed, paid 5 Jan) ${M} $50.00 (minimum) = $637.60`);
  assert.strictEqual(money.sumLine([{ label: 'Bank today', amount: 1000 }, { label: 'Pay', amount: 2000 }, { label: 'Rent', amount: -5000 }], -2000, 'JPY'),
    `¥1,000 (Bank today) + ¥2,000 (Pay) ${M} ¥5,000 (Rent) = ${money.MINUS}¥2,000`);
  for (const s of [money.sumLine([{ label: 'a', amount: -5 }], -5, 'JPY')]) assert.ok(!/ - /.test(s) && !s.includes('-'), s);
});

test('[BL4] one cents rule for a whole screen: hasCents, and a sum line told the screen has cents', () => {
  assert.strictEqual(money.hasCents(15000, 'USD'), false);
  assert.strictEqual(money.hasCents(3750, 'USD'), true);
  assert.strictEqual(money.hasCents(3750, 'JPY'), false);
  assert.strictEqual(money.sumLine([{ label: 'Bank today', amount: 15000 }], 15000, 'USD'), '$150 (Bank today) = $150');
  assert.strictEqual(money.sumLine([{ label: 'Bank today', amount: 15000 }], 15000, 'USD', { cents: true }), '$150.00 (Bank today) = $150.00');
  assert.strictEqual(money.sumLine([{ label: 'Bank today', amount: 1000 }], 1000, 'JPY', { cents: true }), '¥1,000 (Bank today) = ¥1,000');
});

run('money.js');
