/* ---------- CLOUD3: the cloud copy of the new shape (SCHEMA_V3 1, 2.2, 2.3; DECISIONS_ROUND2 D5, E3, AQ, AW, BD2, BD5) ----------
   The copy is packed by store/pack.js ({ fmt: 'gz1', v, enc: 'aes-gcm', iv, data }: JSON, gzipped, then encrypted in this
   browser) and kept on the vault server (/api/vault/<id>). The server sees only ciphertext.
   The code. A recovery code the person keeps (20 letters and digits, shown as XXXX-XXXX-XXXX-XXXX-XXXX) is turned into
   three values, as the old app does (ui42.js keysFor): PBKDF2-SHA-256, 150,000 rounds, salt 'mhr2000-vault-v1', then HKDF-
   SHA-256 with an empty salt splits it into the vault id, the write token and the AES-GCM key. Only the HKDF labels differ:
   'burrow3:id', 'burrow3:token', 'burrow3:enc' (the old app uses 'id', 'token', 'enc'). So the same code opens a different
   record, and an old page can never load or overwrite the new shape's copy [E3]. Keep these choices: changing any of them
   makes every saved code open nothing.
   On the server the copy is { blob, iv, rev }: blob is the whole pack envelope as JSON in base64 (so `fmt` and `v` are read
   before anything is decrypted, and a newer shape is refused), iv is the envelope's iv.
   The revision [AQ1, BD2]. `rev` is the cloud copy's own compare-and-swap number (device.sync.baseRev), never the store's.
   A write names the revision it is based on (`base`); the server refuses it when the stored one differs, and the device
   takes the latest, joins it with its own (engine/sync.js syncDevice: three-way against the copy it last synced, the same
   item changed two ways is asked and every version kept in keptVersions), then writes again [AW5].
   No sums here: the join and the checks after it are the engine's. */
(function (root) {
  'use strict';
  const SALT = 'mhr2000-vault-v1', ROUNDS = 150000;
  const INFO = { id: 'burrow3:id', token: 'burrow3:token', enc: 'burrow3:enc' };
  const ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const TRIES = 3, KEEP_MAX = 60000;

  // ---------- the code ----------
  function newCode(rand) {
    const b = rand ? rand(20) : root.crypto.getRandomValues(new Uint8Array(20));
    let s = ''; for (let i = 0; i < 20; i++) s += ALPHA[b[i] % ALPHA.length];
    return s;
  }
  /* shown in groups of four with no prefix; the MHR- an older build showed in front is display only, so a code typed
     with it is still read (23 characters starting MHR), and a code that itself starts with MHR keeps those letters */
  const codeShow = c => String(c).match(/.{1,4}/g).join('-');
  const codeClean = v => { const s = String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); return (s.length === 23 && s.startsWith('MHR') ? s.slice(3) : s).replace(/O/g, '0').replace(/[IL]/g, '1'); };
  const codeValid = c => /^[A-Z0-9]{20}$/.test(c);
  const hex = u8 => Array.from(u8, x => x.toString(16).padStart(2, '0')).join('');
  const keyCache = new Map();
  async function keysFor(code) {
    if (keyCache.has(code)) return keyCache.get(code);
    const enc = new TextEncoder(), sub = root.crypto.subtle;
    const base = await sub.importKey('raw', enc.encode(code), 'PBKDF2', false, ['deriveBits']);
    const bits = await sub.deriveBits({ name: 'PBKDF2', salt: enc.encode(SALT), iterations: ROUNDS, hash: 'SHA-256' }, base, 256);
    const hk = await sub.importKey('raw', bits, 'HKDF', false, ['deriveBits', 'deriveKey']);
    const part = info => sub.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0), info: enc.encode(info) }, hk, 256);
    const key = await sub.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0), info: enc.encode(INFO.enc) }, hk, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    const k = { id: hex(new Uint8Array(await part(INFO.id))), token: hex(new Uint8Array(await part(INFO.token))), key };
    keyCache.set(code, k);
    return k;
  }

  // ---------- the envelope on the server ----------
  const b64 = s => { const u = new TextEncoder().encode(s); let t = ''; for (let i = 0; i < u.length; i += 0x8000) t += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return root.btoa(t); };
  const unb64 = s => new TextDecoder().decode(Uint8Array.from(root.atob(s), c => c.charCodeAt(0)));
  const wrap = env => ({ blob: b64(JSON.stringify(env)), iv: env.iv });
  function unwrap(blob) { try { const e = JSON.parse(unb64(blob)); return e && typeof e === 'object' ? e : null; } catch (e) { return null; } }

  // ---------- the server ----------
  function client(opts) {
    const f = opts.fetch || ((...a) => root.fetch(...a)), base = opts.base, wait = opts.timeout || 20000;
    async function req(k, method, body, keepalive, query) {
      const ctl = typeof AbortController === 'function' ? new AbortController() : null;
      const timer = ctl ? setTimeout(() => ctl.abort(), wait) : 0;
      try {
        const r = await f(base() + '/api/vault/' + k.id + (query || ''), { method, cache: 'no-store', keepalive: !!keepalive,
          headers: Object.assign({ 'x-vault-token': k.token }, body ? { 'content-type': 'application/json' } : {}),
          body: body ? JSON.stringify(body) : undefined, signal: ctl ? ctl.signal : undefined });
        let j = null; try { j = await r.json(); } catch (e) { j = null; }
        return { status: r.status, ok: !!r.ok, j: j || {} };
      } catch (e) { return { status: 0, ok: false, j: {} }; }   // no connection, or the 20 seconds ran out
      finally { clearTimeout(timer); }
    }
    /* rev: the revision alone (?versions=1 answers with `rev` and no copy), for the timed take [CS2] */
    /* [CS1] a send on leaving is one that outlives the page (keepalive). The browser refuses those over about 64 KB,
       so a bigger copy, or one the browser refused at once, goes as a plain send: it lands whenever the page lives
       long enough, which a page only put in the background does */
    const put = async (k, b, keepalive) => {
      if (keepalive && JSON.stringify(b).length <= KEEP_MAX) { const r = await req(k, 'PUT', b, true); if (r.status !== 0) return r; }
      return req(k, 'PUT', b, false);
    };
    return { get: k => req(k, 'GET'), rev: k => req(k, 'GET', null, false, '?versions=1'), put, del: k => req(k, 'DELETE') };
  }
  // 410: the cloud copy was deleted on another device; it stays gone until a fresh turn-on (a new code), so the device stops
  const WHY = { net: 'net', code: 'code', busy: 'busy', server: 'server', deleted: 'deleted' };
  const failOf = st => (st === 0 ? WHY.net : st === 403 ? WHY.code : st === 410 ? WHY.deleted : st === 429 ? WHY.busy : WHY.server);

  // ---------- one sync [AQ1, AW2, AW5] ----------
  // the store's own marks on a saved book (its revision and save time, store/idb.js meta) are never part of the shared copy [BD2]
  // The store also hands back an empty keptVersions list on every load, where the engine leaves the field out when nothing
  // is kept: the same book both ways, so an empty list is dropped too (else every reload looks like a change and sends)
  const noRev = c => {
    if (!c || typeof c !== 'object') return c;
    const o = Object.assign({}, c); delete o.rev; delete o.at;
    if (Array.isArray(o.keptVersions) && !o.keptVersions.length) delete o.keptVersions;
    return o;
  };
  // What the cloud holds now: { ok, rev, copy } (rev 0 and no copy when nothing is stored), or { ok: false, why }.
  async function fetchCloud({ api, pack, keys }) {
    const g = await api.get(keys);
    if (g.status === 404) return { ok: true, rev: 0, copy: null };
    if (!g.ok) return { ok: false, why: failOf(g.status) };
    const env = unwrap(g.j.blob);
    if (!env) return { ok: false, why: 'damaged' };
    const u = await pack.unpack(env, { key: keys.key });
    if (!u.ok) return { ok: false, why: u.why };   // 'newer' (a later shape: refused, nothing changed), 'key', 'damaged', 'fmt'
    return { ok: true, rev: +g.j.rev || 0, copy: noRev(u.copy), updated: g.j.updated || null };
  }
  // [CS2] Only the cloud copy's revision: { ok, rev } (0 when nothing is stored) or { ok: false, why }, said as a full sync
  // says it (a copy deleted on another device is 'deleted'). No copy is fetched, so a timed check costs one small call.
  async function revOnly({ api, keys }) {
    const g = await api.rev(keys);
    if (g.status === 404) return { ok: true, rev: 0 };
    if (!g.ok) return { ok: false, why: failOf(g.status) };
    return { ok: true, rev: +g.j.rev || 0 };
  }
  // device: { base, baseRev } as kept on this device (SCHEMA_V3 2.2 `sync`); copy: this device's shared copy.
  // Gives { ok, copy, device: { base, baseRev }, pushed, merged, questions, firstJoin } or { ok: false, why, device }.
  // A refused write is retried from the copy it took as its base (AW5), up to three times.
  // [CS3] A base goes only with the copy that holds it. A sync that fails hands back the copy and the base it was given,
  // never a base it took on the way: a caller that keeps its book then keeps the base that book was joined from.
  // take: true never sends (the day's guard): the cloud's news is joined in and the base is the cloud's copy, so what
  // this device changed is still waiting (`waiting: true`) for the next sync that may send.
  async function syncOnce({ api, pack, S, keys, device, copy, keepalive, take }) {
    let dev = { base: device && device.base != null ? device.base : null, baseRev: device && device.baseRev != null ? device.baseRev : null };
    const dev0 = dev, copy0 = noRev(copy);
    let cur = copy0, merged = false;
    const firstJoin = dev.base === null && S.hasData(cur);
    for (let i = 0; i < TRIES; i++) {
      const cloud = await fetchCloud({ api, pack, keys });
      if (!cloud.ok) return { ok: false, why: cloud.why, device: dev0, copy: copy0 };
      const r = S.syncDevice({ copy: cur, base: dev.base === null ? undefined : dev.base, baseRev: dev.baseRev === null ? undefined : dev.baseRev }, { rev: cloud.rev, copy: cloud.copy });
      merged = merged || r.merged;
      const out = noRev(r.device.copy);
      if (!r.pushed) {
        dev = { base: noRev(r.device.base), baseRev: r.rev };
        return { ok: true, copy: out, device: dev, pushed: false, merged, firstJoin, questions: S.afterSync(out).questions };
      }
      if (take) {
        dev = { base: cloud.copy ? JSON.parse(JSON.stringify(cloud.copy)) : null, baseRev: cloud.copy ? cloud.rev : null };
        return { ok: true, copy: out, device: dev, pushed: false, waiting: true, merged, firstJoin, questions: S.afterSync(out).questions };
      }
      const env = await pack.pack(out, { key: keys.key });
      const p = await api.put(keys, Object.assign(wrap(env), { rev: r.rev }, cloud.rev ? { base: cloud.rev } : {}), keepalive);
      if (p.ok) {
        dev = { base: JSON.parse(JSON.stringify(out)), baseRev: r.rev };   // its own object: the copy is edited later, the base never
        return { ok: true, copy: out, device: dev, pushed: true, merged, firstJoin, questions: S.afterSync(out).questions };
      }
      if (p.status !== 409) return { ok: false, why: failOf(p.status), device: dev0, copy: copy0 };
      // [AW5] refused: keep the joined copy, with the copy it took as its base, and join again on the latest
      cur = out; dev = { base: JSON.parse(JSON.stringify(cloud.copy)), baseRev: cloud.rev };
    }
    return { ok: false, why: WHY.busy, device: dev0, copy: copy0 };
  }

  const api = { SALT, ROUNDS, INFO, newCode, codeShow, codeClean, codeValid, keysFor, wrap, unwrap, client, fetchCloud, revOnly, syncOnce, noRev };
  root.CLOUD3 = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
