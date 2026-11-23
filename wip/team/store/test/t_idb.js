// store/idb.js: IndexedDB as the main store, one record per event and per kept version plus one for the rest,
// writing only what changed [D1, D2, D3]; small device things in localStorage.
'use strict';

const sortEv = c => { if (c && c.events) c.events.sort((a, b) => (a.id < b.id ? -1 : 1)); return c; };
// Reads the raw stores without the module, to see what really is where.
const RAW = () => new Promise((res, rej) => {
  const q = indexedDB.open('burrow3');
  q.onerror = () => rej(q.error);
  q.onsuccess = () => {
    const db = q.result, tx = db.transaction(db.objectStoreNames, 'readonly'), out = { stores: [...db.objectStoreNames] };
    tx.objectStore('book').get('book').onsuccess = e => { out.book = e.target.result; };
    tx.objectStore('book').get('meta').onsuccess = e => { out.meta = e.target.result; };
    tx.objectStore('events').count().onsuccess = e => { out.events = e.target.result; };
    tx.objectStore('kept').getAllKeys().onsuccess = e => { out.kept = e.target.result; };
    tx.objectStore('device').get('device').onsuccess = e => { out.device = e.target.result; };
    tx.oncomplete = () => { db.close(); res(out); };
  };
});

module.exports = [
  { name: 'an empty start says plainly how to get the money back', run: async t => {
    const p = await t.page();
    const r = await p.evaluate(async () => { const s = await window.BurrowStore.open(); return [await s.load(), window.BurrowStore.EMPTY_WORDS]; });
    t.assert.eq([r[0].empty, r[0].copy, r[0].readOnly], [true, null, false], 'empty');
    t.assert(/cloud copy/.test(r[1]) && /backup file/.test(r[1]), 'Load your cloud copy or backup file', r[1]);
  } },

  { name: 'save then open again: the same copy comes back, unknown fields kept, v and rev on it', run: async t => {
    const ctx = await t.context();
    const a = await t.page(ctx);
    const saved = await a.evaluate(async () => {
      const s = await window.BurrowStore.open(); await s.load();
      const c = window.makeCopy(50);
      c.later = { from: 'a later build', n: [1, 2] };            // a field this build does not know
      c.events[3].fromLater = { x: 1 };
      c.keptVersions.push({ id: 'kept:k7qzpa-m2xq7ab9zt-bank', of: 'k7qzpa-m2xq7ab9zt-bank', in: 'accounts', versions: [{ name: 'Bank' }, { name: 'Main bank' }], ask: true,
        told: '2026-11-23T10:00:00.000+09:00', at: '2026-11-23T10:00:00.000+09:00', by: 'k7qzpa' });
      const r = await s.save(c);
      return { r, c };
    });
    t.assert.eq([saved.r.ok, saved.r.events, saved.r.kept, saved.r.book], [true, 50, 1, true], 'first save writes everything');
    t.assert(saved.c.rev > 0 && saved.c.v === 3, 'rev and v set on the copy', saved.c);
    const b = await t.page(ctx);
    const back = await b.evaluate(async () => { const s = await window.BurrowStore.open(); return s.load(); });
    t.assert.same(sortEv(back.copy), sortEv(saved.c), 'same copy back');
    const raw = await b.evaluate(RAW);
    t.assert.eq(raw.stores, ['book', 'device', 'events', 'kept'], 'the four stores [SCHEMA_V3 1]');
    t.assert(!('events' in raw.book) && !('keptVersions' in raw.book) && !('rev' in raw.book), 'the book holds no events, kept versions or rev', Object.keys(raw.book));
    t.assert.eq([raw.events, raw.kept, raw.meta.v, raw.meta.rev], [50, ['kept:k7qzpa-m2xq7ab9zt-bank'], 3, saved.c.rev], 'one record each');
  } },

  { name: 'only what changed is written: one event, the book, or nothing', run: async t => {
    const p = await t.page();
    const r = await p.evaluate(async () => {
      const s = await window.BurrowStore.open(); await s.load();
      const c = window.makeCopy(500), out = [];
      out.push(await s.save(c));
      c.events[10] = Object.assign({}, c.events[10], { a: 777, at: '2026-11-23T11:00:00.000+09:00' });   // an edit moves `at`
      out.push(await s.save(c));
      c.events.push(Object.assign({}, c.events[0], { id: 'k7qzpa-m2xq7ab9zt-9001', at: '2026-11-23T11:01:00.000+09:00' }));
      out.push(await s.save(c));
      c.home.mode = { v: 'track', at: '2026-11-23T11:02:00.000+09:00', by: 'k7qzpa' };
      out.push(await s.save(c));
      const rev = c.rev;
      out.push(await s.save(c));
      out.push(rev === c.rev);
      c.events[20].a = 1;   // changed without moving `at`: a bug in the caller; not seen
      out.push(await s.save(c));
      out.push(await s.save(c, { full: true }));
      return out.map(x => (typeof x === 'object' ? [x.ok, x.events, x.kept, x.book] : x));
    });
    t.assert.eq(r[0], [true, 500, 0, true], 'first');
    t.assert.eq(r[1], [true, 1, 0, false], 'one edited event');
    t.assert.eq(r[2], [true, 1, 0, false], 'one new event');
    t.assert.eq(r[3], [true, 0, 0, true], 'the book only');
    t.assert.eq(r[4], [true, 0, 0, false], 'nothing');
    t.assert.eq(r[5], true, 'nothing written, rev unchanged');
    t.assert.eq(r[6], [true, 0, 0, false], 'every edit must move at (SCHEMA_V3 0); one that does not is not seen');
    t.assert.eq(r[7], [true, 501, 0, true], 'full: true writes everything');
  } },

  { name: 'a whole copy kept before a big replace is its own record, never inside the book [D2]', run: async t => {
    const p = await t.page();
    const r = await p.evaluate(async () => {
      const s = await window.BurrowStore.open(); await s.load();
      const c = window.makeCopy(20); await s.save(c);
      const id = await s.keepCopy(c, 'backup restore');
      const list = await s.keptCopies(), whole = await s.keptCopy(id);
      return { id, list, n: whole.copy.events.length, why: whole.why, again: (await s.load()).copy.keptVersions.length };
    });
    t.assert(/^copy:/.test(r.id), 'id copy:<at>', r.id);
    t.assert.eq(r.list.map(x => [x.id, x.why]), [[r.id, 'backup restore']], 'listed without the copy itself');
    t.assert.eq([r.n, r.why, r.again], [20, 'backup restore', 0], 'the whole copy is there and not among the shared kept versions');
  } },

  { name: 'device-only state is its own record and never in the shared copy [D3]', run: async t => {
    const ctx = await t.context();
    const a = await t.page(ctx);
    await a.evaluate(async () => {
      const s = await window.BurrowStore.open(); await s.load(); await s.save(window.makeCopy(3));
      await s.putDevice({ clock: { lastSeen: '2026-11-23' }, look: { theme: 'dark' }, sync: { baseRev: 41 } });
    });
    const b = await t.page(ctx);
    const r = await b.evaluate(async () => { const s = await window.BurrowStore.open(); const l = await s.load(); return [l.device, 'clock' in l.copy, 'sync' in l.copy]; });
    t.assert.eq(r, [{ clock: { lastSeen: '2026-11-23' }, look: { theme: 'dark' }, sync: { baseRev: 41 } }, false, false], 'device state apart');
  } },

  { name: 'localStorage holds only small device things: the device part, the theme, the last open; ids look like the app\'s', run: async t => {
    const ctx = await t.context();
    const a = await t.page(ctx), b = await t.page(ctx);
    const L = () => { const L = window.BurrowStore.local, mk = window.BurrowStore.idMaker(); return [L.deviceIdPart(), L.sessionPart(), L.sessionPart(), mk(), mk(), L.theme(), Object.keys(localStorage)]; };
    const ra = await a.evaluate(L);
    await b.evaluate(() => { window.BurrowStore.local.setTheme('light'); window.BurrowStore.local.setLastOpen('2026-11-23'); });
    const rb = await b.evaluate(L);
    const other = await (await t.page()).evaluate(L);
    t.assert(/^[a-z0-9]{6}$/.test(ra[0]) && ra[0] === rb[0], 'one device part per device, 6 lowercase letters and digits', [ra[0], rb[0]]);
    t.assert(other[0] !== ra[0], 'another device, another part');
    t.assert(/^[a-z0-9]{10}$/.test(ra[1]) && ra[1] !== ra[2], 'a new 10-character session part each time', ra.slice(1, 3));
    t.assert(new RegExp('^' + ra[0] + '-[a-z0-9]{10}-1$').test(ra[3]) && ra[4].endsWith('-2'), 'ids <device>-<session>-<counter from 1>', ra.slice(3, 5));
    t.assert.eq([ra[5], rb[5]], ['dark', 'light'], 'theme');
    t.assert.eq(rb[6].sort(), ['burrow3.device', 'burrow3.lastOpen', 'burrow3.theme'], 'nothing else in localStorage');
  } },

  { name: 'an old page meeting newer data: read-only on load, and the check inside the save itself (no tab message)', run: async t => {
    const ctx = await t.context();
    // A page with no BroadcastChannel, so only the stored shape can stop it.
    const old = await t.page(ctx, pg => pg.addInitScript(() => { delete window.BroadcastChannel; }));
    await old.evaluate(async () => { window.S = await window.BurrowStore.open(); await window.S.load(); window.C = window.makeCopy(10); await window.S.save(window.C); });
    const neu = await t.page(ctx, pg => pg.addInitScript(() => { window.BURROW_PAGE_V = 4; }));
    const nr = await neu.evaluate(async () => { const s = await window.BurrowStore.open(); const l = await s.load(); l.copy.v = 4; l.copy.later = 'x'; return s.save(l.copy); });
    t.assert.eq([nr.ok, nr.book], [true, true], 'the newer page writes shape 4');
    const r = await old.evaluate(async () => {
      window.C.events[0] = Object.assign({}, window.C.events[0], { a: 1, at: '2026-11-23T12:00:00.000+09:00' });
      const s1 = await window.S.save(window.C);
      return [s1.ok, s1.why, window.BurrowGuard.readOnly(), window.BurrowGuard.words().title];
    });
    t.assert.eq(r, [false, 'read-only', true, 'Update the app'], 'the old page stops before writing');
    const third = await t.page(ctx);
    const l3 = await third.evaluate(async () => { const s = await window.BurrowStore.open(); const l = await s.load(); return [l.readOnly, l.copy.v, l.copy.later, l.copy.events.find(e => e.id.endsWith('-1')).a, (await s.save(l.copy)).why]; });
    t.assert.eq(l3, [true, 4, 'x', 100, 'read-only'], 'a shape 3 page opened later reads but never writes; the newer data is untouched');
  } },

  { name: 'a later build that changes the IndexedDB version: an open old page lets go and goes read-only; one opened later still reads', run: async t => {
    const ctx = await t.context();
    const old = await t.page(ctx, pg => pg.addInitScript(() => { delete window.BroadcastChannel; }));
    await old.evaluate(async () => { window.S = await window.BurrowStore.open(); await window.S.load(); await window.S.save(window.makeCopy(5)); });
    const neu = await t.page(ctx, pg => pg.addInitScript(() => { window.BURROW_PAGE_V = 4; }));
    const n = await neu.evaluate(async () => { const s = await window.BurrowStore.open({ idbVersion: 2 }); const l = await s.load(); return l.copy.events.length; });
    t.assert.eq(n, 5, 'the newer page opened (not blocked by the old one)');
    t.assert.eq(await old.evaluate(() => window.BurrowGuard.readOnly()), true, 'the old page knows at once');
    const late = await t.page(ctx, pg => pg.addInitScript(() => { delete window.BroadcastChannel; }));
    const l = await late.evaluate(async () => { const s = await window.BurrowStore.open(); const l = await s.load(); return [l.readOnly, l.copy && l.copy.events.length, window.BurrowGuard.why()]; });
    t.assert.eq(l, [true, 5, 'newer'], 'opened later: reads the newer store, writes nothing');
  } },
];
