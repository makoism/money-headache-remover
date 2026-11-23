// Backup files and the cloud copy (SCHEMA_V3 section 1; DECISIONS_ROUND2 D5, D6).
// Plain browser JavaScript, no dependencies (load guard.js first so a newer shape is refused). Sets window.BurrowPack.
//
// The outside: { fmt: 'gz1', v, data } and, with a key, { enc: 'aes-gcm', iv } too. `data` is the shared copy as
// JSON text, gzipped, then (with a key) encrypted, in base64. `v` is outside so a page can refuse a newer shape
// before opening anything; it is checked again inside.
// Gzip uses the browser's CompressionStream; where it is missing (Safari before 16.4) a small gzip of its own
// writes stored blocks (valid gzip any reader opens) and a small inflate reads any gzip, so a phone without
// CompressionStream still opens a copy a desktop made.
// readFile(file) reads a chosen file directly (never a text box): a gz1 backup, a plain .gz or JSON copy, or a 38.31
// backup (handed back as its raw text for the move). Encryption keys are made by the caller (the vault lane).
(function (root) {
  'use strict';
  const FMT = 'gz1';
  const MAX = 200e6;   // bytes once opened; more is refused (a damaged or hostile file)
  const WORDS = {
    fmt: 'This file is not a backup this version can read. Update the app and try again.',
    newer: 'This copy was saved by a newer version of the app. Update the app to load it.',
    damaged: 'This file is damaged and could not be read. Try another backup or your cloud copy.',
    locked: 'This copy is locked with a code. Enter the code to open it.',
    key: 'This copy could not be opened with this code. Check the code for a typo and try again.',
    'too-big': 'This file is too big to open on this device.',
    unknown: 'This is not a backup file from this app.',
  };
  let native = true;
  const hasNative = () => native && typeof CompressionStream === 'function' && typeof DecompressionStream === 'function';
  const G = () => root.BurrowGuard;
  const mayRestore = v => (G() ? G().mayRestore(v) : !(+v > 3));
  const err = code => { const e = new Error(code); e.code = code; return e; };
  const no = why => ({ ok: false, why, words: WORDS[why] });

  // ---------- bytes ----------
  const CRC = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    return t;
  })();
  function crc32(b) { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  const read32 = (b, o) => (b[o] | b[o + 1] << 8 | b[o + 2] << 16 | b[o + 3] << 24) >>> 0;
  const write32 = (b, o, v) => { b[o] = v & 255; b[o + 1] = (v >>> 8) & 255; b[o + 2] = (v >>> 16) & 255; b[o + 3] = (v >>> 24) & 255; };
  function toB64(u) { let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); }
  function fromB64(s) { if (typeof s !== 'string') throw err('damaged'); const bin = atob(s), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }

  async function through(bytes, ts, max) {
    const reader = new Blob([bytes]).stream().pipeThrough(ts).getReader(), parts = [];
    let n = 0;
    for (;;) {
      const r = await reader.read();
      if (r.done) break;
      n += r.value.length;
      if (max && n > max) { reader.cancel().catch(() => {}); throw err('too-big'); }
      parts.push(r.value);
    }
    const out = new Uint8Array(n); let o = 0;
    for (const p of parts) { out.set(p, o); o += p.length; }
    return out;
  }

  // ---------- gzip ----------
  async function gzip(bytes) {
    if (hasNative()) return through(bytes, new CompressionStream('gzip'));
    return storedGzip(bytes);
  }
  // A valid gzip made of stored (not compressed) blocks: the fallback writer.
  function storedGzip(b) {
    const blocks = Math.max(1, Math.ceil(b.length / 65535));
    const out = new Uint8Array(10 + b.length + blocks * 5 + 8);
    out.set([0x1f, 0x8b, 8, 0, 0, 0, 0, 0, 0, 255]);
    let o = 10;
    for (let i = 0; i < blocks; i++) {
      const s = i * 65535, len = Math.min(65535, b.length - s);
      out[o++] = i === blocks - 1 ? 1 : 0;
      out[o++] = len & 255; out[o++] = len >>> 8; out[o++] = ~len & 255; out[o++] = (~len >>> 8) & 255;
      out.set(b.subarray(s, s + len), o); o += len;
    }
    write32(out, o, crc32(b)); write32(out, o + 4, b.length >>> 0);
    return out;
  }
  async function gunzip(z, opts) {
    const max = opts && opts.max || MAX;
    if (hasNative()) {
      try { return await through(z, new DecompressionStream('gzip'), max); }
      catch (e) { throw e && e.code === 'too-big' ? e : err('damaged'); }
    }
    return fallbackGunzip(z, max);
  }
  function fallbackGunzip(z, max) {
    if (z.length < 18 || z[0] !== 0x1f || z[1] !== 0x8b || z[2] !== 8) throw err('damaged');
    const flg = z[3]; let p = 10;
    if (flg & 4) p += 2 + (z[p] | z[p + 1] << 8);
    if (flg & 8) while (p < z.length && z[p++]);
    if (flg & 16) while (p < z.length && z[p++]);
    if (flg & 2) p += 2;
    const r = inflateRaw(z, p, max);
    if (r.end + 8 > z.length) throw err('damaged');
    if (read32(z, r.end) !== crc32(r.out) || read32(z, r.end + 4) !== (r.out.length >>> 0)) throw err('damaged');
    return r.out;
  }

  // ---------- inflate (RFC 1951), after Mark Adler's puff ----------
  const LBASE = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258];
  const LEXT = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0];
  const DBASE = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577];
  const DEXT = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13];
  const ORDER = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
  function huff(lengths) {
    const count = new Uint16Array(16), offs = new Uint16Array(16), symbol = new Uint16Array(lengths.length);
    for (let s = 0; s < lengths.length; s++) count[lengths[s]]++;
    for (let len = 1; len < 15; len++) offs[len + 1] = offs[len] + count[len];
    for (let s = 0; s < lengths.length; s++) if (lengths[s]) symbol[offs[lengths[s]]++] = s;
    return { count, symbol };
  }
  let FIXED = null;
  function fixed() {
    if (FIXED) return FIXED;
    const l = new Uint8Array(288);
    for (let s = 0; s < 288; s++) l[s] = s < 144 ? 8 : s < 256 ? 9 : s < 280 ? 7 : 8;
    FIXED = { lc: huff(l), dc: huff(new Uint8Array(30).fill(5)) };
    return FIXED;
  }
  function inflateRaw(src, start, max) {
    let pos = start, bitbuf = 0, bitcnt = 0, n = 0;
    let out = new Uint8Array(Math.max(1024, Math.min(max, (src.length - start) * 4)));
    const room = k => {
      if (n + k <= out.length) return;
      if (n + k > max) throw err('too-big');
      let size = out.length * 2; while (size < n + k) size *= 2;
      const o = new Uint8Array(Math.min(size, max)); o.set(out.subarray(0, n)); out = o;
    };
    const bits = need => {
      let v = bitbuf;
      while (bitcnt < need) { if (pos >= src.length) throw err('damaged'); v |= src[pos++] << bitcnt; bitcnt += 8; }
      bitbuf = v >>> need; bitcnt -= need;
      return v & ((1 << need) - 1);
    };
    const decode = h => {
      let code = 0, first = 0, index = 0;
      for (let len = 1; len <= 15; len++) {
        code |= bits(1);
        const count = h.count[len];
        if (code - count < first) return h.symbol[index + (code - first)];
        index += count; first += count; first <<= 1; code <<= 1;
      }
      throw err('damaged');
    };
    const codes = (lc, dc) => {
      for (;;) {
        let sym = decode(lc);
        if (sym < 256) { room(1); out[n++] = sym; continue; }
        if (sym === 256) return;
        sym -= 257;
        if (sym >= 29) throw err('damaged');
        const len = LBASE[sym] + bits(LEXT[sym]);
        const ds = decode(dc);
        if (ds >= 30) throw err('damaged');
        const dist = DBASE[ds] + bits(DEXT[ds]);
        if (dist > n) throw err('damaged');
        room(len);
        for (let i = 0; i < len; i++) { out[n] = out[n - dist]; n++; }
      }
    };
    let last;
    do {
      last = bits(1);
      const type = bits(2);
      if (type === 0) {
        bitbuf = 0; bitcnt = 0;
        if (pos + 4 > src.length) throw err('damaged');
        const len = src[pos] | src[pos + 1] << 8, nlen = src[pos + 2] | src[pos + 3] << 8;
        pos += 4;
        if (len !== (~nlen & 0xffff) || pos + len > src.length) throw err('damaged');
        room(len); out.set(src.subarray(pos, pos + len), n); n += len; pos += len;
      } else if (type === 1) {
        const f = fixed(); codes(f.lc, f.dc);
      } else if (type === 2) {
        const nlen = bits(5) + 257, ndist = bits(5) + 1, ncode = bits(4) + 4;
        if (nlen > 286 || ndist > 30) throw err('damaged');
        const cl = new Uint8Array(19);
        for (let i = 0; i < ncode; i++) cl[ORDER[i]] = bits(3);
        const lencode = huff(cl), L = new Uint8Array(nlen + ndist);
        for (let i = 0; i < nlen + ndist;) {
          const sym = decode(lencode);
          if (sym < 16) { L[i++] = sym; continue; }
          let len = 0, rep;
          if (sym === 16) { if (i === 0) throw err('damaged'); len = L[i - 1]; rep = 3 + bits(2); }
          else if (sym === 17) rep = 3 + bits(3);
          else rep = 11 + bits(7);
          if (i + rep > nlen + ndist) throw err('damaged');
          while (rep--) L[i++] = len;
        }
        codes(huff(L.subarray(0, nlen)), huff(L.subarray(nlen)));
      } else throw err('damaged');
    } while (!last);
    return { out: out.slice(0, n), end: pos };
  }

  // ---------- the copy ----------
  const pageV = () => (G() ? G().pageV() : 3);
  async function pack(copy, opts) {
    opts = opts || {};
    const env = { fmt: FMT, v: copy && copy.v != null ? copy.v : pageV() };
    let bytes = await gzip(new TextEncoder().encode(JSON.stringify(copy)));
    if (opts.key) {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      bytes = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, opts.key, bytes));
      env.enc = 'aes-gcm'; env.iv = toB64(iv);
    }
    env.data = toB64(bytes);
    return env;
  }
  async function unpack(env, opts) {
    opts = opts || {};
    if (!env || typeof env !== 'object') return no('unknown');
    if (env.fmt !== FMT) return no('fmt');
    if (!mayRestore(env.v)) return no('newer');
    let bytes;
    try { bytes = fromB64(env.data); } catch (e) { return no('damaged'); }
    if (env.enc !== undefined) {
      if (env.enc !== 'aes-gcm') return no('fmt');
      if (!opts.key) return no('locked');
      try { bytes = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(env.iv) }, opts.key, bytes)); }
      catch (e) { return no('key'); }   // a wrong code, or a damaged copy: AES-GCM cannot tell them apart
    }
    let json;
    try { json = await gunzip(bytes, { max: opts.max }); } catch (e) { return no(e && e.code === 'too-big' ? 'too-big' : 'damaged'); }
    let copy;
    try { copy = JSON.parse(new TextDecoder().decode(json)); } catch (e) { return no('damaged'); }
    if (!copy || typeof copy !== 'object') return no('damaged');
    if (!mayRestore(copy.v)) return no('newer');
    return { ok: true, kind: 'gz1', copy };
  }
  async function toBlob(copy, opts) {
    return new Blob([JSON.stringify(await pack(copy, opts))], { type: 'application/json' });
  }
  // A file the person chose (an <input type="file"> File, or any Blob). Never through a text box.
  async function readFile(file, opts) {
    opts = opts || {};
    const max = opts.max || MAX;
    if (!file || typeof file.arrayBuffer !== 'function') return no('unknown');
    if (file.size > max) return no('too-big');
    let u = new Uint8Array(await file.arrayBuffer()), kind = null;
    if (u[0] === 0x1f && u[1] === 0x8b) {
      try { u = await gunzip(u, { max }); kind = 'gzip'; } catch (e) { return no(e && e.code === 'too-big' ? 'too-big' : 'damaged'); }
    }
    let text = new TextDecoder().decode(u);
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
    let d;
    try { d = JSON.parse(text); } catch (e) { return no(kind ? 'damaged' : 'unknown'); }
    if (!d || typeof d !== 'object' || Array.isArray(d)) return no('unknown');
    if (d.fmt !== undefined) return unpack(d, opts);
    if (d.steps && d.once && d.cfg) return { ok: true, kind: '3831', raw: text };   // the move reads it [SCHEMA_V3 11]
    if (d.v !== undefined) {
      if (!mayRestore(d.v)) return no('newer');
      if (+d.v >= 3) return { ok: true, kind: kind || 'json', copy: d };
    }
    return no('unknown');
  }

  root.BurrowPack = { FMT, WORDS, pack, unpack, toBlob, readFile, gzip, gunzip, inflateRaw, crc32,
    useNative(on) { native = !!on; }, hasNative };
})(typeof window !== 'undefined' ? window : globalThis);
