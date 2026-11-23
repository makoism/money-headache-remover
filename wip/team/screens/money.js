/* The one amount formatter every screen uses (DECISIONS_ROUND2 C, sweep2_repeats A11 "$180" next to "$180.00", B3, B4).
   Amounts come in as whole minor units of an ISO 4217 currency (cents, or yen), the shape the engine returns. This file
   writes them and reads them back from a box. It never adds, splits or rounds an amount: that is the engine's job.
   Plain browser JavaScript, no dependencies. In a page it is BurrowScreens.money; in node, require('./money.js'). */
(function (root, make) {
  const m = make();
  if (typeof module === 'object' && module.exports) module.exports = m;
  else (root.BurrowScreens = root.BurrowScreens || {}).money = m;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /* the minus sign in front of an amount, joined to it by a word joiner (U+2060, no width, no break) so a line never ends
     on the sign with the amount on the next line (QC round 7, ui0.js MINUS). Screen readers and copy and paste skip it. */
  const MINUS = '−⁠';
  /* the signs people know. Any other code is written as its letters and a space ("CHF 19.99", "BHD 1.234"). */
  const SIGNS = { USD: '$', JPY: '¥', EUR: '€', GBP: '£', PHP: '₱', KRW: '₩', INR: '₹', CNY: '¥' };
  /* whole units a box takes at most: 12 digits, so every amount stays an exact whole number of minor units */
  const MAX_WHOLE_DIGITS = 12;

  function code3(code) {
    if (typeof code !== 'string' || !/^[A-Z]{3}$/.test(code)) throw new Error('money: currency must be an ISO 4217 code like "USD", got ' + JSON.stringify(code));
    return code;
  }
  const digitsCache = {};
  /* minor units per currency, from ISO 4217 as the platform knows it (JPY 0, USD 2, BHD 3) */
  function digits(code) {
    code3(code);
    if (!(code in digitsCache)) {
      let d = 2;
      try { d = new Intl.NumberFormat('en', { style: 'currency', currency: code }).resolvedOptions().maximumFractionDigits; } catch (e) { d = 2; }
      digitsCache[code] = d;
    }
    return digitsCache[code];
  }
  function symbol(code) { code3(code); return SIGNS[code] || code + ' '; }
  function checkMinor(n) {
    if (typeof n !== 'number' || !Number.isSafeInteger(n)) throw new Error('money: amounts are whole minor units (an exact integer), got ' + String(n));
    return n;
  }
  /* splits |n| into its whole and minor digits as text, so nothing goes through a decimal number */
  function parts(n, d) {
    const s = String(Math.abs(n)).padStart(d + 1, '0');
    return { whole: s.slice(0, s.length - d), frac: d ? s.slice(s.length - d) : '' };
  }
  const hasCents = (n, d) => d > 0 && /[1-9]/.test(parts(n, d).frac);
  const group = w => w.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  /* format(minor, code, { cents, sign })
     cents: true writes every decimal the currency has; false writes whole units and refuses an amount that has cents
     (they are never dropped); left out, cents show only when the amount has them. sign: false leaves out the currency sign. */
  function format(n, code, opts) {
    opts = opts || {};
    checkMinor(n);
    const d = digits(code);
    const p = parts(n, d);
    let cents = opts.cents;
    if (cents === undefined) cents = hasCents(n, d);
    if (cents === false && hasCents(n, d)) throw new Error('money: ' + n + ' ' + code + ' has cents, but the screen asked for whole amounts. Build the formatter from every amount on the screen');
    const body = group(p.whole) + (cents && d ? '.' + p.frac : '');
    return (n < 0 ? MINUS : '') + (opts.sign === false ? '' : symbol(code)) + body;
  }

  /* formatter(code, amounts): one way of writing cents for one screen or one sentence. When any amount on it has cents,
     every amount is written with cents (€20.00 beside €80.01, never €20); otherwise all are whole. */
  function formatter(code, amounts) {
    const d = digits(code);
    const cents = (amounts || []).some(n => hasCents(checkMinor(n), d));
    return (n, opts) => format(n, code, Object.assign({}, opts, { cents }));
  }

  /* what an input box shows: plain digits, a hyphen for minus, decimals only when the amount has them */
  function toInput(n, code) {
    checkMinor(n);
    const d = digits(code), p = parts(n, d);
    return (n < 0 ? '-' : '') + p.whole + (hasCents(n, d) ? '.' + p.frac : '');
  }

  /* parse(text, code, { allowMinus }): what a person typed, as whole minor units, or the reason it can't be read:
     'empty', 'not_a_number', 'decimals' (more than the currency has, never rounded), 'minus', 'too_big' */
  function parse(text, code, opts) {
    opts = opts || {};
    const d = digits(code);
    let s = String(text == null ? '' : text).normalize('NFKC').replace(/⁠/g, '').replace(/−/g, '-').replace(/\s+/g, '');
    const sign = symbol(code).trim();
    s = s.split(sign).join('').split(code).join('');
    if (s === '') return { ok: false, reason: 'empty' };
    const m = /^(-)?(\d[\d,]*)?(?:\.(\d*))?$/.exec(s);
    if (!m || (!m[2] && !m[3])) return { ok: false, reason: 'not_a_number' };
    const whole = (m[2] || '0').replace(/,/g, '').replace(/^0+(?=\d)/, ''), frac = m[3] || '';
    if (frac.length > d) return { ok: false, reason: 'decimals' };
    if (whole.length > MAX_WHOLE_DIGITS) return { ok: false, reason: 'too_big' };
    if (m[1] && !opts.allowMinus) return { ok: false, reason: 'minus' };
    const minor = Number(whole + frac.padEnd(d, '0'));
    return { ok: true, minor: m[1] && minor !== 0 ? -minor : minor };
  }

  /* sumLine(parts, result, code): the engine's sum as a person reads it (numbers review S4), "¥312,000 (Main bank today)
     − ¥100,000 (Trip) = ¥212,000". parts: [{ label, amount }] in order, signed; a part of zero is left out (no
     "- 0 (minimum)"). One minus sign (U+2212) everywhere, one way of writing cents for the whole line. It writes the
     engine's figures only: nothing is added up here. opts.cents true writes every amount with cents (the screen has some). */
  function sumLine(parts, result, code, opts) {
    const shown = (parts || []).filter(p => p.amount !== 0);
    /* opts.cents: the screen's own cents rule (BL4), so the sum is written the way every other amount on it is */
    const f = opts && opts.cents ? (n => format(n, code, { cents: true })) : formatter(code, shown.map(p => p.amount).concat([result]));
    const label = p => ' (' + String(p.label).replace(/[()]/g, '') + ')';
    const body = shown.map((p, i) => (i === 0 ? f(p.amount) : (p.amount < 0 ? ' \u2212 ' + f(-p.amount) : ' + ' + f(p.amount))) + label(p)).join('');
    return body + ' = ' + f(result);
  }

  /* hasCents(minor, code): whether the amount has a part below one whole unit (for one cents rule per screen, BL4) */
  function hasCentsOf(n, code) { return hasCents(checkMinor(n), digits(code)); }

  return { MINUS, digits, symbol, format, formatter, hasCents: hasCentsOf, toInput, parse, sumLine };
});
