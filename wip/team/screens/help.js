/* The one help piece (NORTH_STAR: a question mark next to anything that needs it; LESSONS lesson 2: one shared piece).
   A "?" button beside a heading opens one or two plain lines under it; a second tap closes them. Every screen asks
   here for the words and the button, so one thing is explained the same way everywhere. The words are drafts for
   Mako's copy pass (app3/FOR_MAKO.md "Help words"), written to VOICE.md: plain, short, no comfort, no em dashes.
     help.words(key, ctx)   the lines for a key, filled from ctx (periodMoved needs { due: '10 Jan', landed: '12 Jan' })
     help.button(key)       '<button class="burrow-help" ...>?</button>', to sit beside a heading (never inside it)
     help.text(keys, ctx)   the hidden lines for one or more keys, as one <p>, placed right after the heading
     help.bind(root)        wires every "?" inside root to the lines after it (safe to call again after a redraw)
   Plain browser JavaScript, no dependencies. In a page it is BurrowScreens.help; in node, require('./help.js'). */
(function (root, make) {
  const m = make();
  if (typeof module === 'object' && module.exports) module.exports = m;
  else (root.BurrowScreens = root.BurrowScreens || {}).help = m;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const WORDS = {
    safeToSpend: ['What you can spend before your next pay and still cover everything due before it.',
      'Bills and card payments due by then are already taken off.'],
    status: ['How things stand today, in one line.', 'It changes when you check your bank or log a spend.'],
    /* [qc-north-star B1] the status card when no Free to spend is set: what it is, not the general status words */
    noFree: ['Free to spend is what you plan to spend on food and everyday things each pay period.', 'Set it, and safe to spend leaves room for it.'],
    period: ['Your money runs from one pay to the next, not by calendar month.'],
    periodMoved: ['Your pay is due on {due}, but that day is a weekend or a holiday, so it lands on {landed}. The pay period moves with it.'],
    lineShare: ['This line started partway through the pay period, so only the part for the days left counts now.',
      'The full amount counts from your next pay.'],
  };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  function words(key, ctx) {
    const lines = WORDS[key];
    if (!lines) throw new Error('help: no words for ' + key);
    return lines.map(l => l.replace(/\{(\w+)\}/g, (_, k) => {
      if (!ctx || ctx[k] == null) throw new Error('help: ' + key + ' needs ' + k);
      return ctx[k];
    }));
  }
  function button(key) {
    if (!WORDS[key]) throw new Error('help: no words for ' + key);
    return `<button type="button" class="burrow-help" data-help="${esc(key)}" aria-expanded="false" aria-label="What this means">?</button>`;
  }
  function text(keys, ctx) {
    const list = [].concat(keys);
    return `<p class="burrow-help-text" data-helptext="${esc(list[0])}" hidden>${[].concat(...list.map(k => words(k, ctx))).map(esc).join(' ')}</p>`;
  }
  /* the lines are the first .burrow-help-text after the button's own row (the heading row it sits in) */
  function linesOf(b) {
    for (let e = b.parentElement, n = 0; e && n < 3; e = e.parentElement, n++) {
      let s = e.nextElementSibling;
      while (s && !(s.classList && s.classList.contains('burrow-help-text'))) s = s.nextElementSibling;
      if (s && s.dataset.helptext === b.dataset.help) return s;
      const inside = e.querySelector(`.burrow-help-text[data-helptext="${b.dataset.help}"]`);
      if (inside) return inside;
    }
    return null;
  }
  function bind(rootEl) {
    for (const b of rootEl.querySelectorAll('.burrow-help')) {
      if (b.dataset.bound) continue;
      b.dataset.bound = '1';
      b.addEventListener('click', e => {
        e.preventDefault(); e.stopPropagation();
        const t = linesOf(b), open = b.getAttribute('aria-expanded') !== 'true';
        b.setAttribute('aria-expanded', String(open)); if (t) t.hidden = !open;
      });
    }
  }
  return { WORDS, words, button, text, bind };
});
