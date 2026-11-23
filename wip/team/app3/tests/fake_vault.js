/* A local stand-in for the vault server (functions/api/vault/[id].js and functions/api/health.js), for app3's tests.
   The real server is never called by a test. This copies the server's rules as they are today:
   - GET   404 when nothing is stored; 403 when the token's hash differs; else { blob, iv, rev, updated, created, size, hasPrev }
   - PUT   creates when nothing is stored; else refused 409 { rev, updated } when rev <= stored rev, or when a base is given
           and is not the stored rev (compare and swap); keeps the previous version as prev
   - DELETE removes it
   It runs as an http server (for the page) or as a fetch function (for node tests). `log` lists every call, so a test can
   prove what was sent (never plain money: only base64 ciphertext). */
'use strict';
const http = require('http'), crypto = require('crypto');
function makeVault() {
  const rows = new Map(), log = [];
  let now = 1764000000000;
  const sha = s => crypto.createHash('sha256').update(s).digest('hex');
  const res = (status, j) => ({ status, j });
  function handle(method, id, token, body) {
    log.push({ method, id, body: body ? JSON.parse(JSON.stringify(body)) : null });
    if (!/^[a-f0-9]{32,64}$/.test(id)) return res(400, { error: 'invalid_request' });
    if (!/^[a-f0-9]{32,128}$/.test(token || '')) return res(400, { error: 'invalid_request' });
    const row = rows.get(id);
    if (row && row.token_hash !== sha(token)) return res(403, { error: 'forbidden' });
    if (method === 'GET') {
      if (!row) return res(404, { error: 'not_found' });
      return res(200, { blob: row.blob, iv: row.iv, rev: row.rev, updated: row.updated, created: row.created, size: row.blob.length, hasPrev: !!row.prev });
    }
    if (method === 'DELETE') { rows.delete(id); return res(200, { deleted: !!row }); }
    if (method === 'PUT') {
      const b = body;
      if (!b || typeof b.blob !== 'string' || !b.blob || b.blob.length > 3000000 || !/^[A-Za-z0-9+/=]+$/.test(b.blob)) return res(400, { error: 'Bad blob.' });
      if (typeof b.iv !== 'string' || !/^[A-Za-z0-9+/=]{12,32}$/.test(b.iv)) return res(400, { error: 'Bad iv.' });
      const rev = Math.floor(+b.rev); if (!(rev > 0) || rev > 1e14) return res(400, { error: 'Bad rev.' });
      now += 1000;
      if (!row) { rows.set(id, { token_hash: sha(token), blob: b.blob, iv: b.iv, rev, updated: now, created: now, prev: null }); return res(200, { rev, updated: now, created: true }); }
      const base = Math.floor(+b.base || 0);
      if (!b.force && (rev <= row.rev || (base > 0 && base !== row.rev))) return res(409, { error: 'conflict', rev: row.rev, updated: row.updated });
      row.prev = { blob: row.blob, iv: row.iv, rev: row.rev };
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
    const r = handle(opts.method || 'GET', m[1], h['x-vault-token'], opts.body ? JSON.parse(opts.body) : null);
    return answer(r.status, r.j);
  }
  const answer = (status, j) => ({ status, ok: status >= 200 && status < 300, json: async () => j });
  return { rows, log, handle, fetch: fetchFn };
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
    if (u.pathname === '/api/health') { r.writeHead(200, Object.assign({ 'content-type': 'application/json' }, cors)); r.end(JSON.stringify({ ok: true, ai: false, vault: true, invite: false, version: 'test' })); return; }
    const m = /^\/api\/vault\/([^/]+)$/.exec(u.pathname);
    if (!m) { r.writeHead(404); r.end(); return; }
    let body = '';
    q.on('data', c => { body += c; });
    q.on('end', () => {
      let parsed = null; try { parsed = body ? JSON.parse(body) : null; } catch (e) { parsed = null; }
      const a = vault.handle(q.method, m[1], q.headers['x-vault-token'], parsed);
      r.writeHead(a.status, Object.assign({ 'content-type': 'application/json' }, cors)); r.end(JSON.stringify(a.j));
    });
  });
  return new Promise(ok => srv.listen(0, '127.0.0.1', () => ok({ srv, port: srv.address().port, close: () => new Promise(c => srv.close(c)) })));
}
module.exports = { makeVault, serve };
