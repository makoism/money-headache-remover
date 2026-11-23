// Storage full, and a store the browser cleared while the app was open or closed.
'use strict';

async function quota(t, page, bytes) {
  const s = await page.context().newCDPSession(page);
  const origin = t.url.replace(/\/$/, '');
  await s.send('Storage.overrideQuotaForOrigin', bytes == null ? { origin } : { origin, quotaSize: bytes });
  return s;
}

module.exports = [
  { name: 'storage full: the save says so, nothing half written, what was saved before is whole, and it saves once there is room', run: async t => {
    const ctx = await t.context();
    const p = await t.page(ctx);
    await p.evaluate(async () => { window.S = await window.BurrowStore.open(); await window.S.load(); window.C = window.makeCopy(100); await window.S.save(window.C); });
    await quota(t, p, 1024 * 1024);   // 1 MB for the whole site
    const r = await p.evaluate(async () => {
      window.C.events = window.C.events.concat(window.makeEvents(30000, { ses: 'impbigfile' }));   // a big import
      const s = await window.S.save(window.C);
      return [s.ok, s.why, window.C.events.length, window.BurrowStore.FULL_WORDS];
    });
    t.assert.eq(r.slice(0, 3), [false, 'full', 30100], 'refused as full; the copy in memory keeps everything');
    t.assert(/space/i.test(r[3]) && !/—/.test(r[3]), 'plain words for full', r[3]);
    const other = await t.page(ctx);
    t.assert.eq(await other.evaluate(async () => { const l = await (await window.BurrowStore.open()).load(); return [l.copy.events.length, l.copy.rev > 0]; }),
      [100, true], 'the store still holds the last whole save');
    await other.close();
    await quota(t, p, null);   // room again
    const r2 = await p.evaluate(async () => { const s = await window.S.save(window.C); return [s.ok, s.events]; });
    t.assert.eq(r2, [true, 30000], 'the unsaved records are written once there is room');
  } },

  { name: 'the browser clears the store while the app is open: the next save writes everything again', run: async t => {
    const ctx = await t.context();
    const p = await t.page(ctx);
    await p.evaluate(async () => { window.S = await window.BurrowStore.open(); await window.S.load(); window.C = window.makeCopy(200); await window.S.save(window.C); });
    const cdp = await p.context().newCDPSession(p);
    await cdp.send('Storage.clearDataForOrigin', { origin: t.url.replace(/\/$/, ''), storageTypes: 'indexeddb' });
    const r = await p.evaluate(async () => { const s = await window.S.save(window.C); return [s.ok, s.events, s.book, s.cleared]; });
    t.assert.eq(r, [true, 200, true, true], 'everything written again, and the page is told the store had been cleared');
    const l = await (await t.page(ctx)).evaluate(async () => (await (await window.BurrowStore.open()).load()).copy.events.length);
    t.assert.eq(l, 200, 'all back');
  } },

  { name: 'the browser cleared the store while the app was closed: an empty start, with the words to load a copy', run: async t => {
    const ctx = await t.context();
    const p = await t.page(ctx);
    await p.evaluate(async () => { const s = await window.BurrowStore.open(); await s.load(); await s.save(window.makeCopy(20)); s.close(); });
    const cdp = await p.context().newCDPSession(p);
    await cdp.send('Storage.clearDataForOrigin', { origin: t.url.replace(/\/$/, ''), storageTypes: 'indexeddb' });
    await p.reload(); await p.waitForFunction(() => window.STORE_READY === true);
    const l = await p.evaluate(async () => { const l = await (await window.BurrowStore.open()).load(); return [l.empty, l.copy, window.BurrowStore.EMPTY_WORDS]; });
    t.assert.eq(l.slice(0, 2), [true, null], 'empty');
    t.assert(/Load your cloud copy or backup file/.test(l[2]), 'says what to do', l[2]);
  } },

  { name: 'another tab deletes the database: this tab lets go, then writes everything again on its next save', run: async t => {
    const ctx = await t.context();
    const a = await t.page(ctx), b = await t.page(ctx);
    await a.evaluate(async () => { window.S = await window.BurrowStore.open(); await window.S.load(); window.C = window.makeCopy(30); await window.S.save(window.C); });
    const del = await b.evaluate(() => new Promise(res => { const q = indexedDB.deleteDatabase('burrow3'); q.onsuccess = () => res('deleted'); q.onblocked = () => res('blocked'); }));
    t.assert.eq(del, 'deleted', 'the delete was not blocked by the open page');
    const r = await a.evaluate(async () => { const s = await window.S.save(window.C); return [s.ok, s.events, s.cleared, window.BurrowGuard.readOnly()]; });
    t.assert.eq(r, [true, 30, true, false], 'written again; a delete is not a newer version');
  } },
];
