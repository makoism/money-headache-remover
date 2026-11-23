/* ---------- E3: the book and the one call the screens use (WIRING_PLAN 1.2, as changed by DECISIONS_ROUND2 AZ1) ----------
   The page holds one book (shape v3). E3.view(day) is the engine's look ahead for that day; the screens only place and
   write what it returns. No sums here.
   Where the book comes from:
     ?try=mako   the made-up Mako book, read only: a check-in changes it in memory, nothing is ever written.
     otherwise   the book kept in IndexedDB `burrow3` (store `slice1`, one record). TODO(lane C): use wip/team/store/
                 when it lands, and move this record into it with its source marker (WIRING_PLAN "Watch").
   The old app's keys (localStorage money-map-template-v2, IndexedDB money-map-safe) are never read or written here;
   only engine/move.js may read them (AZ1).
   ?today=YYYY-MM-DD shows the page as on that day (for checks and for trying the shape on pay days). */
const E3 = (() => {
  const Q = new URLSearchParams(location.search);
  const DB = 'burrow3', STORE = 'slice1', KEY = 'book';
  let book = null, mode = 'none';
  const pad2 = n => String(n).padStart(2, '0');
  function today() {
    const t = Q.get('today');
    if (t && /^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
    const d = new Date(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }
  /* the moment a record is told: the shown day at the device's clock time, with the device's offset */
  function told() {
    const d = new Date(), off = -d.getTimezoneOffset(), sign = off < 0 ? '-' : '+', a = Math.abs(off);
    return today() + 'T' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + sign + pad2(Math.floor(a / 60)) + ':' + pad2(a % 60);
  }
  const idMaker = BurrowEngine.ids.idMaker(devicePart());
  function devicePart() {
    // TODO(lane C): the device part is kept by the store. Slice 1 draws one per open: ids stay unique (the session part is random).
    const abc = 'abcdefghijklmnopqrstuvwxyz0123456789'; let s = '';
    for (let i = 0; i < 6; i++) s += abc[Math.floor(Math.random() * abc.length)];
    return s;
  }
  /* ---- the slice 1 holder: one record in IndexedDB burrow3 ---- */
  function dbOpen() {
    return new Promise(res => {
      try {
        const rq = indexedDB.open(DB, 1);
        rq.onupgradeneeded = () => { try { rq.result.createObjectStore(STORE); } catch (e) { /* reported by onerror */ } };
        rq.onsuccess = () => res(rq.result); rq.onerror = () => res(null); rq.onblocked = () => res(null);
      } catch (e) { res(null); }
    });
  }
  function dbRun(mode2, fn) {
    return dbOpen().then(db => new Promise(res => {
      if (!db) { res(null); return; }
      try {
        const tx = db.transaction(STORE, mode2), rq = fn(tx.objectStore(STORE));
        tx.oncomplete = () => { db.close(); res({ v: rq.result }); }; tx.onerror = tx.onabort = () => { db.close(); res(null); };
      } catch (e) { db.close(); res(null); }
    }));
  }
  async function load() {
    const t = Q.get('try');
    if (t && TRY_BOOKS[t]) { book = JSON.parse(JSON.stringify(TRY_BOOKS[t])); mode = 'try'; return; }
    const r = await dbRun('readonly', st => st.get(KEY));
    if (r && r.v && r.v.book) { book = r.v.book; mode = 'kept'; } else { book = null; mode = 'none'; }
  }
  async function save() {
    if (mode !== 'kept') return true;   // a try book is never written
    const r = await dbRun('readwrite', st => st.put({ v: 1, book, t: Date.now() }, KEY));
    return !!r;
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
  async function write(out) {
    const before = book;
    book = CHECKIN3.apply(book, out);
    const ok = await save();
    if (!ok) book = before;
    return ok;
  }
  /* is a the day before b (two YYYY-MM-DD days) */
  const dayBefore = (a, b) => BurrowEngine.dates.dayNum(b) - BurrowEngine.dates.dayNum(a) === 1;
  return { today, told, dayBefore, newId: () => idMaker(), load, view, nameOf, occName, curOf, home, write,
    get book() { return book; }, get mode() { return mode; } };
})();
