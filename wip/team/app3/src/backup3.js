/* ---------- BACKUP3: a backup file of the new shape, and restoring one (SCHEMA_V3 1; DECISIONS_ROUND2 D2, D5, D6, BE3) ----------
   Saving: the shared copy packed by store/pack.js ({ fmt: 'gz1', v, data }: JSON, gzipped, base64), as a .json file. With a
   code typed by the person it is also encrypted (AES-GCM); the key is made from the code with PBKDF2-SHA-256 (150,000
   rounds, the cloud copy's count) and a random salt saved in the file (`kdf: { salt, rounds }`), so two files locked with one
   code do not share a key. Nobody can open a locked file without its code.
   Restoring: the file is read directly (never through a text box) by pack.readFile. A copy saved by a newer version is
   refused [D6]; a backup from the old app is refused too, since version one starts empty and does not move old data [BE2];
   anything else that is not this app's backup is refused with a plain sentence. The copy on this device is kept whole first
   [D2], then replaced. Device-only state (SCHEMA_V3 2.2) is never in a backup. No sums here. */
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
  const api = { WORDS, ROUNDS, MIN_CODE, codeOk, make, read, fileName };
  root.BACKUP3 = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
