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
  function told(sec) {
    const d = new Date(), off = -d.getTimezoneOffset(), sign = off < 0 ? '-' : '+', a = Math.abs(off);
    return today() + 'T' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + (sec || '00') + sign + pad2(Math.floor(a / 60)) + ':' + pad2(a % 60);
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
  async function load() {
    const t = Q.get('try');
    if (t && TRY_BOOKS[t]) { book = JSON.parse(JSON.stringify(TRY_BOOKS[t])); mode = 'try'; return; }
    book = null; mode = 'none';
    try {
      store = await BurrowStore.open();
      const r = await store.load();
      readOnly = !!r.readOnly;
      if (!r.empty && r.copy) { book = r.copy; mode = 'kept'; }
    } catch (e) { store = null; }
  }
  const savedFns = [];
  /* writes what changed through the store; a try book is never written */
  async function save(opts) {
    if (mode !== 'kept') return true;
    if (!store || readOnly) return false;
    const r = await store.save(book, opts);
    const ok = !!(r && r.ok);
    if (ok) savedFns.forEach(f => { try { f(book); } catch (e) { /* a listener's own fault */ } });   // backup lane: the cloud copy follows saves
    return ok;
  }
  /* setup3's new book: kept from now on */
  async function start(newBook) {
    const before = { book, mode };
    book = newBook; mode = 'kept';
    const ok = await save({ full: true });
    if (!ok) { book = before.book; mode = before.mode; }
    else if (root3.BurrowPersist) root3.BurrowPersist.afterSetup().catch(() => {});
    return ok;
  }
  /* backup lane: a whole new book from a restore or the cloud copy; the first one makes this device keep a book.
     Written whole (the store's replace: records the new book does not have are taken away). The caller keeps the old
     book first (rec('copy', ...), D2). A try book is never replaced. */
  async function replace(next) {
    if (mode === 'try') return false;
    const before = book, m = mode;
    book = next; mode = 'kept';
    const ok = await save({ replace: true });
    if (!ok) { book = before; mode = m; }
    return ok;
  }
  /* backup lane: what the store keeps beside the book (store/idb.js):
       rec('copy', { copy, why })  keeps a whole copy before a big replace in the store's `kept` store [D2]; gives its id
       rec('copies')               the kept whole copies, newest first: [{ id, why, at, events }]
       rec('copy:<at>')            one kept copy { id, why, at, copy }
       rec('cloud') / rec('cloud', v)   the cloud copy's device-only state, in the store's `device` record (SCHEMA_V3 2.2)
     A try book keeps nothing. */
  async function rec(key, value) {
    if (mode === 'try' || !store) return value === undefined ? null : false;
    try {
      if (key === 'copy') return await store.keepCopy(value.copy, value.why);
      if (key === 'copies') return (await store.keptCopies()).sort((x, y) => (x.id < y.id ? 1 : -1));
      if (key.startsWith('copy:')) return await store.keptCopy(key);
      const d = (await store.getDevice()) || {};
      if (value === undefined) return d[key] === undefined ? null : d[key];
      return await store.putDevice(Object.assign({}, d, { [key]: value }));
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
  const occName = item => { const o = BurrowEngine.ids.occurrence(item); return o ? nameOf(o.schedule) : nameOf(item); };
  const curOf = id => { const a = (book.accounts || []).find(x => x.id === id); return a ? a.cur : BurrowEngine.ledger.homeOn(book, today()); };
  const home = () => BurrowEngine.ledger.homeOn(book, today());
  /* act3's save (src/act3.js, the one write door): the whole new book, kept or (on failure) the old one back */
  async function put(next) {
    const before = book;
    book = next;
    const ok = await save();
    if (!ok) book = before;
    return ok;
  }
  /* is a the day before b (two YYYY-MM-DD days) */
  const dayBefore = (a, b) => BurrowEngine.dates.dayNum(b) - BurrowEngine.dates.dayNum(a) === 1;
  return { today, setToday, useTry, start, told, dayBefore, newId, load, view, nameOf, occName, curOf, home, put, replace, rec, onSaved: f => savedFns.push(f),
    get book() { return book; }, get mode() { return mode; } };
})();
