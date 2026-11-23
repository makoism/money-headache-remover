// The version check every writer asks before writing (SCHEMA_V3 section 1; DECISIONS_ROUND2 D6).
// Plain browser JavaScript, no dependencies. Sets window.BurrowGuard.
//
// - ledgerMayWrite(storedV): asked by every writer (local save, another tab, IndexedDB, backup restore, cloud) with
//   the shape version `v` it found stored. A newer `v` than this page knows makes the page read-only for good, with
//   "Update the app"; both copies stay as they are. A `v` that is not a whole number is treated the same way.
// - mayRestore(v): a backup or cloud copy of a newer shape is refused, without making the page read-only.
// - tabs: one BroadcastChannel ('burrow3'). Every message carries the sender's shape; a message from a newer shape
//   makes this page read-only and is not passed on. A page says hello when it opens; a newer page answers an older
//   page's hello, so an old tab learns of a newer one whichever opened first.
// - The old 38.31 key: the move leaves the marker { movedTo: 'burrow3', at } there [D6]. The marker has no `rev`, so
//   a 38.31 tab still open does not take it as a newer copy (ui0.js storage listener). Such a tab can still write its
//   own copy back over the marker; oldKeyState() then says 'rewritten' and the move should run again on that copy
//   (the move's `mv:` ids make a second run add only what changed).
(function (root) {
  'use strict';
  const OLD_KEY = 'money-map-template-v2';
  const MOVED_FLAG = 'burrow3.moved';   // localStorage: when this device left the marker
  const CHANNEL = 'burrow3';
  let pageV = Number.isInteger(root.BURROW_PAGE_V) ? root.BURROW_PAGE_V : 3;
  const st = { readOnly: false, why: null, seenV: null };
  const roListeners = [], msgListeners = [];

  const WORDS = {
    title: 'Update the app',
    body: 'Your money was saved by a newer version of the app. This page can show it but will not save anything, so nothing is lost. Close this page and open the app again to update.',
  };

  // A stored shape: a whole number, or nothing stored yet (null or undefined). Anything else cannot be read.
  function shapeOf(v) {
    if (v === undefined || v === null) return 0;
    const n = typeof v === 'string' && /^\d+$/.test(v) ? +v : v;
    return Number.isInteger(n) && n >= 0 ? n : NaN;
  }
  function stop(why, v) {
    if (st.readOnly) return;
    st.readOnly = true; st.why = why; st.seenV = v === undefined ? null : v;
    roListeners.forEach(f => { try { f({ why: st.why, seenV: st.seenV, words: WORDS }); } catch (e) { /* a listener's own fault */ } });
  }
  // The one question every writer asks before it writes.
  function ledgerMayWrite(storedV) {
    if (st.readOnly) return false;
    const n = shapeOf(storedV);
    if (Number.isNaN(n)) { stop('unreadable', storedV); return false; }
    if (n > pageV) { stop('newer', n); return false; }
    return true;
  }
  function mayRestore(v) { const n = shapeOf(v); return !st.readOnly && !Number.isNaN(n) && n <= pageV; }

  // ---------- tabs ----------
  let ch = null;
  function channel() {
    if (ch || typeof BroadcastChannel !== 'function') return ch;
    ch = new BroadcastChannel(CHANNEL);
    ch.onmessage = e => {
      const m = e.data;
      if (!m || typeof m !== 'object') return;
      if (!ledgerMayWrite(m.v)) return;   // a newer shape: read-only, and its message is not ours to read
      if (m.type === 'hello') { if (shapeOf(m.v) < pageV) post({ type: 'hello' }); return; }
      msgListeners.forEach(f => { try { f(m); } catch (er) { /* a listener's own fault */ } });
    };
    return ch;
  }
  function post(msg) {
    const c = channel();
    if (c) try { c.postMessage(Object.assign({}, msg, { v: msg.v === undefined ? pageV : msg.v })); } catch (e) { /* closed */ }
  }

  // ---------- the old 38.31 key ----------
  function ls() { try { return root.localStorage || null; } catch (e) { return null; } }
  function leaveMarker(at) {
    const s = ls(); if (!s) return false;
    try { s.setItem(OLD_KEY, JSON.stringify({ movedTo: 'burrow3', at })); s.setItem(MOVED_FLAG, at); return true; } catch (e) { return false; }
  }
  // 'none', 'data' (a 38.31 copy to move), 'marker' (moved), 'rewritten' (moved, then an old page wrote again),
  // 'unreadable' (damaged text; the move keeps it as its frozen text).
  function oldKeyState() {
    const s = ls(); if (!s) return 'none';
    let raw, flag;
    try { raw = s.getItem(OLD_KEY); flag = s.getItem(MOVED_FLAG); } catch (e) { return 'none'; }
    if (raw === null) return 'none';
    let d; try { d = JSON.parse(raw); } catch (e) { return 'unreadable'; }
    if (d && d.movedTo === 'burrow3') return 'marker';
    if (!d || typeof d !== 'object') return 'unreadable';
    return flag ? 'rewritten' : 'data';
  }

  const api = {
    OLD_KEY, CHANNEL, WORDS,
    pageV: () => pageV,
    setPageV(n) { pageV = n; post({ type: 'hello' }); },   // the build sets it; tests stand in for a later build
    ledgerMayWrite, mayRestore,
    readOnly: () => st.readOnly, why: () => st.why, seenV: () => st.seenV,
    words: () => WORDS,
    onReadOnly(f) { roListeners.push(f); if (st.readOnly) f({ why: st.why, seenV: st.seenV, words: WORDS }); },
    stop,
    tabs: { post, on(f) { channel(); msgListeners.push(f); } },
    leaveMarker, oldKeyState,
  };
  root.BurrowGuard = api;
  channel();
  post({ type: 'hello' });
})(typeof window !== 'undefined' ? window : globalThis);
