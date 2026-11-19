/* Test use only: runs the relay handler (functions/api/ai.js) in plain node against the stand-in for Anthropic (tests/stub_anthropic.js)
   and the stand-in database (tests/vault_d1_shim.js). No wrangler, no browser.
   The real Anthropic API is never called: every outgoing request that is not to 127.0.0.1 is stopped here and answered with a fake 401. */
const { spawn } = require('child_process'), path = require('path'), { pathToFileURL } = require('url');
const { makeDb } = require('./vault_d1_shim.js');
const PORT = 8793, UP = 'http://127.0.0.1:' + PORT;
const realFetch = globalThis.fetch, seen = { up: [], blocked: [] };
globalThis.fetch = async (url, opt) => {
  const u = String(url && url.url ? url.url : url);
  if (!u.startsWith('http://127.0.0.1:')) { seen.blocked.push({ url: u, key: opt && opt.headers && opt.headers['x-api-key'] }); return new Response(JSON.stringify({ error: { type: 'authentication_error', message: 'stopped by the test harness' } }), { status: 401, headers: { 'content-type': 'application/json' } }); }
  let body = null; try { body = JSON.parse(opt.body); } catch (e) { body = null; }
  seen.up.push({ url: u, body });
  return realFetch(url, opt);
};
let child = null;
async function startStub() {
  child = spawn(process.execPath, [path.join(__dirname, 'stub_anthropic.js'), String(PORT)], { stdio: 'ignore' });
  for (let i = 0; i < 50; i++) { try { await realFetch(UP + '/v1/messages', { method: 'POST', body: '{}' }); return; } catch (e) { await new Promise(r => setTimeout(r, 100)); } }
  throw new Error('the stub did not start');
}
const stopStub = () => { if (child) child.kill(); };
let mod = null;
const handler = async () => mod || (mod = await import(pathToFileURL(path.join(__dirname, '..', 'functions', 'api', 'ai.js')).href));
const baseEnv = extra => Object.assign({ DB: makeDb(), ANTHROPIC_API_KEY: 'test-key', ANTHROPIC_BASE_URL: UP, RELAY_TEST: '1', IP_PER_MINUTE: '100000' }, extra || {});
/* one POST /api/ai the way worker/index.js hands it over; returns the Response */
async function send(env, body, opt) {
  opt = opt || {}; const m = await handler(), waits = [];
  const headers = Object.assign({ 'content-type': 'application/json', 'cf-connecting-ip': opt.ip || '10.1.1.1' }, opt.headers || {});
  const request = new Request('http://test.local/api/ai', { method: 'POST', headers, body: typeof body === 'string' ? body : JSON.stringify(body), signal: opt.signal });
  const res = await m.onRequestPost({ request, env, params: {}, waitUntil: p => waits.push(p) });
  res.settled = () => Promise.all(waits);
  return res;
}
async function post(env, body, opt) { const res = await send(env, body, opt); let j = null; try { j = await res.json(); } catch (e) { j = null; } await res.settled(); return { status: res.status, j: j || {} }; }
const usage = (env, k) => env.DB.raw.prepare('SELECT COALESCE(SUM(calls), 0) AS calls, COALESCE(SUM(tokens), 0) AS tokens FROM usage WHERE k = ?').get(k);
module.exports = { startStub, stopStub, send, post, baseEnv, usage, seen, UP };
