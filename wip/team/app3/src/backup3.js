/* ---------- BACKUP3: a backup file of the new shape, and restoring one (SCHEMA_V3 1; DECISIONS_ROUND2 D2, D5, D6, BE3) ----------
   Saving: the shared copy packed by store/pack.js ({ fmt: 'gz1', v, data }: JSON, gzipped, base64), as a .json file. With a
   code typed by the person it is also encrypted (AES-GCM); the key is made from the code with PBKDF2-SHA-256 (150,000
   rounds, the cloud copy's count) and a random salt saved in the file (`kdf: { salt, rounds }`), so two files locked with one
   code do not share a key. Nobody can open a locked file without its code.
   Restoring: the file is read directly (never through a text box) by pack.readFile. A copy saved by a newer version is
   refused [D6]; a backup from the old app is refused too, since version one starts empty and does not move old data [BE2];
   anything else that is not this app's backup is refused with a plain sentence. The copy on this device is kept whole first
   [D2], then replaced. Device-only state (SCHEMA_V3 2.2) is never in a backup. No sums here.
   A restore means "this is my money now" (FOR_MAKO "Open: a restore while the cloud copy is on"). restamp() makes the copy
   that is saved: every record it brings back, and every setting with its own change time, gets one new `at` (later than
   any `at` in either copy, store/clock.js) and this device's `by`, so it wins the cloud copy's three-way join on the next
   sync [BD4: every edit moves `at`]; `told` stays. Both copies are held against this device's now first (store/clock.js
   holdArriving), so a time far ahead in a file never stamps anything ahead of today. A record in the copy it replaces (or in the copy last synced) that the
   restored copy lacks is marked gone, the same way, since in the join a side that lacks a record never changed it. The
   kept versions of both stay (AQ3). Put it back goes through the same restamp. A section the restored copy lacks
   altogether has its records here marked gone too, and a setting written { v } with no change time is stamped like one
   that has one. The one known limit: a plain value or a list with no ids (home.curs) has no change time to carry, so
   the join takes it from the device that changed it, and when both changed it, the larger as text (AN1). */
(function (root) {
  'use strict';
  const ROUNDS = 150000, MIN_CODE = 6;
  const WORDS = {
    old: 'This is a backup from the old app. The new app starts empty and does not read old backups. Set it up with today\'s numbers instead.',
    short: 'Use at least 6 letters or digits for the code.',
    none: 'There is nothing to back up yet.',
  };
  const P = () => root.BurrowPack;
  const b64 = u => { let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return root.btoa(s); };
  const unb64 = s => Uint8Array.from(root.atob(s), c => c.charCodeAt(0));
  async function keyFrom(code, salt, rounds) {
    const enc = new TextEncoder(), sub = root.crypto.subtle;
    const base = await sub.importKey('raw', enc.encode(String(code).normalize('NFC')), 'PBKDF2', false, ['deriveKey']);
    return sub.deriveKey({ name: 'PBKDF2', salt, iterations: rounds, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  const codeOk = code => typeof code === 'string' && code.trim().length >= MIN_CODE;
  /* the file name: burrow-backup-<day>.json */
  const fileName = day => 'burrow-backup-' + day + '.json';
  /* { ok, text, name } or { ok: false, why, words }. copy: the shared copy; code: '' for none */
  async function make(copy, opts) {
    opts = opts || {};
    if (!copy) return { ok: false, why: 'none', words: WORDS.none };
    const code = opts.code ? String(opts.code).trim() : '';
    if (opts.code && !codeOk(code)) return { ok: false, why: 'short', words: WORDS.short };
    let env;
    if (code) {
      const salt = root.crypto.getRandomValues(new Uint8Array(16));
      env = await P().pack(copy, { key: await keyFrom(code, salt, ROUNDS) });
      env.kdf = { salt: b64(salt), rounds: ROUNDS };
    } else env = await P().pack(copy);
    return { ok: true, text: JSON.stringify(env), name: fileName(opts.day || 'today') };
  }
  /* a chosen file: { ok, copy, locked } or { ok: false, why, words, locked }. opts.code opens a locked file. */
  async function read(file, opts) {
    opts = opts || {};
    let key;
    if (opts.code) {
      // the salt is in the file: read the envelope's kdf first
      let env = null;
      try { env = JSON.parse(await file.text()); } catch (e) { env = null; }
      if (env && env.kdf && typeof env.kdf.salt === 'string') key = await keyFrom(String(opts.code).trim(), unb64(env.kdf.salt), +env.kdf.rounds || ROUNDS);
    }
    const r = await P().readFile(file, key ? { key } : {});
    if (r.ok && r.kind === '3831') return { ok: false, why: 'old', words: WORDS.old };
    if (!r.ok) return Object.assign({}, r, { locked: r.why === 'locked' || r.why === 'key' });
    if (!r.copy || typeof r.copy !== 'object' || Array.isArray(r.copy)) return { ok: false, why: 'unknown', words: P().WORDS.unknown };
    const copy = Object.assign({}, r.copy); delete copy.rev;   // the cloud copy's revision is never a backup's [BD2]
    return { ok: true, copy, kind: r.kind };
  }
  /* restamp(restored, over, { now, by, day, also }): the copy to save for a restore over `over` (this device's copy, or
     null), with `also` more copies whose records count as here (the copy last synced with the cloud). Changes neither. */
  const isMap = x => !!x && typeof x === 'object' && !Array.isArray(x);
  const isRecords = l => Array.isArray(l) && l.every(r => isMap(r) && typeof r.id === 'string');
  const C = x => JSON.parse(JSON.stringify(x));
  function restamp(restored, over, opts) {
    opts = opts || {};
    const Ck = root.BurrowClock, now = opts.now || Ck.nowIso();
    // [M4, AI1] a copy from outside (a file, an earlier cloud version) and what is here are held against this device's
    // now first, so a time far ahead in either never moves the new `at` past today
    const held = (x, mine) => Ck.holdArriving(x, mine || null, now).copy;
    const overs = [over].concat(opts.also || []).filter(isMap).map(o => held(o));
    restored = held(restored, overs[0]);
    const clock = Ck.makeClock();
    clock.see(restored); overs.forEach(o => clock.see(o));
    const at = clock.stamp(now), by = opts.by, gone = opts.day || true;
    const mark = r => { const o = Object.assign(C(r), { at, by }); delete o.held; return o; };   // a new `at`: no held mark to keep
    function walk(r, os, top) {
      const out = {};
      // a section here that the restored copy lacks (no `plan`, say) is walked too, so its records are marked gone
      const keys = new Set(Object.keys(r).concat(...os.map(o => Object.keys(o).filter(k => isRecords(o[k]) || (isMap(o[k]) && !(top && k === 'keptVersions'))))));
      for (const k of keys) {
        const x = r[k];
        if (top && ['keptVersions', 'rev', 'at', 'v'].includes(k)) { if (x !== undefined) out[k] = C(x); continue; }
        if ((x === undefined || isRecords(x)) && os.some(o => isRecords(o[k]))) {
          const list = (x || []).map(mark), have = new Set(list.map(e => e.id));
          for (const o of os) for (const e of isRecords(o[k]) ? o[k] : []) if (!have.has(e.id)) { have.add(e.id); list.push(Object.assign(mark(e), { gone: e.gone || gone })); }
          out[k] = list;
        } else if (isRecords(x)) out[k] = x.map(mark);
        else if (isMap(x) && (typeof x.at === 'string' || Object.prototype.hasOwnProperty.call(x, 'v'))) out[k] = mark(x);   // a setting, { v } with or without a change time
        else if (isMap(x)) out[k] = walk(x, os.map(o => o[k]).filter(isMap), false);
        else if (x === undefined) { const w = walk({}, os.map(o => o[k]).filter(isMap), false); if (Object.keys(w).length) out[k] = w; }
        else out[k] = C(x);
      }
      return out;
    }
    const out = walk(restored, overs, true);
    const kept = new Map();
    for (const c of overs.slice(0, 1).concat([restored])) for (const k of c.keptVersions || []) if (k && !kept.has(k.id)) kept.set(k.id, C(k));
    if (kept.size) out.keptVersions = [...kept.values()].sort((a, b) => (a.id < b.id ? -1 : 1));
    else delete out.keptVersions;
    return out;
  }
  const api = { WORDS, ROUNDS, MIN_CODE, codeOk, make, read, fileName, restamp };
  root.BACKUP3 = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
