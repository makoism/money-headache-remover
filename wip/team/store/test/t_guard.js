// store/guard.js: the version check every writer asks before writing [D6], tabs talking over BroadcastChannel,
// and the marker left on the old 38.31 key after the move.
'use strict';

module.exports = [
  { name: 'ledgerMayWrite: no data, the same or an older shape may be written; a newer one makes the page read-only for good', run: async t => {
    const p = await t.page();
    const r = await p.evaluate(() => {
      const G = window.BurrowGuard, calls = [];
      G.onReadOnly(s => calls.push(s.why + ':' + s.seenV));
      const out = [G.pageV(), G.ledgerMayWrite(undefined), G.ledgerMayWrite(null), G.ledgerMayWrite(3), G.ledgerMayWrite(2), G.readOnly()];
      out.push(G.ledgerMayWrite(4), G.readOnly(), G.ledgerMayWrite(3), G.ledgerMayWrite(null), calls, G.words().title, G.words().body);
      return out;
    });
    t.assert.eq(r.slice(0, 6), [3, true, true, true, true, false], 'this page is shape 3 and may write 3 and older');
    t.assert.eq(r.slice(6, 11), [false, true, false, false, ['newer:4']], 'shape 4 stops every later write, told once');
    t.assert.eq(r[11], 'Update the app', 'the words say what to do');
    t.assert(!/—/.test(r[12]) && /update/i.test(r[12]), 'plain words, no em dash', r[12]);
  } },

  { name: 'a shape that cannot be read (not a whole number) is never written over', run: async t => {
    const p = await t.page();
    t.assert.eq(await p.evaluate(() => [window.BurrowGuard.ledgerMayWrite('x'), window.BurrowGuard.readOnly()]), [false, true], 'unreadable v');
    const q = await t.page();
    t.assert.eq(await q.evaluate(() => [window.BurrowGuard.ledgerMayWrite('3'), window.BurrowGuard.readOnly()]), [true, false], 'v as text "3" is 3');
  } },

  { name: 'mayRestore refuses a newer backup without making the page read-only', run: async t => {
    const p = await t.page();
    t.assert.eq(await p.evaluate(() => [window.BurrowGuard.mayRestore(4), window.BurrowGuard.mayRestore(3), window.BurrowGuard.readOnly()]),
      [false, true, false], 'a newer backup is refused; the page keeps working');
  } },

  { name: 'two tabs: a newer page opening tells the older tab, which becomes read-only at once (BroadcastChannel)', run: async t => {
    const ctx = await t.context();
    const old = await t.page(ctx), neu = await t.page(ctx);
    await neu.evaluate(() => window.BurrowGuard.setPageV(4));   // stands in for a later build
    await old.waitForFunction(() => window.BurrowGuard.readOnly(), null, { timeout: 3000 });
    t.assert.eq(await old.evaluate(() => [window.BurrowGuard.why(), window.BurrowGuard.seenV()]), ['newer', 4], 'the old tab knows why');
    t.assert.eq(await neu.evaluate(() => window.BurrowGuard.readOnly()), false, 'the newer tab keeps writing');
  } },

  { name: 'two tabs: an old tab opened after the newer one learns of it from the newer tab\'s answer', run: async t => {
    const ctx = await t.context();
    const neu = await t.page(ctx, pg => pg.addInitScript(() => { window.BURROW_PAGE_V = 4; }));
    t.assert.eq(await neu.evaluate(() => window.BurrowGuard.pageV()), 4, 'the newer page');
    const old = await t.page(ctx);
    await old.waitForFunction(() => window.BurrowGuard.readOnly(), null, { timeout: 3000 });
  } },

  { name: 'tab messages carry the shape and every message is checked before it is passed on', run: async t => {
    const ctx = await t.context();
    const a = await t.page(ctx), b = await t.page(ctx);
    await a.evaluate(() => { window.got = []; window.BurrowGuard.tabs.on(m => window.got.push(m.type)); });
    await b.evaluate(() => window.BurrowGuard.tabs.post({ type: 'saved', rev: 7 }));
    await a.waitForFunction(() => window.got.length === 1, null, { timeout: 3000 });
    await b.evaluate(() => window.BurrowGuard.tabs.post({ type: 'saved', rev: 8, v: 9 }));   // claims a newer shape
    await a.waitForFunction(() => window.BurrowGuard.readOnly(), null, { timeout: 3000 });
    t.assert.eq(await a.evaluate(() => window.got), ['saved'], 'a message from a newer shape is not passed on');
  } },

  { name: 'the old 38.31 key: a marker after the move, and a write by an old page after it is noticed', run: async t => {
    const p = await t.page();
    const r = await p.evaluate(() => {
      const G = window.BurrowGuard, out = [G.OLD_KEY, G.oldKeyState()];
      localStorage.setItem(G.OLD_KEY, JSON.stringify({ rev: 1763800000000, steps: {}, receipts: [] }));
      out.push(G.oldKeyState());
      G.leaveMarker('2026-11-23T10:00:00.000+09:00');
      const raw = localStorage.getItem(G.OLD_KEY);
      out.push(G.oldKeyState(), JSON.parse(raw), raw.indexOf('"rev":'));
      // A 38.31 page still open writes its copy back over the marker.
      localStorage.setItem(G.OLD_KEY, JSON.stringify({ rev: 1763900000000, steps: {}, receipts: [{ id: 'r1', a: 500 }] }));
      out.push(G.oldKeyState());
      localStorage.setItem(G.OLD_KEY, '{not json');
      out.push(G.oldKeyState());
      return out;
    });
    t.assert.eq(r[0], 'money-map-template-v2', 'the 38.31 key');
    t.assert.eq(r.slice(1, 3), ['none', 'data'], 'nothing, then a 38.31 copy');
    t.assert.eq(r[3], 'marker', 'after the move');
    t.assert.eq(r[4], { movedTo: 'burrow3', at: '2026-11-23T10:00:00.000+09:00' }, 'the marker [SCHEMA_V3 1]');
    t.assert.eq(r[5], -1, 'the marker has no rev, so an open 38.31 tab does not take it as a newer copy (ui0.js storage event)');
    t.assert.eq(r[6], 'rewritten', 'an old page wrote after the move: the move must run again for those changes');
    t.assert.eq(r[7], 'unreadable', 'damaged text');
  } },
];
