// Asking the browser to keep the data, and the space used (SCHEMA_V3 section 1; DECISIONS_ROUND2 D7).
// Plain browser JavaScript, no dependencies. Sets window.BurrowPersist.
//
// Without persist(), Chrome on Android counts the site's storage as "best effort" and may clear all of it
// (IndexedDB and localStorage together) when the phone runs low on space (sweep2_platform 2).
// - afterSetup(): called once setup is done; asks once per device and remembers the answer in localStorage.
// - askToKeep(): asks now (Settings can offer it again).
// - space(): { persisted, usage, quota, words } for Settings.
(function (root) {
  'use strict';
  const KEY = 'burrow3.persist';
  const navOf = o => (o && o.nav) || root.navigator || {};

  async function askToKeep(opts) {
    const st = navOf(opts).storage;
    if (!st || typeof st.persist !== 'function') return { granted: null, asked: false };
    try { if (typeof st.persisted === 'function' && await st.persisted()) return { granted: true, asked: false }; } catch (e) { /* ask below */ }
    let granted = false;
    try { granted = (await st.persist()) === true; } catch (e) { granted = false; }
    return { granted, asked: true };
  }

  async function afterSetup(opts) {
    let before = null;
    try { before = root.localStorage.getItem(KEY); } catch (e) { /* no storage: ask */ }
    if (before === 'yes' || before === 'no') {
      const st = navOf(opts).storage;
      let now = before === 'yes';
      try { if (st && typeof st.persisted === 'function') now = await st.persisted(); } catch (e) { /* keep the remembered answer */ }
      return { granted: now, asked: false };
    }
    const r = await askToKeep(opts);
    if (r.granted !== null) try { root.localStorage.setItem(KEY, r.granted ? 'yes' : 'no'); } catch (e) { /* asked again next time */ }
    return r;
  }

  // Sizes as people read them on a phone: 1,000 bytes to a KB.
  function sizeWords(b) {
    b = Math.max(0, +b || 0);
    const one = (v, unit) => (v < 10 ? String(Math.round(v * 10) / 10) : String(Math.round(v))) + ' ' + unit;
    if (b < 1e6) return (b === 0 ? 0 : Math.max(1, Math.round(b / 1000))) + ' KB';
    if (b < 1e9) return one(b / 1e6, 'MB');
    return one(b / 1e9, 'GB');
  }

  const KEPT = 'This device keeps your money until you remove it.';
  const NOT_KEPT = 'The browser may clear your money if this device runs low on space. Keep the cloud copy on or save a backup file.';
  const UNKNOWN = 'This browser does not say whether it keeps your money. Keep the cloud copy on or save a backup file.';

  async function space(opts) {
    const st = navOf(opts).storage;
    if (!st) return { persisted: null, usage: null, quota: null, words: UNKNOWN };
    let persisted = null, usage = null, quota = null;
    if (typeof st.persisted === 'function') { try { persisted = (await st.persisted()) === true; } catch (e) { persisted = false; } }
    if (typeof st.estimate === 'function') {
      try { const e = await st.estimate(); usage = typeof e.usage === 'number' ? e.usage : null; quota = typeof e.quota === 'number' ? e.quota : null; } catch (e) { /* unknown */ }
    }
    let words = persisted === true ? KEPT : persisted === false ? NOT_KEPT : UNKNOWN;
    if (usage !== null) words += ' Space used: ' + sizeWords(usage) + (quota ? ' of ' + sizeWords(quota) : '') + '.';
    return { persisted, usage, quota, words };
  }

  root.BurrowPersist = { askToKeep, afterSetup, space, sizeWords, WORDS: { KEPT, NOT_KEPT, UNKNOWN } };
})(typeof window !== 'undefined' ? window : globalThis);
