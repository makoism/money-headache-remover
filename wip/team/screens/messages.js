/* The one message queue (DECISIONS_ROUND2 C, sweep2_repeats A7, MAKO_RUN 3.3). Toasts, the Undo bar and the notices from
   sync and the move all go through here, and one message is shown at a time, in one band that has its own place in the
   layout. Nothing posts a message anywhere else, so nothing covers a control.

   Kinds, highest first: undo (with its button, 8 s), toast (one line, 3 s), notice (sync, the move; stays until closed).
   Within a kind the newest shows first. A message that runs out of time while waiting is dropped, never shown late.
   One key holds one message: posting "Saved to the cloud" with key 'sync' replaces "Saving to the cloud".

   The band: mount(bandEl) renders the queue into bandEl. The page gives the band its own slot in a column layout
   (BAND_CSS: header, the scrolling main area, the band, the tab bar), so the band never sits on top of the page.
   Plain browser JavaScript. In a page it is BurrowScreens.messages. */
(function (root, make) {
  const m = make();
  if (typeof module === 'object' && module.exports) module.exports = m;
  else (root.BurrowScreens = root.BurrowScreens || {}).messages = m;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const KINDS = { undo: 3, toast: 2, notice: 1 };
  const LIFE = { undo: 8000, toast: 3000, notice: null };   // for Mako: how long each stays (MAKO_RUN 3.3)

  function createQueue(opts) {
    opts = opts || {};
    const now = opts.now || (() => Date.now());
    const setT = opts.setTimeout || ((f, ms) => setTimeout(f, ms));
    const clearT = opts.clearTimeout || (id => clearTimeout(id));
    const listeners = opts.onChange ? [opts.onChange] : [];
    let items = [], seq = 0, timer = null, last;

    const better = (a, b) => (KINDS[a.kind] !== KINDS[b.kind] ? KINDS[a.kind] > KINDS[b.kind] : a.seq > b.seq);
    function current() { let best = null; for (const x of items) if (!best || better(x, best)) best = x; return best; }
    function purge() { const t = now(); items = items.filter(x => x.expiresAt === null || x.expiresAt > t); }
    function changed() {
      purge();
      if (timer !== null) { clearT(timer); timer = null; }
      let next = null;
      for (const x of items) if (x.expiresAt !== null && (next === null || x.expiresAt < next)) next = x.expiresAt;
      if (next !== null) timer = setT(changed, next - now());   // not money: milliseconds until the next message runs out
      const c = current();
      const view = c ? Object.freeze({ id: c.id, kind: c.kind, text: c.text, action: c.action ? c.action.label : null }) : null;
      const sig = view ? view.id + '|' + view.text : null;
      if (sig !== last) { last = sig; listeners.forEach(f => f(view)); }
    }

    function post(m) {
      m = m || {};
      if (!(m.kind in KINDS)) throw new Error('messages: kind must be undo, toast or notice, got ' + JSON.stringify(m.kind));
      if (typeof m.text !== 'string' || !m.text.trim()) throw new Error('messages: a message needs words');
      if (m.kind === 'undo' && !(m.action && typeof m.action.run === 'function' && m.action.label)) throw new Error('messages: an Undo needs its action { label, run }');
      purge();
      const c = current();
      if (m.kind === 'toast' && c && c.kind === 'toast' && c.text === m.text) { c.expiresAt = now() + LIFE.toast; changed(); return c.id; }   // not money: time
      if (m.key) items = items.filter(x => x.key !== m.key);
      seq++;
      const life = m.ms != null ? m.ms : LIFE[m.kind];
      const item = { id: 'msg' + seq, seq, kind: m.kind, text: m.text, key: m.key || null, action: m.action || null, source: m.source || null, expiresAt: life === null ? null : now() + life };   // not money: time
      items.push(item);
      changed();
      return item.id;
    }
    function dismiss(id) { items = items.filter(x => x.id !== id); changed(); }
    function act(id) {
      const x = items.find(i => i.id === id);
      if (!x) return false;
      dismiss(id);
      if (x.action) x.action.run();
      return true;
    }
    function waiting() { purge(); return items.length ? items.length - 1 : 0; }   // not money: a count
    function view() { purge(); const c = current(); return c ? { id: c.id, kind: c.kind, text: c.text, action: c.action ? c.action.label : null } : null; }
    function onChange(f) { listeners.push(f); }
    return { post, dismiss, act, waiting, current: view, onChange };
  }

  /* ---- the band, in a page ---- */
  const BAND_CSS = [
    '.burrow-shell{display:flex;flex-direction:column;height:100vh;height:100dvh}',
    '.burrow-main{flex:1 1 auto;overflow:auto;min-height:0}',
    '.burrow-msg-band{flex:none}',
    '.burrow-msg-band:empty{display:none}',
    '.burrow-msg{display:flex;align-items:center;gap:12px;padding:10px 16px}',
    '.burrow-msg button{min-height:44px}',
  ].join('\n');
  let mounted = null;
  function mount(bandEl, queue) {
    const doc = bandEl.ownerDocument;
    if (mounted && mounted.isConnected && mounted !== bandEl) throw new Error('messages: there is one message band, already mounted');
    mounted = bandEl;
    bandEl.classList.add('burrow-msg-band');
    bandEl.setAttribute('role', 'status');
    bandEl.setAttribute('aria-live', 'polite');
    queue = queue || createQueue();
    const render = v => {
      bandEl.textContent = '';
      if (!v) return;
      const box = doc.createElement('div');
      box.className = 'burrow-msg burrow-msg-' + v.kind;
      box.setAttribute('data-msg', v.id);
      const words = doc.createElement('span');
      words.textContent = v.text;
      box.appendChild(words);
      if (v.action) { const b = doc.createElement('button'); b.type = 'button'; b.textContent = v.action; b.addEventListener('click', () => queue.act(v.id)); box.appendChild(b); }
      if (v.kind === 'notice') { const x = doc.createElement('button'); x.type = 'button'; x.textContent = 'Close'; x.setAttribute('aria-label', 'Close this message.'); x.addEventListener('click', () => queue.dismiss(v.id)); box.appendChild(x); }
      bandEl.appendChild(box);
    };
    queue.onChange(render);
    render(queue.current());
    return queue;
  }

  return { createQueue, mount, KINDS, LIFE, BAND_CSS };
});
