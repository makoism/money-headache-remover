// The main store: IndexedDB `burrow3` (SCHEMA_V3 section 1; DECISIONS_ROUND2 D1, D2, D3, D6, AW7).
// Plain browser JavaScript, no dependencies. Load clock.js and guard.js first. Sets window.BurrowStore.
//
// Stores:
//   events  one record per event, keyed by `id`, indexed by `date` and `acct`
//   kept    one record per shared kept version (`keptVersions`, ids `kept:<record id or field path>`, AW7), and a
//           whole copy kept before a big replace (ids `copy:<at>`, D2), never inside the book
//   book    'book': everything else in the shared copy; 'meta': { v, rev, at } of the last save
//   device  'device': device-only state (SCHEMA_V3 2.2), never in the shared copy
// localStorage holds small device things only: the device part of ids, the theme, the last open day.
//
// Writing only what changed: every edit moves a record's `at` (SCHEMA_V3 section 0), so a record is written when
// its `at` differs from the one last read or written here; the book is written when its text differs.
// Every save asks BurrowGuard.ledgerMayWrite with the stored `v`, inside the same transaction as its writes, and
// is refused when another tab saved since this page last read (the stored `rev` is not the one this page knows).
// The other tab is told over BroadcastChannel and reads only the records that changed.
(function (root) {
  'use strict';
  const NAME = 'burrow3', IDB_VERSION = 1;
  const LISTS = { events: 'events', keptVersions: 'kept' };   // copy field -> store, one record per item
  const NOT_IN_BOOK = new Set(['events', 'keptVersions', 'rev', 'at', 'fmt']);
  const KEEP_COPIES = 5;   // whole copies kept before a big replace [D2]
  const KEPT_LO = 'kept:', KEPT_HI = 'kept:￿', COPY_LO = 'copy:', COPY_HI = 'copy:￿';
  const MANY = 2000;   // a tab message lists changed ids up to this many; more and the other tab reads everything

  const EMPTY_WORDS = 'Nothing is saved on this device yet. Load your cloud copy or backup file to bring your money back, or start setup.';
  const FULL_WORDS = 'Not saved: this device has no space left. Free some space and the app saves again. Your last save is safe.';

  const G = () => root.BurrowGuard;
  const pageV = () => (G() ? G().pageV() : 3);
  const mayWrite = v => !G() || G().ledgerMayWrite(v);
  const readOnly = () => !!(G() && G().readOnly());
  const nowIso = () => (root.BurrowClock ? root.BurrowClock.nowIso() : new Date().toISOString());

  function openRaw(name, version) {
    return new Promise((resolve, reject) => {
      let q;
      try { q = version ? indexedDB.open(name, version) : indexedDB.open(name); } catch (e) { reject(e); return; }
      q.onupgradeneeded = () => {
        const db = q.result;
        if (!db.objectStoreNames.contains('events')) {
          const ev = db.createObjectStore('events', { keyPath: 'id' });
          ev.createIndex('date', 'date'); ev.createIndex('acct', 'acct');
        }
        if (!db.objectStoreNames.contains('kept')) db.createObjectStore('kept', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('book')) db.createObjectStore('book');
        if (!db.objectStoreNames.contains('device')) db.createObjectStore('device');
      };
      q.onsuccess = () => resolve(q.result);
      q.onerror = () => reject(q.error);
    });
  }
  function bookOf(copy) {
    const b = {};
    for (const k of Object.keys(copy)) if (!NOT_IN_BOOK.has(k)) b[k] = copy[k];
    return b;
  }

  class Store {
    constructor(name, version) {
      this.name = name; this.version = version; this.db = null;
      this.atOf = { events: new Map(), keptVersions: new Map() };
      this.bookJson = null; this.rev = 0; this.had = false;
      this.q = Promise.resolve();
    }
    // Every operation runs one after the other, so a tab message is never read in the middle of a save.
    run(f) { const p = this.q.then(f, f); this.q = p.catch(() => {}); return p; }

    async conn() {
      if (this.db) return this.db;
      let db;
      try { db = await openRaw(this.name, this.version); }
      catch (e) {
        if (!e || e.name !== 'VersionError') throw e;
        if (G()) G().stop('newer', null);   // a later build changed the store: read it, never write [D6]
        db = await openRaw(this.name);
      }
      if (db.version > this.version && G()) G().stop('newer', null);
      db.onversionchange = e => {   // another page wants the store: let go at once
        db.close(); if (this.db === db) this.db = null;
        if (e.newVersion !== null && G()) G().stop('newer', null);   // a later build; null is a delete
      };
      db.onclose = () => { if (this.db === db) this.db = null; };   // the browser closed it (data cleared)
      this.db = db;
      return db;
    }
    async tx(stores, mode) {
      for (let i = 0; ; i++) {
        const db = await this.conn();
        try { return db.transaction(stores, mode); }
        catch (e) { if (i || e.name !== 'InvalidStateError') throw e; this.db = null; }   // closed under us: open again once
      }
    }
    remember(field, list) { const m = this.atOf[field]; for (const r of list) m.set(r.id, r.at); }

    // The whole copy, or { empty: true } when nothing is stored.
    load() {
      return this.run(async () => {
        const tx = await this.tx(['book', 'events', 'kept', 'device'], 'readonly');
        const got = {};
        tx.objectStore('book').get('meta').onsuccess = e => { got.meta = e.target.result; };
        tx.objectStore('book').get('book').onsuccess = e => { got.book = e.target.result; };
        tx.objectStore('events').getAll().onsuccess = e => { got.events = e.target.result; };
        tx.objectStore('kept').getAll(IDBKeyRange.bound(KEPT_LO, KEPT_HI)).onsuccess = e => { got.kept = e.target.result; };
        tx.objectStore('device').get('device').onsuccess = e => { got.device = e.target.result; };
        await done(tx);
        this.atOf.events.clear(); this.atOf.keptVersions.clear();
        const device = got.device || null;
        if (!got.meta && !got.book) {
          this.had = false; this.rev = 0; this.bookJson = null;
          return { copy: null, device, empty: true, readOnly: readOnly(), rev: 0 };
        }
        const meta = got.meta || { v: got.book.v, rev: 0 };
        mayWrite(meta.v);
        const book = got.book || {};
        this.bookJson = JSON.stringify(book);
        this.remember('events', got.events); this.remember('keptVersions', got.kept);
        this.rev = meta.rev; this.had = true;
        const copy = Object.assign({}, book, { events: got.events, keptVersions: got.kept, rev: meta.rev, at: meta.at });
        return { copy, device, empty: false, readOnly: readOnly(), rev: meta.rev };
      });
    }

    // Writes what changed in `copy` since this page last read or wrote. Sets copy.v, copy.rev and copy.at.
    // { ok: true, events, kept, book, rev, cleared } or { ok: false, why: 'read-only' | 'behind' | 'full' | 'error' }.
    // opts.full writes every record; opts.replace also removes stored records the copy does not have (a big replace;
    // keep the old copy with keepCopy first).
    save(copy, opts) {
      opts = opts || {};
      return this.run(async () => {
        if (readOnly()) return { ok: false, why: 'read-only' };
        for (const f of Object.keys(LISTS)) for (const r of copy[f] || []) {
          if (!r || typeof r.id !== 'string') return { ok: false, why: 'error', error: 'a record in ' + f + ' has no id' };
        }
        const v = pageV(), book = bookOf(Object.assign({}, copy, { v })), bookJson = JSON.stringify(book);
        const pick = (f, all) => (copy[f] || []).filter(r => all || !this.atOf[f].has(r.id) || this.atOf[f].get(r.id) !== r.at);
        let tx;
        try { tx = await this.tx(['book', 'events', 'kept'], 'readwrite'); } catch (e) { return { ok: false, why: 'error', error: String(e) }; }
        const out = { ok: true, events: 0, kept: 0, book: false, cleared: false };
        let why = null, written = null, rev = this.rev, at = null;
        const isFull = e => /Quota/.test(e && e.name || '') || /quota|space/i.test(String(e && e.message));
        tx.objectStore('book').get('meta').onsuccess = e => { try { write(e.target.result); } catch (er) {
          // a write refused at once (the browser's space ran out, or a record it cannot store): nothing is kept
          why = isFull(er) ? 'full' : 'error'; written = null; try { tx.abort(); } catch (x) { /* already over */ }
        } };
        const write = meta => {
          if (!mayWrite(meta && meta.v)) { why = 'read-only'; tx.abort(); return; }
          if (meta && meta.rev !== this.rev) { why = 'behind'; tx.abort(); return; }
          const cleared = !meta && this.had;   // the browser or another tab removed the store under us
          const all = !!(opts.full || opts.replace || cleared);
          const ch = { events: pick('events', all), keptVersions: pick('keptVersions', all) };
          const bookCh = all || bookJson !== this.bookJson;
          if (!ch.events.length && !ch.keptVersions.length && !bookCh) return;   // nothing changed: nothing written
          if (opts.replace) { tx.objectStore('events').clear(); tx.objectStore('kept').delete(IDBKeyRange.bound(KEPT_LO, KEPT_HI)); }
          const evs = tx.objectStore('events'), kept = tx.objectStore('kept');
          for (const r of ch.events) evs.put(r);
          for (const r of ch.keptVersions) kept.put(r);
          rev = Math.max(Date.now(), this.rev + 1); at = nowIso();
          if (bookCh) tx.objectStore('book').put(book, 'book');
          tx.objectStore('book').put({ v, rev, at }, 'meta');
          written = { ch, bookCh, cleared, all };
        };
        try { await done(tx); }
        catch (e) {
          if (why) return { ok: false, why };
          return { ok: false, why: isFull(e) ? 'full' : 'error', error: (e && e.name || '') + ' ' + (e && e.message || '') };
        }
        if (!written) return Object.assign(out, { rev: this.rev });
        if (written.all) { this.atOf.events.clear(); this.atOf.keptVersions.clear(); }
        this.remember('events', written.ch.events); this.remember('keptVersions', written.ch.keptVersions);
        if (written.bookCh) this.bookJson = bookJson;
        this.rev = rev; this.had = true;
        copy.v = v; copy.rev = rev; copy.at = at;
        const ids = l => (l.length > MANY ? null : l.map(r => r.id));
        if (G()) G().tabs.post({ type: 'saved', rev, events: written.all ? null : ids(written.ch.events), kept: written.all ? null : ids(written.ch.keptVersions), book: written.bookCh });
        return Object.assign(out, { events: written.ch.events.length, kept: written.ch.keptVersions.length, book: written.bookCh, cleared: written.cleared, rev });
      });
    }

    // What another tab saved, read from the store: { events, keptVersions, book (or null), rev }. The page joins
    // it into its own copy; the records read count as known here, so they are not written back unchanged.
    onOther(fn) {
      if (!G()) return;
      G().tabs.on(m => {
        if (!m || m.type !== 'saved') return;
        this.run(() => this.readChanged(m)).then(ch => { if (ch) fn(ch); }, () => {});
      });
    }
    async readChanged(m) {
      if (m.events === null || m.kept === null) return this.catchUpNow();
      const tx = await this.tx(['book', 'events', 'kept'], 'readonly');
      const got = { events: [], keptVersions: [], book: null };
      tx.objectStore('book').get('meta').onsuccess = e => { got.meta = e.target.result; };
      if (m.book) tx.objectStore('book').get('book').onsuccess = e => { got.book = e.target.result || null; };
      for (const id of m.events || []) tx.objectStore('events').get(id).onsuccess = e => { if (e.target.result) got.events.push(e.target.result); };
      for (const id of m.kept || []) tx.objectStore('kept').get(id).onsuccess = e => { if (e.target.result) got.keptVersions.push(e.target.result); };
      await done(tx);
      if (!got.meta) return null;
      mayWrite(got.meta.v);
      this.remember('events', got.events); this.remember('keptVersions', got.keptVersions);
      if (got.book) this.bookJson = JSON.stringify(got.book);
      this.rev = got.meta.rev; this.had = true;
      return { events: got.events, keptVersions: got.keptVersions, book: got.book, rev: got.meta.rev };
    }
    // After a save was refused as 'behind': everything stored that differs from what this page knows.
    catchUp() { return this.run(() => this.catchUpNow()); }
    async catchUpNow() {
      const tx = await this.tx(['book', 'events', 'kept'], 'readonly');
      const got = {};
      tx.objectStore('book').get('meta').onsuccess = e => { got.meta = e.target.result; };
      tx.objectStore('book').get('book').onsuccess = e => { got.book = e.target.result; };
      tx.objectStore('events').getAll().onsuccess = e => { got.events = e.target.result; };
      tx.objectStore('kept').getAll(IDBKeyRange.bound(KEPT_LO, KEPT_HI)).onsuccess = e => { got.kept = e.target.result; };
      await done(tx);
      if (!got.meta) return { events: [], keptVersions: [], book: null, rev: 0, cleared: this.had };
      mayWrite(got.meta.v);
      const diff = (f, list) => list.filter(r => !this.atOf[f].has(r.id) || this.atOf[f].get(r.id) !== r.at);
      const out = { events: diff('events', got.events), keptVersions: diff('keptVersions', got.kept), book: null, rev: got.meta.rev };
      const bj = JSON.stringify(got.book || {});
      if (bj !== this.bookJson) { out.book = got.book || {}; this.bookJson = bj; }
      this.remember('events', out.events); this.remember('keptVersions', out.keptVersions);
      this.rev = got.meta.rev; this.had = true;
      return out;
    }

    // A whole copy kept before a big replace (backup restore, cloud load), as its own record [D2]. Only the newest
    // KEEP_COPIES are kept (by moment, since each `at` carries its own offset); older ones are removed in the same write.
    // opts.pin keeps it outside that count (app3: the copy from before the first restore) until removeCopy drops it.
    keepCopy(copy, why, opts) {
      return this.run(async () => {
        if (readOnly()) throw new Error('read-only');
        const at = nowIso(), id = COPY_LO + at;
        const tx = await this.tx(['kept'], 'readwrite'), kept = tx.objectStore('kept'), had = [];
        kept.put(Object.assign({ id, why: why || '', at, copy }, opts && opts.pin ? { pin: true } : {}));
        kept.openCursor(IDBKeyRange.bound(COPY_LO, COPY_HI)).onsuccess = e => {
          const c = e.target.result; if (!c) return;
          if (c.value.id !== id && !c.value.pin) had.push({ id: c.value.id, ms: Date.parse(c.value.at) || 0 });
          c.continue();
        };
        await done(tx);
        const old = had.sort((x, y) => y.ms - x.ms || (x.id < y.id ? 1 : -1)).slice(KEEP_COPIES - 1);
        if (old.length) {
          const tx2 = await this.tx(['kept'], 'readwrite');
          for (const o of old) tx2.objectStore('kept').delete(o.id);
          await done(tx2);
        }
        return id;
      });
    }
    // Remove one kept whole copy. Only `copy:` ids: the shared kept versions are never removed here.
    removeCopy(id) {
      return this.run(async () => {
        if (readOnly()) throw new Error('read-only');
        if (typeof id !== 'string' || !id.startsWith(COPY_LO)) throw new Error('not a kept copy: ' + id);
        const tx = await this.tx(['kept'], 'readwrite');
        tx.objectStore('kept').delete(id);
        await done(tx);
        return true;
      });
    }
    keptCopies() {
      return this.run(async () => {
        const tx = await this.tx(['kept'], 'readonly'), out = [];
        tx.objectStore('kept').openCursor(IDBKeyRange.bound(COPY_LO, COPY_HI)).onsuccess = e => {
          const c = e.target.result; if (!c) return;
          out.push(Object.assign({ id: c.value.id, why: c.value.why, at: c.value.at, events: (c.value.copy.events || []).length }, c.value.pin ? { pin: true } : {})); c.continue();
        };
        await done(tx);
        return out;
      });
    }
    keptCopy(id) {
      return this.run(async () => {
        const tx = await this.tx(['kept'], 'readonly'); let r;
        tx.objectStore('kept').get(id).onsuccess = e => { r = e.target.result; };
        await done(tx);
        return r || null;
      });
    }

    // Device-only state (SCHEMA_V3 2.2): never merged, never in the cloud copy or a backup.
    getDevice() {
      return this.run(async () => {
        const tx = await this.tx(['device'], 'readonly'); let r;
        tx.objectStore('device').get('device').onsuccess = e => { r = e.target.result; };
        await done(tx);
        return r || null;
      });
    }
    putDevice(d) {
      return this.run(async () => {
        if (readOnly()) return false;
        const tx = await this.tx(['device'], 'readwrite');
        tx.objectStore('device').put(d, 'device');
        await done(tx);
        return true;
      });
    }
    close() { if (this.db) { this.db.close(); this.db = null; } }
  }

  function done(tx) {
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error || new DOMException('aborted', 'AbortError'));
    });
  }

  async function open(opts) {
    opts = opts || {};
    const s = new Store(opts.name || NAME, opts.idbVersion || IDB_VERSION);
    await s.conn();
    return s;
  }

  // ---------- small device things in localStorage ----------
  const P = 'burrow3.';
  const ABC = 'abcdefghijklmnopqrstuvwxyz0123456789';
  function rand(n) {
    let s = '';
    const b = new Uint8Array(n * 2);
    while (s.length < n) {
      crypto.getRandomValues(b);
      for (let i = 0; i < b.length && s.length < n; i++) if (b[i] < 252) s += ABC[b[i] % 36];   // 252 = 7 * 36, no bias
    }
    return s;
  }
  function lsGet(k) { try { return root.localStorage.getItem(P + k); } catch (e) { return null; } }
  function lsSet(k, v) { try { root.localStorage.setItem(P + k, v); return true; } catch (e) { return false; } }
  let memDevice = null;   // when localStorage is blocked, the part lasts for this page only
  const local = {
    deviceIdPart() {
      let d = lsGet('device');
      if (!d || !/^[a-z0-9]{6}$/.test(d)) { d = memDevice || rand(6); if (!lsSet('device', d)) memDevice = d; }
      return d;
    },
    sessionPart: () => rand(10),
    theme() { const t = lsGet('theme'); return t === 'light' || t === 'auto' ? t : 'dark'; },
    setTheme: t => lsSet('theme', t === 'light' || t === 'auto' ? t : 'dark'),
    lastOpen: () => lsGet('lastOpen'),
    setLastOpen: d => lsSet('lastOpen', d),
  };
  // Ids `<device part>-<session part>-<counter>` (SCHEMA_V3 section 0): a new session part per page open.
  function idMaker() {
    const d = local.deviceIdPart(), s = local.sessionPart();
    let n = 0;
    return () => d + '-' + s + '-' + (++n);
  }

  root.BurrowStore = { NAME, IDB_VERSION, EMPTY_WORDS, FULL_WORDS, open, local, idMaker, bookOf };
})(typeof window !== 'undefined' ? window : globalThis);
