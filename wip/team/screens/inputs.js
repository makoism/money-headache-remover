/* One input behaviour for every box (DECISIONS_ROUND2 C, sweep2_repeats A11: "$1,212", "TripLisbon"). The first tap or
   click into a box selects what is in it, so what is typed next replaces the old value instead of adding to it. A
   second tap while the box is still open puts the caret where it lands, for a small fix.

   Amount boxes also read what was typed through money.js when the box is left (or Enter is pressed): whole minor units,
   never rounded. A box that can't be read keeps the typed text and says what happened and what to do. Escape puts the
   old value back.

   bind(input, { kind: 'amount' | 'text', code, optional, onValue(minor | text), onError(result) })
   Plain browser JavaScript. In a page it is BurrowScreens.inputs (load money.js first). */
(function (root, make) {
  const dep = n => (typeof module === 'object' && module.exports ? require('./' + n + '.js') : root.BurrowScreens[n]);
  const m = make(dep('money'));
  if (typeof module === 'object' && module.exports) module.exports = m;
  else (root.BurrowScreens = root.BurrowScreens || {}).inputs = m;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (money) {
  'use strict';

  /* words for a box that can't be read: drafts for Mako's copy pass (VOICE: what happened, then what to do) */
  const E = text => ({ text, forMako: true });
  const ERRORS = {
    empty: E('This one needs an amount. Type 0 if there is none'),
    not_a_number: E('That isn\'t an amount. Type digits only'),
    decimals: E('That has too many decimals. Use {digits} at most'),
    decimals_none: E('{name} has no decimals. Type a whole amount'),
    minus: E('That can\'t be below zero. Type it without the minus'),
    too_big: E('That amount is too big. Check the digits'),
  };
  const CURRENCY_NAMES = { JPY: 'Yen', KRW: 'Won' };

  /* what leaving a box does with its text, as data (the part node can test) */
  function commit(text, opts) {
    opts = opts || {};
    const raw = String(text == null ? '' : text);
    if (opts.optional && !raw.trim()) return { ok: true, minor: null, value: '' };
    const r = money.parse(raw, opts.code, { allowMinus: !!opts.allowMinus });
    if (r.ok) return { ok: true, minor: r.minor, value: money.toInput(r.minor, opts.code) };
    const d = money.digits(opts.code);
    const key = r.reason === 'decimals' && d === 0 ? 'decimals_none' : r.reason;
    const message = ERRORS[key].text.replace('{digits}', String(d)).replace('{name}', CURRENCY_NAMES[opts.code] || opts.code);
    return { ok: false, reason: r.reason, value: raw, message };
  }

  function bind(input, opts) {
    if (!input || typeof input.addEventListener !== 'function' || !('value' in input)) throw new Error('inputs: bind needs an input box');
    opts = opts || {};
    const kind = opts.kind || 'text';
    if (kind === 'amount') {
      if (!input.getAttribute('inputmode')) input.setAttribute('inputmode', 'decimal');
      input.setAttribute('autocomplete', 'off');
    }
    let fresh = false, before = input.value;
    input.addEventListener('focus', () => {
      fresh = true; before = input.value;
      input.select();
    });
    /* the click or tap that focused the box would put the caret down and undo the selection: keep it selected once */
    /* a press on a box that was already open (reached by Tab, or tapped before) is a small fix: no select */
    const down = () => { if (input.ownerDocument.activeElement === input) fresh = false; };
    input.addEventListener('pointerdown', down);
    input.addEventListener('mousedown', down);
    const keep = e => { if (fresh) { e.preventDefault(); input.select(); fresh = false; } };
    input.addEventListener('mouseup', keep);
    input.addEventListener('pointerup', keep);
    input.addEventListener('touchend', keep);
    input.addEventListener('keydown', e => {
      fresh = false;
      if (e.key === 'Escape') { input.value = before; input.select(); }
      if (e.key === 'Enter' && kind === 'amount') finish();
    });
    input.addEventListener('blur', () => { fresh = false; finish(); });
    function finish() {
      if (kind !== 'amount') { if (opts.onValue) opts.onValue(input.value); return; }
      const r = commit(input.value, opts);
      input.value = r.value;
      if (r.ok) {
        input.removeAttribute('aria-invalid');
        input.removeAttribute('data-error');
        if (opts.onValue) opts.onValue(r.minor);
      } else {
        input.setAttribute('aria-invalid', 'true');
        input.setAttribute('data-error', r.message);
        if (opts.onError) opts.onError(r);
      }
    }
    return input;
  }

  return { bind, commit, ERRORS };
});
