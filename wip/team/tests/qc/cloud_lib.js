/* Shared by the cloud copy tests (cloud_move.js, cloud_fail.js). Made-up numbers only.
   A small server on this machine: it serves the built page, and keeps cloud copies in memory with the same answers as
   functions/api/vault/[id].js (GET, PUT with 409 when the copy held is not older, DELETE). Nothing leaves the machine.
   Each profile() is its own browser with its own empty storage, like a second phone. */
const http = require('http'), fs = require('fs');
const L = require('./lib_r12.js'); const R = L.R;
const BUILD = process.env.BUILD || '/home/claude/work/money-map-team.html';
exports.L = L; exports.R = R; exports.w = R.w;

exports.server = () => new Promise(done => {
  const st = { store: {}, mode: 'ok', puts: 0, gets: 0 };   /* mode: ok | 500 | drop (the connection is cut, like no signal) */
  const send = (res, code, obj) => { res.writeHead(code, { 'content-type': 'application/json', 'cache-control': 'no-store' }); res.end(JSON.stringify(obj)); };
  const srv = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    if (u.pathname === '/' || u.pathname === '/index.html') { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }); res.end(fs.readFileSync(BUILD)); return; }
    if (u.pathname === '/api/health') return send(res, 200, { ai: false, vault: true, invite: false });
    const m = /^\/api\/vault\/([a-f0-9]{32,64})$/.exec(u.pathname);
    if (!m) { res.writeHead(204); res.end(); return; }   /* fonts, icons, the service worker: not part of these tests */
    if (st.mode === 'drop') { req.socket.destroy(); return; }
    if (st.mode === '500') return send(res, 500, { error: 'server' });
    const id = m[1], row = st.store[id], token = req.headers['x-vault-token'] || '';
    if (row && row.token !== token) return send(res, 403, { error: 'forbidden' });
    if (req.method === 'GET') { st.gets++; if (!row) return send(res, 404, { error: 'not_found' }); return send(res, 200, { blob: row.blob, iv: row.iv, rev: row.rev, updated: row.updated }); }
    if (req.method === 'DELETE') { delete st.store[id]; return send(res, 200, { deleted: !!row }); }
    if (req.method === 'PUT') {
      let body = ''; req.on('data', c => { body += c; }); req.on('end', () => {
        let b; try { b = JSON.parse(body); } catch (e) { return send(res, 400, { error: 'invalid_request' }); }
        if (row && !b.force && (b.rev <= row.rev || (b.base && b.base !== row.rev))) return send(res, 409, { error: 'conflict', rev: row.rev, updated: row.updated });
        st.puts++; st.store[id] = { token, blob: b.blob, iv: b.iv, rev: b.rev, updated: Date.now() }; send(res, 200, { rev: b.rev, updated: Date.now(), created: !row });
      }); return;
    }
    res.writeHead(405); res.end();
  });
  srv.listen(0, '127.0.0.1', () => done({ st, url: 'http://127.0.0.1:' + srv.address().port + '/?sfxtest', close: () => srv.close() }));
});

/* one browser profile on the page. opt.tour: leave the first-open setup on screen (default: skip it with its own Skip button) */
exports.profile = async (url, opt = {}) => {
  const o = await R.phone(Object.assign({ w: 412, h: 915, dpr: 1, mobile: true, keep: true }, opt));
  await o.p.goto(url); await R.w(1500);
  if (!opt.tour) await exports.skipTour(o.p);
  return o;
};
exports.skipTour = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && (s.offsetParent || s.getClientRects().length)) s.click(); }, id); await R.w(500); } };
/* what a person can do on a screen: see it, tap it, type into it */
exports.seen = (p, sel) => p.evaluate(sel => { const e = document.querySelector(sel); return !!(e && !e.closest('[hidden]') && (e.offsetParent || e.getClientRects().length)); }, sel);
exports.text = (p, sel) => p.evaluate(sel => { const e = document.querySelector(sel); return e && !e.closest('[hidden]') ? e.innerText.trim() : ''; }, sel);
exports.tap = async (p, sel) => { const ok = await exports.seen(p, sel); if (!ok) return false; await p.evaluate(sel => { const e = document.querySelector(sel); e.scrollIntoView({ block: 'center' }); }, sel); await R.w(120); await p.click(sel); await R.w(450); return true; };
exports.until = async (fn, ms = 9000) => { const t = Date.now(); for (;;) { const v = await fn(); if (v) return v; if (Date.now() - t > ms) return v; await R.w(250); } };
