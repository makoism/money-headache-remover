/* ---------- E3: the book and the one call the screens use (WIRING_PLAN 1.2, as changed by DECISIONS_ROUND2 AZ1) ----------
   The page holds one book (shape v3). E3.view(day) is the engine's look ahead for that day; the screens only place and
   write what it returns. No sums here.
   Where the book comes from:
     ?try=mako   the made-up Mako book, read only: a check-in changes it in memory, nothing is ever written.
     otherwise   the book kept by the store (wip/team/store/, IndexedDB `burrow3`); with nothing kept, the first screen
                 offers setup3 and the made-up numbers.
   The old app's keys (localStorage money-map-template-v2, IndexedDB money-map-safe) are never read or written here;
   the move (engine/move.js) is not wired (DECISIONS_ROUND2 BE: version one starts empty).
   ?today=YYYY-MM-DD shows the page as on that day (for checks); on a try book the day box does the same, so the page
     works as a plain file with no address. */
const root3 = globalThis;
const E3 = (() => {
  const Q = new URLSearchParams(location.search);
  let book = null, mode = 'none', dayShown = null;
  const pad2 = n => String(n).padStart(2, '0');
  function today() {
    if (dayShown) return dayShown;
    const t = Q.get('today');
    if (t && /^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
    const d = new Date(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }
  /* the moment a record is told: the shown day at the device's clock time (to the minute, then the given seconds),
     with the device's offset */
  /* to the millisecond (walk 4 gate): with minutes and a fixed ':00', a spend logged in the same minute as a check-in was
     told before the check and held inside its figure, so the bank did not move. A check-in's own records share its
     moment; the engine keeps them inside its check (lookahead `sameMoment`). */
  function told() {
    const d = new Date(), off = -d.getTimezoneOffset(), sign = off < 0 ? '-' : '+', a = Math.abs(off);
    return today() + 'T' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds()) + '.' + String(d.getMilliseconds()).padStart(3, '0') + sign + pad2(Math.floor(a / 60)) + ':' + pad2(a % 60);
  }
  /* ids `<device part>-<session part>-<n>`: the store keeps the device part (store/idb.js). A try book writes nothing,
     not even the device part, so its ids use a made-up one. */
  let idMaker = null, tryIds = null;
  const newId = () => mode === 'try' ? (tryIds = tryIds || BurrowEngine.ids.idMaker('try000'))() : (idMaker = idMaker || BurrowStore.idMaker())();
  let store = null, readOnly = false;
  /* the day box on a try book: show the page as on that day */
  function setToday(d) { if (/^\d{4}-\d{2}-\d{2}$/.test(d || '')) dayShown = d; }
  /* the first screen's "See it with made-up numbers first": a try book in memory, nothing written */
  function useTry(name) { if (!TRY_BOOKS[name]) return false; book = JSON.parse(JSON.stringify(TRY_BOOKS[name])); mode = 'try'; return true; }
  /* the try band's "Set up with my own numbers": the try book is dropped (it was never written) and this device's own
     book is read, when it keeps one. Gives the mode after: 'kept' shows that book, 'none' is the caller's cue for setup */
  async function leaveTry() {
    if (mode !== 'try') return mode;
    Q.delete('try');
    try { const u = new URL(location.href); u.searchParams.delete('try'); history.replaceState(history.state, '', u.href); } catch (e) { /* the address keeps it: a reload shows the try book again */ }
    tryIds = null; dayShown = null; book = null; mode = 'none';
    if (!store) return (await load(), mode);
    try { const r = await store.load(); readOnly = !!r.readOnly; if (!r.empty && r.copy) { book = r.copy; mode = 'kept'; } } catch (e) { /* nothing kept: setup */ }
    return mode;
  }
  async function load() {
    const t = Q.get('try');
    if (t && TRY_BOOKS[t]) { book = JSON.parse(JSON.stringify(TRY_BOOKS[t])); mode = 'try'; return; }
    book = null; mode = 'none';
    try {
      store = await BurrowStore.open();
      const r = await store.load();
      readOnly = !!r.readOnly;
      if (!r.empty && r.copy) { book = r.copy; mode = 'kept'; }
      store.onOther(ch => { if (joinIn(ch)) shown(); else if (!book && mode === 'none') adopt(); });   // another tab saved: take it in and draw it
      hold = !!(mode === 'kept' && r.device && r.device.fillHold);
    } catch (e) { store = null; }
  }
  /* ---- two tabs on one device (store/idb.js onOther and catchUp) ----
     What another tab saved (changed events and kept versions by id, the rest of the book when it changed) is joined into
     this page's book, and the screens are told with the 'burrow3:other' event so they draw it. */
  const OTHER = 'Nothing was saved, because this changed somewhere else while it was open';   // the one sentence, the door's too (src/act3.js OTHER)
  function joinIn(ch) {
    if (!ch || !book || mode !== 'kept') return false;
    if (ch.gone) { book = null; mode = 'none'; hold = false; return true; }   // the fill was undone in another tab
    if (!ch.book && !(ch.events || []).length && !(ch.keptVersions || []).length) return false;
    const byId = (mine, theirs) => { const m = new Map((mine || []).map(r => [r.id, r])); for (const r of theirs || []) m.set(r.id, r); return [...m.values()]; };
    const rest = ch.book || BurrowStore.bookOf(book);
    book = Object.assign({}, rest, { events: byId(book.events, ch.events), keptVersions: byId(book.keptVersions, ch.keptVersions), rev: ch.rev, at: book.at });
    return true;
  }
  /* [TABSETUP_PLAN 1, qc-data-safety run 4 blocker 1; M61] this page has no book and another tab made one (setup
     finished there): read it from the store and take it in; nothing is written. The screens are told with
     'burrow3:started' (setup and the chat close onto Home and say so). Gives true when a book was taken in */
  async function adopt() {
    if (!store || mode !== 'none') return false;
    let r; try { r = await store.load(); } catch (e) { return 'error'; }
    if (!r || r.empty || !r.copy || mode !== 'none') return false;
    book = r.copy; mode = 'kept'; readOnly = !!r.readOnly;
    hold = !!(r.device && r.device.fillHold);   // [qc-foundation 3] a chat fill still held in the other tab stays held here
    try { root3.dispatchEvent(new CustomEvent('burrow3:started', { detail: { held: hold } })); } catch (e) { /* a screen's own fault */ }
    return true;
  }
  function shown() { try { root3.dispatchEvent(new CustomEvent('burrow3:other')); } catch (e) { /* a screen's own fault */ } }
  const savedFns = [];
  /* writes what changed through the store; a try book is never written */
  async function save(opts) { return (await saveR(opts)).ok; }
  /* the store's answer: { ok } or { ok: false, why: 'behind' | 'read-only' | 'full' | 'error' } */
  async function saveR(opts) {
    if (mode !== 'kept') return { ok: true };
    if (!store || readOnly) return { ok: false, why: 'read-only' };
    const r = (await store.save(book, opts)) || { ok: false, why: 'error' };
    if (r.ok) savedFns.forEach(f => { try { f(book); } catch (e) { /* a listener's own fault */ } });   // backup lane: the cloud copy follows saves
    return r;
  }
  /* refused as behind: take in what the other tab saved (this page's book becomes the latest) */
  async function catchUp() { const ch = await store.catchUp(); joinIn(ch); return book; }
  /* setup3's new book: kept from now on */
  /* [TABSETUP_PLAN 2] never over a book another tab made: under one lock across tabs the store is read first; a book
     there is taken in (adopt), nothing is written, and E3.startWhy says 'there' */
  let startWhy = null;
  async function start(newBook) {
    const run = () => startNow(newBook);
    return root3.navigator && root3.navigator.locks ? root3.navigator.locks.request('burrow3-start', run) : run();
  }
  async function startNow(newBook) {
    startWhy = null;
    /* [qc-foundation 1] a book already here (taken in from another tab) is never written over, whatever the screens do */
    if (mode !== 'none') { startWhy = 'there'; return false; }
    if (store) { const a = await adopt(); if (a === 'error') { startWhy = 'error'; return false; } if (a) { startWhy = 'there'; return false; } }
    const before = { book, mode };
    book = newBook; mode = 'kept';
    const ok = await save({ full: true });
    if (!ok) { book = before.book; mode = before.mode; }
    else {
      if (root3.BurrowPersist) root3.BurrowPersist.afterSetup().catch(() => {});
      if (typeof setup3Filled === 'function') setup3Filled();   // a setup Save's Undo has nothing left to undo
    }
    return ok;
  }
  /* backup lane: a whole new book from a restore or the cloud copy; the first one makes this device keep a book.
     Written whole (the store's replace: records the new book does not have are taken away). The caller keeps the old
     book first (rec('copy', ...), D2). A try book is never replaced. */
  async function replace(next) {
    if (mode === 'try') return false;
    const before = book, m = mode;
    book = next; mode = 'kept';
    let r = await saveR({ replace: true });
    if (!r.ok && r.why === 'behind' && store) { await store.catchUp(); book = next; r = await saveR({ replace: true }); }   // the whole book replaces the other tab's too
    if (!r.ok) { book = before; mode = m; }
    else { try { root3.dispatchEvent(new CustomEvent('burrow3:book')); } catch (e) { /* a listener's own fault */ } }   // a whole new book: typing kept from before is dropped (back3)
    return r.ok;
  }
  /* backup lane: what the store keeps beside the book (store/idb.js):
       rec('copy', { copy, why, pin })  keeps a whole copy before a big replace in the store's `kept` store [D2]; gives its id;
                                   pin keeps it outside the store's newest 5 until rec('drop', id); with pin, `at` keeps a
                                   dropped copy again under the time it was first kept (Undo of Drop it)
       rec('drop', id)             drops one kept whole copy
       rec('copies')               the kept whole copies, newest first: [{ id, why, at, events }]
       rec('copy:<at>')            one kept copy { id, why, at, copy }
       rec('cloud') / rec('cloud', v)   the cloud copy's device-only state, in the store's `device` record (SCHEMA_V3 2.2)
     A try book keeps nothing. */
  /* [coordinator's ruling 26 Nov, M61] the device record is read and written whole: every read and every write of it goes
     through one queue, in the order asked, so two keys written at once are both kept (before, one write was lost and
     still said true). Nothing else in the app writes the device record (store/idb.js putDevice is called only here) */
  let devQ = Promise.resolve();
  /* [qc-data-safety 26 Nov, blocker 1] and one tab at a time: two tabs of one phone share the record, so each read-then-write
     holds the browser's lock across tabs (where there is one) */
  const locked = fn => () => (root3.navigator && root3.navigator.locks ? root3.navigator.locks.request('burrow3-device', fn) : fn());
  const devTurn = fn => { const r = devQ.then(locked(fn), locked(fn)); devQ = r.catch(() => {}); return r; };
  /* recEdit(key, fn): the value as stored now goes through fn, and what fn gives is written (null removes it), in the same
     turn, so a change made in another tab since this tab read it is kept */
  async function recEdit(key, fn) {
    if (mode === 'try' || !store) return false;
    try {
      return await devTurn(async () => {
        const d = (await store.getDevice()) || {}, next = fn(d[key] === undefined ? null : d[key]);
        const out = Object.assign({}, d); if (next == null) delete out[key]; else out[key] = next;
        return await store.putDevice(out);
      });
    } catch (e) { return false; }
  }
  async function rec(key, value) {
    if (mode === 'try' || !store) return value === undefined ? null : false;
    try {
      if (key === 'copy') return await store.keepCopy(value.copy, value.why, value.pin ? Object.assign({ pin: true }, value.at ? { at: value.at } : {}) : undefined);
      if (key === 'drop') return await store.removeCopy(value);
      if (key === 'copies') return (await store.keptCopies()).sort((x, y) => (Date.parse(y.at) || 0) - (Date.parse(x.at) || 0) || (x.id < y.id ? 1 : -1));   // by moment: each `at` carries its own offset
      if (key.startsWith('copy:')) return await store.keptCopy(key);
      return await devTurn(async () => {
        const d = (await store.getDevice()) || {};
        if (value === undefined) return d[key] === undefined ? null : d[key];
        return await store.putDevice(Object.assign({}, d, { [key]: value }));
      });
    } catch (e) { return value === undefined ? null : false; }
  }
  function view(day) {
    const res = BurrowEngine.lookahead.lookahead(book, day || today());
    return res;
  }
  /* names for what the engine returns by id (a lookup, nothing worked out) */
  function nameOf(id) {
    const a = (book.accounts || []).find(x => x.id === id); if (a) return a.name;
    const s = (book.schedules || []).find(x => x.id === id); if (s) return s.name;
    return id;
  }
  /* the last figure typed for an account or card known by the day (its own check, never a statement's), or null: a
     lookup for "checked 23 Nov" on Home and "last checked" at Check your bank */
  const lastCheckOf = (id, day) => ((book && book.events) || []).filter(e => e && !e.gone && e.k === 'check' && !e.stmt && e.acct === id && e.date <= day && String(e.told || e.date).slice(0, 10) <= day)
    .sort((x, y) => (x.date !== y.date ? (x.date < y.date ? -1 : 1) : String(x.told) < String(y.told) ? -1 : 1)).pop() || null;
  const occName = item => { const o = BurrowEngine.ids.occurrence(item); return o ? nameOf(o.schedule) : nameOf(item); };
  const curOf = id => { const a = (book.accounts || []).find(x => x.id === id); return a ? a.cur : BurrowEngine.ledger.homeOn(book, today()); };
  const home = () => BurrowEngine.ledger.homeOn(book, today());
  /* act3's save (src/act3.js, the one write door): the whole new book, kept or (on failure) the old one back */
  async function put(next) {
    const before = book;
    book = next;
    const r = await saveR();
    if (r.ok) return true;
    if (r.why !== 'behind') { book = before; return false; }
    /* another tab saved since this page last read: catch up, then the same step again on the latest (a three-way join of
       what this step changed, from the book it started on, with what the other tab saved). When both changed the same
       record, nothing is saved: the latest is shown again and the person tries again with their draft still there. */
    book = before;
    const theirs = await catchUp();
    const asked = c => ((c && c.keptVersions) || []).filter(k => k && k.ask).length;
    const joined = BurrowEngine.sync.sync(before, next, theirs);
    if (asked(joined) > asked(theirs)) { shown(); return { ok: false, why: 'other', text: OTHER }; }
    book = joined;
    if ((await saveR()).ok) { shown(); return true; }
    book = theirs; shown();
    return { ok: false, why: 'other', text: OTHER };
  }
  /* ---- the setup chat's fill and its Undo (AI_FIRST_PLAN corrections 2 and 9, BV2.9) ----
     fill(newBook): only when this device keeps no book (mode 'none'); the book is kept and marked in the device record as
       a fill that can still be undone, and the cloud copy is held back while it is.
     discard(): the fill's Undo, only while that mark is there: the store drops the book, its details and its records
       (store/idb.js discard: the device record and the kept copies stay; another tab is refused, not written over).
     release(): something else was written, so the fill can no longer be undone: the mark goes and the cloud copy may send. */
  let hold = false;
  async function fill(newBook) {
    if (mode !== 'none') { startWhy = 'there'; return false; }   // [qc-foundation 2]
    if (!(await start(newBook))) return false;
    hold = true;
    await rec('fillHold', true);
    return true;
  }
  async function discard() {
    if (mode !== 'kept' || !hold || !store) return false;
    const r = await store.discard();
    if (!r.ok) return false;
    try { await devTurn(async () => { const d = (await store.getDevice()) || {}; delete d.fillHold; await store.putDevice(d); }); } catch (e) { /* the mark goes with the next fill */ }
    book = null; mode = 'none'; hold = false;
    return true;
  }
  async function release() {
    if (!hold) return false;
    hold = false;
    await rec('fillHold', null);
    savedFns.forEach(f => { try { f(book); } catch (e) { /* a listener's own fault */ } });   // the cloud copy may send now
    return true;
  }
  /* is a the day before b (two YYYY-MM-DD days) */
  const dayBefore = (a, b) => BurrowEngine.dates.dayNum(b) - BurrowEngine.dates.dayNum(a) === 1;
  return { today, setToday, useTry, leaveTry, start, fill, discard, release, held: () => hold, told, dayBefore, newId, load, view, nameOf, occName, lastCheckOf, curOf, home, put, replace, rec, recEdit, onSaved: f => savedFns.push(f),
    get book() { return book; }, get mode() { return mode; }, get startWhy() { return startWhy; } };
})();
