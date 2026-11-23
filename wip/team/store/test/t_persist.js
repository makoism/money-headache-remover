// store/persist.js: ask the browser to keep the data after setup, and the line for Settings with the space used [D7].
'use strict';

const NAV = () => {
  // Stand-in navigators for the paths a real browser may take.
  window.fakeNav = {
    none: {},
    kept: { storage: { persisted: async () => true, persist: async () => { throw new Error('not asked twice'); }, estimate: async () => ({ usage: 1234567, quota: 300e6 }) } },
    no: { storage: { persisted: async () => false, persist: async () => false, estimate: async () => ({ usage: 52000 }) } },
    yes: { storage: { persisted: async () => false, persist: async () => true, estimate: async () => ({ usage: 0, quota: 12e9 }) } },
    broken: { storage: { persisted: async () => { throw new Error('x'); }, persist: async () => { throw new Error('x'); }, estimate: async () => { throw new Error('x'); } } },
  };
};

module.exports = [
  { name: 'asking to keep the data: granted, refused, already kept, not offered, and a browser that throws', run: async t => {
    const p = await t.page(null, pg => pg.addInitScript(NAV));
    const r = await p.evaluate(async () => {
      const P = window.BurrowPersist, f = window.fakeNav, out = {};
      for (const k of Object.keys(f)) out[k] = await P.askToKeep({ nav: f[k] });
      out.real = await P.askToKeep();
      return out;
    });
    t.assert.eq(r.none, { granted: null, asked: false }, 'not offered');
    t.assert.eq(r.kept, { granted: true, asked: false }, 'already kept: not asked again');
    t.assert.eq(r.no, { granted: false, asked: true }, 'refused');
    t.assert.eq(r.yes, { granted: true, asked: true }, 'granted');
    t.assert.eq(r.broken, { granted: false, asked: true }, 'a browser that throws counts as not kept');
    t.assert(typeof r.real.granted === 'boolean', 'the real Chromium answers', r.real);
    t.log('headless Chromium answered persist() with ' + r.real.granted);
  } },

  { name: 'the Settings line: kept or not, and the space used, in plain words', run: async t => {
    const p = await t.page(null, pg => pg.addInitScript(NAV));
    const r = await p.evaluate(async () => {
      const P = window.BurrowPersist, f = window.fakeNav;
      return { kept: await P.space({ nav: f.kept }), no: await P.space({ nav: f.no }), none: await P.space({ nav: f.none }), broken: await P.space({ nav: f.broken }),
        real: await P.space(), sizes: [0, 512, 1500, 1234567, 300e6, 12e9].map(P.sizeWords) };
    });
    t.assert.eq(r.sizes, ['0 KB', '1 KB', '2 KB', '1.2 MB', '300 MB', '12 GB'], 'sizes');
    t.assert.eq([r.kept.persisted, r.kept.usage, r.kept.quota], [true, 1234567, 300e6], 'numbers');
    t.assert.eq(r.kept.words, 'This device keeps your money until you remove it. Space used: 1.2 MB of 300 MB.', 'kept');
    t.assert.eq(r.no.words, 'The browser may clear your money if this device runs low on space. Keep the cloud copy on or save a backup file. Space used: 52 KB.', 'not kept');
    t.assert.eq(r.none.words, 'This browser does not say whether it keeps your money. Keep the cloud copy on or save a backup file.', 'not offered');
    t.assert.eq(r.broken.persisted, false, 'broken counts as not kept');
    t.assert(typeof r.real.usage === 'number' && typeof r.real.quota === 'number' && /Space used/.test(r.real.words), 'real Chromium', r.real);
    for (const k of ['kept', 'no', 'none', 'broken', 'real']) t.assert(!/—/.test(r[k].words), 'no em dash', r[k].words);
  } },

  { name: 'afterSetup asks once and keeps the answer for this device', run: async t => {
    const ctx = await t.context();
    const p = await t.page(ctx, pg => pg.addInitScript(NAV));
    const r = await p.evaluate(async () => {
      const P = window.BurrowPersist, f = window.fakeNav;
      let calls = 0;
      const nav = { storage: { persisted: async () => false, persist: async () => { calls++; return false; } } };
      const a = await P.afterSetup({ nav }), b = await P.afterSetup({ nav });
      return [a, b, calls, localStorage.getItem('burrow3.persist')];
    });
    t.assert.eq(r, [{ granted: false, asked: true }, { granted: false, asked: false }, 1, 'no'], 'one question per device; Settings can ask again with askToKeep');
  } },
];
