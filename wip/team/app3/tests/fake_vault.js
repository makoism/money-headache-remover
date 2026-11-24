/* A local stand-in for the vault server (functions/api/vault/[id].js and functions/api/health.js), for app3's tests.
   The real server is never called by a test. This copies the server's rules (lane/vault, the five changes Mako approved);
   tests/vault_server/fake_parity.test.mjs runs the same calls on both and checks the answers match.
   Two kinds of copy: the old app's blob is ciphertext; app3's blob is the pack envelope as JSON in base64.
   - GET   404 when nothing is stored; 410 { deleted } when an app3 copy was deleted here; 403 when the token's hash differs;
           else { blob, iv, rev, updated, created, size, hasPrev }. ?versions=1 lists the 10 earlier versions kept, newest
           first ({ rev, updated, size }); ?rev=N reads one ({ blob, iv, rev, updated }), 404 when not kept.
   - PUT   an app3 copy: refused 422 unknown_format when fmt is not gz1, it is not encrypted (enc aes-gcm) or v is not a
           number, 422 newer_shape when v is above 3; over an app3 copy a blob that is not an envelope is 422 too.
           Creates when nothing is stored (410 after an app3 delete unless fresh: true). Else refused 409 { rev, updated }
           when an app3 write names no base, when rev <= stored rev, or when a base is given and is not the stored rev
           (compare and swap); force (old app only) skips the last two. The replaced copy joins the 10 kept versions.
   - DELETE removes it and its versions; an app3 copy leaves a deleted marker.
   Not copied: the per-day write limit (1,500) and the per-minute limit, which no app3 test reaches.
   It runs as an http server (for the page) or as a fetch function (for node tests). `log` lists every call, so a test can
   prove what was sent (never plain money: only base64 ciphertext). */
'use strict';
const http = require('http'), crypto = require('crypto');
const envelopeOf = blob => {
  if (typeof blob !== 'string' || blob.slice(0, 2) !== 'ey') return null;
  try { const e = JSON.parse(Buffer.from(blob, 'base64').toString('utf8')); return e && typeof e === 'object' && !Array.isArray(e) ? e : null; } catch (e) { return null; }
};
function makeVault() {
  const rows = new Map(), gone = new Map(), log = [];
  let now = 1764000000000;
  const sha = s => crypto.createHash('sha256').update(s).digest('hex');
  const res = (status, j) => ({ status, j });
  const err = (status, code, extra) => res(status, Object.assign({ error: { code } }, extra || {}));
  function handle(method, id, token, body, query) {
    const q = query || new URLSearchParams();
    log.push({ method, id, body: body ? JSON.parse(JSON.stringify(body)) : null, query: q.toString() });
    if (!/^[a-f0-9]{32,64}$/.test(id)) return err(400, 'invalid_request');
    if (!/^[a-f0-9]{32,128}$/.test(token || '')) return err(400, 'invalid_request');
    const row = rows.get(id), g = row ? null : gone.get(id);
    if ((row || g) && (row || g).token_hash !== sha(token)) return err(403, 'forbidden');
    if (method === 'GET') {
      if (g) return err(410, 'deleted', { deleted: g.at });
      if (!row) return err(404, 'not_found');
      if (q.get('versions') === '1') return res(200, { rev: row.rev, updated: row.updated, versions: row.versions.slice().reverse().map(v => ({ rev: v.rev, updated: v.updated, size: v.blob.length })) });
      if (q.has('rev')) {
        const want = Math.floor(+q.get('rev'));
        if (want === row.rev) return res(200, { blob: row.blob, iv: row.iv, rev: row.rev, updated: row.updated });
        const v = row.versions.slice().reverse().find(x => x.rev === want);
        return v ? res(200, { blob: v.blob, iv: v.iv, rev: v.rev, updated: v.updated }) : err(404, 'not_found');
      }
      return res(200, { blob: row.blob, iv: row.iv, rev: row.rev, updated: row.updated, created: row.created, size: row.blob.length, hasPrev: row.versions.length > 0 });
    }
    if (method === 'DELETE') {
      if (row) { rows.delete(id); if (envelopeOf(row.blob)) gone.set(id, { token_hash: row.token_hash, at: now }); }
      return res(200, { deleted: !!row });
    }
    if (method === 'PUT') {
      const b = body;
      if (!b || typeof b.blob !== 'string' || !b.blob || b.blob.length > 3000000 || !/^[A-Za-z0-9+/=]+$/.test(b.blob)) return err(400, 'invalid_request');
      if (typeof b.iv !== 'string' || !/^[A-Za-z0-9+/=]{12,32}$/.test(b.iv)) return err(400, 'invalid_request');
      const rev = Math.floor(+b.rev); if (!(rev > 0) || rev > 1e14) return err(400, 'invalid_request');
      const e = envelopeOf(b.blob);
      if (e) {
        if (e.fmt !== 'gz1' || e.enc !== 'aes-gcm' || typeof e.data !== 'string' || typeof e.v !== 'number' || !isFinite(e.v)) return err(422, 'unknown_format');
        if (e.v > 3) return err(422, 'newer_shape');
      } else if (row && envelopeOf(row.blob)) return err(422, 'unknown_format');
      if (g && b.fresh !== true) return err(410, 'deleted', { deleted: g.at });
      now += 1000;
      if (!row) { gone.delete(id); rows.set(id, { token_hash: sha(token), blob: b.blob, iv: b.iv, rev, updated: now, created: now, versions: [] }); return res(200, { rev, updated: now, created: true }); }
      const isNew = !!(e || envelopeOf(row.blob)), base = Math.floor(+b.base || 0), force = !!b.force && !isNew;
      if (isNew && !(base > 0)) return err(409, 'conflict', { rev: row.rev, updated: row.updated });
      if (!force && (rev <= row.rev || (base > 0 && base !== row.rev))) return err(409, 'conflict', { rev: row.rev, updated: row.updated });
      row.versions.push({ blob: row.blob, iv: row.iv, rev: row.rev, updated: row.updated });
      if (row.versions.length > 10) row.versions.splice(0, row.versions.length - 10);
      Object.assign(row, { blob: b.blob, iv: b.iv, rev, updated: now });
      return res(200, { rev, updated: now, created: false });
    }
    return res(405, {});
  }
  // a fetch for node tests: same answers as over http
  async function fetchFn(url, opts) {
    opts = opts || {};
    const u = new URL(url, 'http://vault.test');
    if (u.pathname === '/api/health') return answer(200, { ok: true, ai: false, vault: true, invite: false, version: 'test' });
    const m = /^\/api\/vault\/([^/]+)$/.exec(u.pathname);
    if (!m) return answer(404, {});
    const h = opts.headers || {};
    const r = handle(opts.method || 'GET', m[1], h['x-vault-token'], opts.body ? JSON.parse(opts.body) : null, u.searchParams);
    return answer(r.status, r.j);
  }
  const answer = (status, j) => ({ status, ok: status >= 200 && status < 300, json: async () => j });
  return { rows, gone, log, handle, fetch: fetchFn };
}
/* the vault and the page on one local http server (the page's own address is where the vault is, as on the site) */
function serve(vault, pageHtml, opts) {
  opts = opts || {};
  const srv = http.createServer((q, r) => {
    const u = new URL(q.url, 'http://x');
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, PUT, DELETE, OPTIONS', 'access-control-allow-headers': 'content-type, x-vault-token, x-app' };
    if (q.method === 'OPTIONS') { r.writeHead(204, cors); r.end(); return; }
    if (u.pathname === '/' || u.pathname === '/index.html') { r.writeHead(200, { 'content-type': 'text/html', 'cache-control': 'no-store' }); r.end(typeof pageHtml === 'function' ? pageHtml() : pageHtml); return; }
    if (u.pathname === '/sw3.js') { r.writeHead(200, { 'content-type': 'text/javascript', 'cache-control': 'no-store' }); r.end(typeof opts.sw === 'function' ? opts.sw() : require('fs').readFileSync(require('path').join(__dirname, '../sw3.js'))); return; }
    if (/^\/(manifest3\.webmanifest|icon3-(192|512)\.png)$/.test(u.pathname)) {   // what installing to the home screen reads, beside the page as publish3.sh writes it (M33)
      r.writeHead(200, { 'content-type': u.pathname.endsWith('.png') ? 'image/png' : 'application/manifest+json' }); r.end(require('fs').readFileSync(require('path').join(__dirname, '..', u.pathname.slice(1)))); return;
    }
    if (u.pathname === '/api/health') { r.writeHead(200, Object.assign({ 'content-type': 'application/json' }, cors)); r.end(JSON.stringify({ ok: true, ai: false, vault: true, invite: false, version: 'test' })); return; }
    const m = /^\/api\/vault\/([^/]+)$/.exec(u.pathname);
    if (!m) { r.writeHead(404); r.end(); return; }
    let body = '';
    q.on('data', c => { body += c; });
    q.on('end', () => {
      let parsed = null; try { parsed = body ? JSON.parse(body) : null; } catch (e) { parsed = null; }
      const a = vault.handle(q.method, m[1], q.headers['x-vault-token'], parsed, u.searchParams);
      r.writeHead(a.status, Object.assign({ 'content-type': 'application/json' }, cors)); r.end(JSON.stringify(a.j));
    });
  });
  return new Promise(ok => srv.listen(0, '127.0.0.1', () => ok({ srv, port: srv.address().port, close: () => new Promise(c => srv.close(c)) })));
}
module.exports = { makeVault, serve };
