/* Typed or sample, on every shown value (DECISIONS_ROUND2 C, sweep2_repeats A3, requirements 1c). Each value a screen
   shows carries where it came from:
     typed     the person typed it
     imported  read from the person's statement or screenshot
     worked    worked out by the engine from the person's values
     sample    made-up numbers for the tour or a preview
   Sample data lives apart from the person's data. A sample value is never shown on the person's screen, the person's
   value never on a sample screen, the two never mix into one figure, and the move never carries a sample record as real.

   In a page: stamp(el, marked) writes data-from on the element, and audit(root) lists every shown figure with no mark
   or with the wrong one. Plain browser JavaScript. In a page it is BurrowScreens.provenance. */
(function (root, make) {
  const m = make();
  if (typeof module === 'object' && module.exports) module.exports = m;
  else (root.BurrowScreens = root.BurrowScreens || {}).provenance = m;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const ORIGINS = ['typed', 'imported', 'worked', 'sample'];
  const BADGE = 'Sample numbers';   // the app's wording today (in use); the copy pass may change it

  function origin(o) {
    if (!ORIGINS.includes(o)) throw new Error('provenance: origin must be one of ' + ORIGINS.join(', ') + ', got ' + JSON.stringify(o));
    return o;
  }
  const isMarked = v => !!v && typeof v === 'object' && Object.prototype.hasOwnProperty.call(v, 'from') && Object.prototype.hasOwnProperty.call(v, 'value');
  function mark(value, from) { return Object.freeze({ value, from: origin(from) }); }

  /* the origin of a figure worked out from several values */
  function combine(list) {
    if (!list || !list.length) throw new Error('provenance: nothing to combine');
    const froms = list.map(v => origin(isMarked(v) ? v.from : v));
    const samples = froms.filter(f => f === 'sample').length;
    if (samples && samples !== froms.length) throw new Error('provenance: sample values and the person\'s values never mix into one figure');
    return samples ? 'sample' : 'worked';
  }

  /* the engine result, run either on the person's data or on the sample data, never both */
  function markResult(result, from) {
    if (from !== 'typed' && from !== 'sample') throw new Error('provenance: an engine result is typed or sample, got ' + JSON.stringify(from));
    return Object.freeze({ value: result, from });
  }

  function screenOrigin(o) {
    if (o !== 'typed' && o !== 'sample') throw new Error('provenance: the screen is showing typed or sample data, got ' + JSON.stringify(o));
    return o;
  }
  /* what a screen may show: { value, from, sample, badge } or a refusal */
  function display(v, opts) {
    const screen = screenOrigin(opts && opts.screen);
    if (!isMarked(v)) throw new Error('provenance: every shown value needs a mark (typed, imported, worked or sample)');
    const isSample = v.from === 'sample';
    if (isSample && screen !== 'sample') throw new Error('provenance: a sample value cannot be shown as the person\'s');
    if (!isSample && screen === 'sample') throw new Error('provenance: the person\'s value cannot be shown on a sample screen');
    return { value: v.value, from: v.from, sample: isSample, badge: isSample ? BADGE : null };
  }

  /* the move of an old saved copy keeps the person's records only */
  function keepForMove(records) {
    return records.filter(r => origin(r && r.from) !== 'sample');
  }

  /* ---- in a page ---- */
  function stamp(el, v) {
    if (!isMarked(v)) throw new Error('provenance: stamp needs a marked value');
    el.setAttribute('data-from', origin(v.from));
    if (v.from === 'sample') el.setAttribute('data-sample', BADGE); else el.removeAttribute('data-sample');
    return el;
  }
  /* audit(root): every element showing a figure (data-figure) has a mark that fits the screen (root's data-origin) */
  function audit(rootEl) {
    const screen = rootEl.getAttribute('data-origin');
    const out = [];
    if (screen !== 'typed' && screen !== 'sample') out.push('the screen has no data-origin (typed or sample)');
    rootEl.querySelectorAll('[data-figure]').forEach(el => {
      const f = el.getAttribute('data-from'), name = el.getAttribute('data-figure');
      if (!ORIGINS.includes(f)) out.push(name + ': no typed-or-sample mark');
      else if ((f === 'sample') !== (screen === 'sample')) out.push(name + ': ' + f + ' value on a ' + screen + ' screen');
    });
    return out;
  }

  return { ORIGINS, BADGE, mark, combine, markResult, display, keepForMove, stamp, audit };
});
