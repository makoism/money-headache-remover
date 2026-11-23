// Two tabs of the app on one device: each save is told to the other tab over BroadcastChannel, which reads only
// what changed; a tab that missed it cannot write over the other's save (the stored rev is checked in the save).
'use strict';

const OPEN = async () => {
  window.S = await window.BurrowStore.open();
  const l = await window.S.load();
  window.C = l.copy || window.makeCopy(0);
  window.heard = [];
  window.listen = () => window.S.onOther(ch => {
    window.heard.push(ch);
    // The page joins what the other tab saved: events by id, newer `at` wins (version one: events are append-only).
    const by = new Map(window.C.events.map(e => [e.id, e]));
    ch.events.forEach(e => { const m = by.get(e.id); if (!m || Date.parse(e.at) > Date.parse(m.at)) by.set(e.id, e); });
    window.C.events = [...by.values()];
    if (ch.book) Object.assign(window.C, ch.book);
    window.C.rev = ch.rev;
  });
  return !!l.copy;
};
const spend = (n, at) => { const e = Object.assign({}, window.makeEvents(1, { ses: n })[0], { at, told: at }); window.C.events.push(e); return e.id; };

module.exports = [
  { name: 'a save in one tab reaches the other within a moment, with only the changed records', run: async t => {
    const ctx = await t.context();
    const a = await t.page(ctx), b = await t.page(ctx);
    await a.evaluate(OPEN); await a.evaluate(async () => { window.C = window.makeCopy(100); await window.S.save(window.C); });
    await b.evaluate(OPEN); await b.evaluate(() => window.listen());
    await a.evaluate(() => window.listen());
    t.assert.eq(await b.evaluate(() => window.C.events.length), 100, 'B opened on A\'s copy');
    await a.evaluate(`window.spend = ${spend.toString()}`);
    const t0 = Date.now();
    const r = await a.evaluate(async () => { window.spend('tabaaaaaaa', '2026-11-23T12:00:00.000+09:00'); return window.S.save(window.C); });
    t.assert.eq([r.ok, r.events], [true, 1], 'A writes one event');
    await b.waitForFunction(() => window.heard.length === 1, null, { timeout: 3000 });
    t.log('the other tab had it after ' + (Date.now() - t0) + ' ms');
    t.assert.eq(await b.evaluate(() => [window.heard[0].events.length, window.heard[0].book, window.C.events.length]), [1, null, 101], 'B read one event, no book');
    await b.evaluate(`window.spend = ${spend.toString()}`);
    const rb = await b.evaluate(async () => { window.spend('tabbbbbbbb', '2026-11-23T12:01:00.000+09:00'); return window.S.save(window.C); });
    t.assert.eq([rb.ok, rb.events], [true, 1], 'B writes on top without being refused');
    await a.waitForFunction(() => window.heard.length === 1 && window.C.events.length === 102, null, { timeout: 3000 });
    const c = await (await t.page(ctx)).evaluate(async () => (await (await window.BurrowStore.open()).load()).copy.events.length);
    t.assert.eq(c, 102, 'both spends stored');
  } },

  { name: 'a tab that missed the other\'s save is refused, catches up, then saves; nothing is lost', run: async t => {
    const ctx = await t.context();
    const a = await t.page(ctx), b = await t.page(ctx);
    for (const p of [a, b]) await p.evaluate(`window.spend = ${spend.toString()}`);
    await a.evaluate(OPEN); await a.evaluate(async () => { window.C = window.makeCopy(10); await window.S.save(window.C); });
    await b.evaluate(OPEN);   // B does not listen
    await a.evaluate(async () => { window.spend('tabaaaaaaa', '2026-11-23T12:00:00.000+09:00'); window.C.home.mode = { v: 'wallet', at: '2026-11-23T12:00:00.000+09:00', by: 'aaaaaa' }; await window.S.save(window.C); });
    const r1 = await b.evaluate(async () => { window.spend('tabbbbbbbb', '2026-11-23T12:01:00.000+09:00'); return window.S.save(window.C); });
    t.assert.eq([r1.ok, r1.why], [false, 'behind'], 'refused: another tab saved since');
    const r2 = await b.evaluate(async () => {
      const ch = await window.S.catchUp();
      const got = [ch.events.length, ch.book && ch.book.home.mode.v];
      ch.events.forEach(e => window.C.events.push(e)); Object.assign(window.C, ch.book); window.C.rev = ch.rev;
      const s = await window.S.save(window.C);
      return [got, s.ok, s.events];
    });
    t.assert.eq(r2, [[1, 'wallet'], true, 1], 'catches up on one event and the book, then writes only its own spend');
    const l = await (await t.page(ctx)).evaluate(async () => { const c = (await (await window.BurrowStore.open()).load()).copy; return [c.events.length, c.home.mode.v]; });
    t.assert.eq(l, [12, 'wallet'], 'both kept');
  } },
];
