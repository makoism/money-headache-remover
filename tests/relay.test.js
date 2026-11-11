/* End-to-end checks of the Pages Functions against wrangler pages dev (port 8788) and the Anthropic stub (port 8790). */
const BASE = process.env.BASE || 'http://127.0.0.1:8788';
let pass = 0, fail = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); c ? pass++ : fail++; };
const post = (path, body, headers) => fetch(BASE + path, { method: 'POST', headers: Object.assign({ 'content-type': 'application/json' }, headers || {}), body: JSON.stringify(body) });
const anon = 'testanon_' + Math.random().toString(36).slice(2, 10);
const msg = (text, extra) => Object.assign({ v: 1, anon, tier: 'quick', messages: [{ role: 'user', content: text }] }, extra || {});
(async () => {
  let r = await fetch(BASE + '/api/health'); let j = await r.json();
  ok(r.ok && j.ai && j.vault, 'health reports ai and vault: ' + JSON.stringify(j));
  // plain call
  r = await post('/api/ai', msg('hello there', { system: 'Page rules here.' })); j = await r.json();
  ok(r.status === 200 && /^ECHO/.test(j.text), 'plain call answers: ' + (j.text || '').slice(0, 80));
  ok(/model=claude-haiku-5-5/.test(j.text), 'quick tier maps to the haiku model');
  ok(/sys=\d+/.test(j.text) && +j.text.match(/sys=(\d+)/)[1] > 'Page rules here.'.length, 'server prefix is added to the system text');
  ok(j.usage && j.usage.input === 40 && j.usage.output === 33 && j.truncated === false, 'usage and truncated are reported');
  r = await post('/api/ai', msg('MAKETRUNC', { tier: 'default' })); j = await r.json();
  ok(j.truncated === true && /model=claude-sonnet-5-5/.test(j.text), 'default tier maps to sonnet, truncated passes through');
  // json flag
  r = await post('/api/ai', msg('WANTJSON', { json: true })); j = await r.json();
  ok(j.text === '{"ok":true,"n":3}', 'json flag: text is the JSON answer');
  // images
  const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  r = await post('/api/ai', { v: 1, anon, messages: [{ role: 'user', content: [{ type: 'text', text: 'read this' }, { type: 'image', source: { type: 'base64', media_type: 'image/png', data: png } }] }] }); j = await r.json();
  ok(r.status === 200 && /imgs=1/.test(j.text), 'image block passes through: ' + (j.text || '').slice(0, 60));
  // tools: first round returns tool_use content
  r = await post('/api/ai', msg('use a tool', { tools: [{ name: 'get_plan', description: 'reads the plan', input_schema: { type: 'object', properties: { q: { type: 'string' } } } }] })); j = await r.json();
  ok(r.status === 200 && j.stop_reason === 'tool_use' && j.content.some(b => b.type === 'tool_use' && b.name === 'get_plan'), 'tools: tool_use round comes back whole');
  // second round with tool_result
  r = await post('/api/ai', { v: 1, anon, tier: 'quick', tools: [{ name: 'get_plan', description: 'x', input_schema: { type: 'object' } }], messages: [{ role: 'user', content: 'use a tool' }, { role: 'assistant', content: j.content }, { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'tu_1', content: '{"play":320}' }] }] }); j = await r.json();
  ok(r.status === 200 && /tool_result/.test(j.text), 'tools: tool_result round answers with text');
  // streaming
  r = await post('/api/ai', msg('stream me please', { stream: true }));
  ok(r.status === 200 && /text\/event-stream/.test(r.headers.get('content-type')), 'stream: event-stream content type');
  let txt = '', done = null; const raw = await r.text();
  raw.split('\n\n').forEach(b => { const l = b.split('\n').find(x => x.startsWith('data:')); if (!l) return; const e = JSON.parse(l.slice(5)); if (e.t) txt += e.t; if (e.done) done = e; });
  ok(/^ECHO/.test(txt) && /stream me please/.test(txt), 'stream: deltas rebuild the text: ' + txt.slice(0, 50));
  ok(done && done.usage && done.usage.input === 40 && done.usage.output === 33 && done.truncated === false, 'stream: final line carries usage');
  // errors from upstream
  r = await post('/api/ai', msg('MAKE429')); j = await r.json(); ok(r.status === 429 && j.error.code === 'rate_limited', 'upstream 429 becomes rate_limited');
  r = await post('/api/ai', msg('MAKECREDIT')); j = await r.json(); ok(r.status === 503 && j.error.code === 'relay_unconfigured' && /no credit left/.test(j.error.message), 'a credit-balance refusal becomes relay_unconfigured with a plain message');
  r = await post('/api/ai', msg('MAKE500')); j = await r.json(); ok(r.status === 502 && j.error.code === 'upstream_error', 'upstream 500 becomes upstream_error');
  // validation
  r = await post('/api/ai', { v: 1, anon, messages: [] }); j = await r.json(); ok(r.status === 400 && j.error.code === 'invalid_request', 'empty messages refused');
  r = await post('/api/ai', { v: 1, anon: 'x', messages: [{ role: 'user', content: 'hi' }] }); ok(r.status === 400, 'short anon refused');
  r = await post('/api/ai', { v: 1, anon, messages: [{ role: 'user', content: 'hi' }, { role: 'assistant', content: 'yo' }] }); ok(r.status === 400, 'last message must be user');
  r = await post('/api/ai', { v: 1, anon, messages: [{ role: 'user', content: 'x'.repeat(270000) }] }); j = await r.json(); ok(r.status === 400 && /text/i.test(j.error.message), 'too much text refused');
  r = await post('/api/ai', { v: 1, anon, messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: 'image/bmp', data: 'AAAA' } }] }] }); ok(r.status === 400, 'bad image type refused');
  r = await fetch(BASE + '/api/ai', { method: 'OPTIONS' }); ok(r.status === 204 && r.headers.get('access-control-allow-origin') === '*', 'preflight answers');
  // per-browser daily cap (USER_DAILY_CALLS=50 in the dev command): burn through it
  const a2 = 'capanon_' + Math.random().toString(36).slice(2, 10); let last = 0, hit = 0;
  for (let i = 0; i < 60; i++) { r = await post('/api/ai', { v: 1, anon: a2, tier: 'quick', messages: [{ role: 'user', content: 'n' + i }] }); last = r.status; if (r.status === 429) { hit = i; break; } }
  ok(last === 429 && hit >= 50 && hit <= 52, `daily cap stops the browser after ${hit} calls (expected about 50)`);

  // ---- vault ----
  const id = 'ab'.repeat(16), tok = 'cd'.repeat(16), H = { 'x-vault-token': tok, 'content-type': 'application/json' };
  const V = '/api/vault/' + id;
  r = await fetch(BASE + V, { headers: H }); ok(r.status === 404, 'vault: empty id is 404');
  r = await fetch(BASE + V, { method: 'PUT', headers: H, body: JSON.stringify({ blob: 'QUJD', iv: 'AAAAAAAAAAAAAAAA', rev: 1000 }) }); j = await r.json();
  ok(r.status === 200 && j.created === true && j.rev === 1000, 'vault: first PUT creates');
  r = await fetch(BASE + V, { headers: H }); j = await r.json(); ok(r.status === 200 && j.blob === 'QUJD' && j.rev === 1000 && j.hasPrev === false, 'vault: GET returns the blob');
  r = await fetch(BASE + V, { method: 'PUT', headers: H, body: JSON.stringify({ blob: 'REVG', iv: 'BBBBBBBBBBBBBBBB', rev: 999 }) }); j = await r.json();
  ok(r.status === 409 && j.error.code === 'conflict' && j.rev === 1000, 'vault: older rev is a conflict that names the server rev');
  r = await fetch(BASE + V, { method: 'PUT', headers: H, body: JSON.stringify({ blob: 'REVG', iv: 'BBBBBBBBBBBBBBBB', rev: 2000 }) }); j = await r.json(); ok(r.status === 200 && j.created === false, 'vault: newer rev updates');
  r = await fetch(BASE + V + '?prev=1', { headers: H }); j = await r.json(); ok(j.blob === 'REVG' && j.hasPrev && j.prev && j.prev.blob === 'QUJD' && j.prev.rev === 1000, 'vault: previous version kept');
  r = await fetch(BASE + V, { headers: { 'x-vault-token': 'ef'.repeat(16) } }); ok(r.status === 403, 'vault: wrong token is 403');
  r = await fetch(BASE + V, { method: 'PUT', headers: H, body: JSON.stringify({ blob: 'XYZ', iv: 'BBBBBBBBBBBBBBBB', rev: 1500, force: true }) }); ok(r.status === 200, 'vault: force overwrites with a lower rev');
  r = await fetch(BASE + '/api/vault/zz', { headers: H }); ok(r.status === 400, 'vault: bad id is 400');
  r = await fetch(BASE + V, { method: 'PUT', headers: H, body: JSON.stringify({ blob: 'not base64!', iv: 'BBBBBBBBBBBBBBBB', rev: 3000 }) }); ok(r.status === 400, 'vault: bad blob refused');
  r = await fetch(BASE + V, { method: 'DELETE', headers: H }); j = await r.json(); ok(r.status === 200 && j.deleted === true, 'vault: DELETE removes');
  r = await fetch(BASE + V, { headers: H }); ok(r.status === 404, 'vault: gone after delete');
  console.log(`RELAY TESTS: ${pass} pass, ${fail} fail`); process.exit(fail ? 1 : 0);
})().catch(e => { console.log('CRASH', e); process.exit(2); });
