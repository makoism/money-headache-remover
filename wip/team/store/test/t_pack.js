// store/pack.js: backup files and cloud blobs `{ fmt: 'gz1', v, data }`, gzipped before encryption, with a fallback
// where CompressionStream is missing, read from the file itself without a text box [D5].
'use strict';

const KEY = () => crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);

module.exports = [
  { name: 'round trip without a key: same copy back, fmt and v on the outside, much smaller', run: async t => {
    const p = await t.page();
    const r = await p.evaluate(async () => {
      const c = window.makeCopy(1000);
      const env = await window.BurrowPack.pack(c);
      const back = await window.BurrowPack.unpack(env);
      return { keys: Object.keys(env).sort(), fmt: env.fmt, v: env.v, ratio: env.data.length / JSON.stringify(c).length, back, c };
    });
    t.assert.eq([r.keys, r.fmt, r.v], [['data', 'fmt', 'v'], 'gz1', 3], 'the outside');
    t.assert.eq(r.back.ok, true, 'opened');
    t.assert.same(r.back.copy, r.c, 'same copy');
    t.assert(r.ratio < 0.3, 'gzip shrinks it (base64 text against JSON text)', r.ratio);
    t.log('1,000 made-up events: packed to ' + (r.ratio * 100).toFixed(0) + '% of the JSON text');
  } },

  { name: 'with a key: gzipped, then encrypted; no key, or the wrong key, is a clear refusal', run: async t => {
    const p = await t.page();
    const r = await p.evaluate(async k => {
      const key = await eval(k)(), other = await eval(k)(), c = window.makeCopy(50), P = window.BurrowPack;
      const env = await P.pack(c, { key });
      const ok = await P.unpack(env, { key }), none = await P.unpack(env), wrong = await P.unpack(env, { key: other });
      return { keys: Object.keys(env).sort(), ok: ok.ok, same: JSON.stringify(ok.copy) === JSON.stringify(c), none: none.why, wrong: wrong.why };
    }, KEY.toString());
    t.assert.eq(r, { keys: ['data', 'enc', 'fmt', 'iv', 'v'], ok: true, same: true, none: 'locked', wrong: 'key' }, 'encrypted');
  } },

  { name: 'the fallback without CompressionStream: each side reads what the other wrote (stored, fixed and dynamic blocks)', run: async t => {
    const p = await t.page();
    const r = await p.evaluate(async () => {
      const P = window.BurrowPack, out = [];
      const copies = [{ v: 3 }, { v: 3, note: 'a' }, window.makeCopy(30), window.makeCopy(3000)];
      for (const c of copies) {
        P.useNative(true); const nat = await P.pack(c);
        P.useNative(false); const fb = await P.pack(c);
        const a = await P.unpack(nat);            // fallback inflate reads the browser's gzip
        P.useNative(true); const b = await P.unpack(fb);   // the browser reads the fallback's gzip
        out.push([JSON.stringify(a.copy) === JSON.stringify(c), JSON.stringify(b.copy) === JSON.stringify(c)]);
      }
      // random bytes and repeated text straight through gzip and the fallback gunzip
      let same = 0;
      for (let i = 0; i < 40; i++) {
        const n = [0, 1, 7, 100, 4000, 70000, 200000][i % 7], b = new Uint8Array(n);
        for (let j = 0; j < n; j++) b[j] = i % 2 ? (Math.random() * 256) | 0 : 'abcabd'.charCodeAt(j % 6) + (j % 977 === 0 ? 1 : 0);
        P.useNative(true); const z = await P.gzip(b);
        P.useNative(false); const u = await P.gunzip(z); const z2 = await P.gzip(b); P.useNative(true); const u2 = await P.gunzip(z2);
        if (u.length === n && u.every((x, j) => x === b[j]) && u2.length === n && u2.every((x, j) => x === b[j])) same++;
      }
      return { out, same };
    });
    t.assert.eq(r.out, [[true, true], [true, true], [true, true], [true, true]], 'copies both ways');
    t.assert.eq(r.same, 40, '40 byte runs both ways');
  } },

  { name: 'refusals: an unknown fmt, a newer shape (the page keeps working), damaged data, too big once opened', run: async t => {
    const p = await t.page();
    const r = await p.evaluate(async () => {
      const P = window.BurrowPack, env = await P.pack(window.makeCopy(20));
      const flip = Object.assign({}, env, { data: env.data.slice(0, 40) + (env.data[40] === 'A' ? 'B' : 'A') + env.data.slice(41) });
      const bomb = await P.pack({ v: 3, pad: 'x'.repeat(30e6) });
      const out = [
        (await P.unpack(Object.assign({}, env, { fmt: 'gz9' }))).why,
        (await P.unpack(Object.assign({}, env, { v: 4 }))).why,
        window.BurrowGuard.readOnly(),
        (await P.unpack(flip)).why,
        (await P.unpack(Object.assign({}, env, { data: '%%%' }))).why,
        (await P.unpack(bomb, { max: 10e6 })).why,
        bomb.data.length < 100000,
      ];
      P.useNative(false); out.push((await P.unpack(bomb, { max: 10e6 })).why); P.useNative(true);
      out.push(P.WORDS.newer, P.WORDS.damaged);
      return out;
    });
    t.assert.eq(r.slice(0, 8), ['fmt', 'newer', false, 'damaged', 'damaged', 'too-big', true, 'too-big'], 'each refusal');
    t.assert(/Update the app/.test(r[8]) && !/—/.test(r[8] + r[9]), 'words', r.slice(8));
  } },

  { name: 'a backup file is read from the file itself, chosen in a file box, never pasted into a text box', run: async t => {
    const p = await t.page();
    const files = await p.evaluate(async () => {
      const P = window.BurrowPack, c = window.makeCopy(10);
      const toB64 = async b => { const u = new Uint8Array(await b.arrayBuffer()); let s = ''; u.forEach(x => { s += String.fromCharCode(x); }); return btoa(s); };
      const gz = new Blob([await P.gzip(new TextEncoder().encode(JSON.stringify(c)))]);
      return {
        backup: await toB64(await P.toBlob(c)),
        gz: await toB64(gz),
        plain: btoa(JSON.stringify(c)),
        old: btoa(JSON.stringify({ rev: 1763800000000, steps: { a: 250000 }, once: {}, cfg: { cur: '¥' }, receipts: [] }).replace(/¥/g, 'Y')),
        junk: btoa('hello'),
      };
    });
    await p.evaluate(() => { const i = document.createElement('input'); i.type = 'file'; i.id = 'f'; document.body.appendChild(i); });
    const got = {};
    for (const [k, b64] of Object.entries(files)) {
      await p.setInputFiles('#f', { name: k + '.burrow', mimeType: 'application/octet-stream', buffer: Buffer.from(b64, 'base64') });
      got[k] = await p.evaluate(async () => { const r = await window.BurrowPack.readFile(document.getElementById('f').files[0]); return { ok: r.ok, kind: r.kind, why: r.why, n: r.copy && r.copy.events.length, raw: r.raw }; });
    }
    t.assert.eq(got.backup, { ok: true, kind: 'gz1', n: 10 }, 'a gz1 backup');
    t.assert.eq(got.gz, { ok: true, kind: 'gzip', n: 10 }, 'a plain .gz of a copy');
    t.assert.eq(got.plain, { ok: true, kind: 'json', n: 10 }, 'a plain JSON copy');
    t.assert.eq([got.old.ok, got.old.kind, typeof got.old.raw], [true, '3831', 'string'], 'a 38.31 backup is handed to the move as its raw text');
    t.assert.eq([got.junk.ok, got.junk.why], [false, 'unknown'], 'not a backup');
    t.assert.eq(await p.evaluate(() => document.querySelectorAll('textarea').length), 0, 'no text box');
  } },

  { name: '30,000 events packed and opened with a key under 4x CPU slowdown, small enough for the vault', run: async t => {
    const p = await t.page();
    await p.evaluate(() => { window.C = window.makeCopy(30000); });
    const s = await p.context().newCDPSession(p);
    await s.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const r = await p.evaluate(async k => {
      const key = await eval(k)(), P = window.BurrowPack, text = JSON.stringify(window.C).length;
      let t0 = performance.now(); const env = await P.pack(window.C, { key }); const packMs = performance.now() - t0;
      t0 = performance.now(); const back = await P.unpack(env, { key }); const openMs = performance.now() - t0;
      return { text, size: JSON.stringify(env).length, packMs, openMs, n: back.copy.events.length };
    }, KEY.toString());
    t.log('30,000 events: ' + (r.text / 1e6).toFixed(1) + 'M characters of JSON packed to ' + (r.size / 1e6).toFixed(2) + 'M; 4x slower CPU: pack ' +
      r.packMs.toFixed(0) + ' ms (budget 4000), open ' + r.openMs.toFixed(0) + ' ms (budget 4000)');
    t.assert.eq(r.n, 30000, 'all back');
    t.assert(r.size < 1.8e6, 'under the vault\'s 1.8M characters', r.size);
    t.assert(r.packMs < 4000 && r.openMs < 4000, 'within budget', r);
  } },
];
