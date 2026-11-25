/* ---------- back3: the one piece that knows which sheet or form is open (SORTED K34, K35, K37) ----------
   No sheet's own file is touched: this watches the page (which sheet is shown, whether a Plan form or a receipt being
   changed is drawn) and does three things from that one list.
   1. The phone's back button [K34]: each open layer holds one history entry. Back closes the layer on top (a
      statement's later step goes back one step) and the app stays. A layer closed by its own button takes its entry
      with it, so back never does nothing. Back on a tab with nothing open leaves the app, as before.
   2. What was typed is kept [K35]: a layer closed with something typed in it shows it again the next time the same
      one opens, until anything is saved, or it is closed again untouched. Setup keeps its own draft (setup3.js);
      Settings (codes) and statements (files) are never kept.
   3. One message at a time [K37]: an Undo bar from before never sits over a layer opened after it. It is held back
      while the layer shows and comes back when the layer closes, if its time is not up.
   4. Which layers are open or covered [SYNC_PULL_PLAN B2]: the assistant, Reminders and Settings hide what is under them,
      so a layer that was open when one of them came over it still counts as there (`holding`) until that sheet closes.
      Whoever needs to know when that changes asks with onChange (the cloud copy holds a take back while a form is there).
   A new sheet needs a row in LAYERS (tests/e3_back.js counts the page's sheets against its own list).
   The assistant panel (chat3.js) has its row too: tests/e3_chat.js part 10 walks it.
   No money here: `held` and `skip` are lists of markers, so nothing is counted with sums. */
const BACK3 = (() => {
  const shownEl = sel => { const el = $(sel); return el && !el.closest('[hidden]') ? el : null; };
  const sheet = (key, sel, close, keep) => ({ key, root: () => shownEl(sel), close, keep });
  /* the layer on top first */
  const LAYERS = [
    sheet('rem', '#a3Rem', () => closeRem3()),
    sheet('set', '#a3Set', () => closeSet3()),
    sheet('stmt', '#a3Stmt', () => { const b = $('#a3StmtBack'); if (b) b.click(); else stmt3Close(); }),
    sheet('setup', '#a3Setup', () => closeSetup3()),
    sheet('check', '#a3Check', () => closeCheck3(), true),
    sheet('plan-form', '#a3Plan [data-card=plan-form]', () => plClose3(), true),
    { key: 'rc-edit', root: () => (shownEl('#rcCancel') ? $('#rcForm') : null), close: () => $('#rcCancel').click() },
    /* the assistant panel (chat3.js), open as a sheet on a phone: under every sheet and form above, which open over
       it. On a wide screen it is a column that is always there, so it is no layer. The message band is in the page
       above it, never over it, so it holds no Undo bar back (beside) */
    { key: 'chat', root: () => { const el = shownEl('#a3Chat[data-open]'); return el && !matchMedia('(min-width: 1000px)').matches ? el : null; }, close: () => $('#a3ChatClose').click(), beside: true },
  ];
  const open = () => LAYERS.filter(l => l.root());
  const held = [], skip = [];
  let was = [], covered = [];
  const COVERS = ['chat', 'rem', 'set'], fns = [];
  /* ---- what was typed, by layer ---- */
  const nameOf = el => el.id || [...el.attributes].filter(a => a.name.startsWith('data-') && a.name !== 'data-input' && a.name !== 'data-error').map(a => `${a.name}=${a.value}`).join(';');
  const fields = root => [...root.querySelectorAll('input, select, textarea')].filter(el => el.type !== 'password' && el.type !== 'file' && nameOf(el));
  /* which form this is: the layer, the shown day, its heading and its boxes (Add a bill never gets Add a goal's typing) */
  const sigOf = l => { const root = l.root(), h = root.querySelector('h1, h2'); return [l.key, E3.today(), h ? h.textContent : ''].concat(fields(root).map(nameOf)).join('|'); };
  const snap = root => fields(root).map(el => [nameOf(el), el.type === 'checkbox' ? el.checked : el.value]);
  let now = {}, kept = {}, putting = false;
  function typedIn(e) {
    if (putting || !e.target || !e.target.closest) return;
    const l = open().find(x => x.keep && x.root().contains(e.target));
    if (l) now[l.key] = { sig: sigOf(l), vals: snap(l.root()) };
  }
  function putBack(l) {
    const sig = sigOf(l), vals = kept[sig]; delete kept[sig];
    if (!vals) return;
    putting = true;
    try {
      const els = fields(l.root());
      for (const [name, v] of vals) {
        const el = els.find(x => nameOf(x) === name); if (!el) continue;
        if (el.type === 'checkbox') { if (el.checked !== v) { el.checked = v; el.dispatchEvent(new Event('change', { bubbles: true })); } }
        else if (el.value !== v) { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }
      }
    } finally { putting = false; }
  }
  const forget = () => { now = {}; kept = {}; };
  /* ---- the page changed: which layers opened, which closed, and the history entries to match ---- */
  /* a layer that shows again as it was drawn (Ask was over it, or its tab was left and come back to) was only covered:
     it still holds its typing. One drawn anew gets what was typed in the one before it */
  const drawn = new WeakMap();
  const domOf = l => { const r = l.root(); return r.classList.contains('a3-sheet') ? r.firstElementChild || r : r; };
  function sync() {
    const on = open(), keys = on.map(l => l.key);
    const fresh = on.filter(l => !was.includes(l.key));
    covered = keys.some(k => COVERS.includes(k)) ? [...new Set(covered.concat(was.filter(k => !COVERS.includes(k))))] : [];
    was = keys;
    /* [K37] an Undo bar from before a layer opened is held back while that layer shows (each layer remembers the
       newest message at the moment it was drawn; the latest of the open layers' marks is the cover). An Undo made
       inside a layer shows there, and the held one shows again when the layer closes, if its time is not up */
    for (const l of on) { const d = domOf(l); if (!drawn.has(d)) drawn.set(d, { mark: MSG3.mark(), isNew: true }); }
    let top = null;
    for (const l of on) { if (l.beside) continue; const m = drawn.get(domOf(l)).mark; if (top === null || m > top) top = m; }
    MSG3.cover('undo', top);
    for (const l of fresh) {
      const d = drawn.get(domOf(l));
      if (!d.isNew) continue;
      d.isNew = false;
      if (!l.keep) continue;
      if (now[l.key]) { kept[now[l.key].sig] = now[l.key].vals; delete now[l.key]; }   // kept by form: Add a goal never drops Add a bill's typing
      putBack(l);
    }
    entries();
    for (const f of fns) { try { f(); } catch (e) { /* a listener's own fault */ } }
  }
  /* one history entry per open layer. Stepping back off a closed layer's entry takes a moment (the browser does it
     after this code ends), so nothing is pushed until it has landed: a sheet swapped for another (Ask over Reminders)
     would else have its new entry stepped off instead */
  let late = null;
  function entries() {
    if (skip.length) return;
    const n = open().length;
    while (held.length < n) { held.push(1); try { history.pushState({ a3: held.length }, ''); } catch (e) { held.pop(); return; } }
    if (held.length > n) { held.pop(); skip.push(1); history.back(); late = setTimeout(() => { skip.length = 0; entries(); }, 1500); }
  }
  addEventListener('popstate', e => {
    if (skip.length) { skip.pop(); clearTimeout(late); entries(); return; }
    /* forward into the entry of a layer that is gone: step back off it */
    if (e.state && e.state.a3 > held.length) { skip.push(1); history.back(); return; }
    held.pop();
    const top = open()[0];
    if (top) { try { top.close(); } catch (err) { /* the layer's own fault: it stays, and so does the app */ } }
    sync();
  });
  function start() {
    /* a reload with a layer open leaves its entries behind: they are taken as held, and sync steps back off them */
    const n = history.state && history.state.a3;
    if (Number.isInteger(n) && n > 0 && n < 20) for (const x of Array(n).fill(1)) held.push(x);
    document.addEventListener('input', typedIn, true);
    document.addEventListener('change', typedIn, true);
    if (typeof ACT3 === 'object' && ACT3) ACT3.onChange(forget);
    /* [STALE_SHEET_PLAN, M61] typing kept from a closed form holds every box of it, the ones not touched too: once the
       book changed somewhere else (another tab, a copy taken from the cloud or a backup) it is dropped, so an old figure
       is never put back into a form opened afterwards */
    addEventListener('burrow3:other', forget); addEventListener('burrow3:book', forget);
    new MutationObserver(sync).observe($('#a3'), { subtree: true, childList: true, attributes: true, attributeFilter: ['hidden'] });
    /* the assistant panel sits beside #a3: open or closed is its data-open, and the width decides sheet or column */
    if ($('#a3Chat')) new MutationObserver(sync).observe($('#a3Chat'), { attributes: true, attributeFilter: ['hidden', 'data-open'] });
    matchMedia('(min-width: 1000px)').addEventListener('change', sync);
    sync();
  }
  const holding = () => [...new Set(open().map(l => l.key).concat(covered))];
  return { start, open: () => open().map(l => l.key), holding, onChange: f => fns.push(f), forget };
})();
BACK3.start();
