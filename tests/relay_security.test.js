/* The relay's limits, from the security review (SECURITY_REVIEW.md: S5/S11, S6, S10, S12, L2, L5).
   Run: node tests/relay_security.test.js     Uses a fake Anthropic only (see tests/relay_harness.js). */
const { startStub, stopStub, send, post, baseEnv, usage, seen } = require('./relay_harness.js');
let pass = 0, failN = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); c ? pass++ : failN++; };
let n = 0; const anon = () => 'secanon_' + String(++n).padStart(6, '0');
const msg = (text, extra) => Object.assign({ v: 1, anon: anon(), tier: 'quick', messages: [{ role: 'user', content: text }] }, extra || {});
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  await startStub();
  let env = baseEnv(), r;
  r = await post(env, msg('hello')); ok(r.status === 200 && /^ECHO/.test(r.j.text), 'the harness works: a plain call answers through the fake Anthropic');

  /* ---- L5: ANTHROPIC_BASE_URL only counts together with the test flag; the key is never sent to another host by a stray setting ---- */
  let before = seen.up.length;
  r = await post(baseEnv({ RELAY_TEST: undefined }), msg('hi'));
  ok(r.status === 503 && r.j.error.code === 'relay_unconfigured' && seen.up.length === before, 'base url: with ANTHROPIC_BASE_URL set and no RELAY_TEST the relay refuses and sends the key nowhere');
  seen.blocked.length = 0;
  r = await post(baseEnv({ RELAY_TEST: undefined, ANTHROPIC_BASE_URL: undefined }), msg('hi'));
  ok(seen.blocked.length === 1 && /^https:\/\/api\.anthropic\.com\/v1\/messages$/.test(seen.blocked[0].url), 'base url: with neither set the call goes to api.anthropic.com (stopped by the harness, nothing left this machine)');

  /* ---- S6: wrong invite words are counted and limited; the per-minute counter runs before the invite check ---- */
  env = baseEnv({ INVITE_CODES: 'three plain words' });
  const A = { ip: '203.0.113.5' }; let codes = [];
  for (let i = 0; i < 10; i++) codes.push((await post(env, msg('x', { invite: 'guess' + i }), A)).status);
  ok(codes.every(c => c === 401), 'invite: the first 10 wrong words from one address get 401');
  r = await post(env, msg('x', { invite: 'guess10' }), A);
  ok(r.status === 429 && r.j.error.code === 'rate_limited', 'invite: the 11th wrong word that day gets 429');
  r = await post(env, msg('x', { invite: 'three plain words' }), A);
  ok(r.status === 429, 'invite: after that even the right word is refused from that address until tomorrow, so guessing cannot go on');
  r = await post(env, msg('x', { invite: 'Three Plain Words' }), { ip: '203.0.113.6' });
  ok(r.status === 200, 'invite: another address with the right word is not affected');
  codes = []; for (let i = 0; i < 15; i++) codes.push((await post(env, msg('x'), { ip: '203.0.113.7' })).status);
  r = await post(env, msg('x', { invite: 'three plain words' }), { ip: '203.0.113.7' });
  ok(codes.every(c => c === 401) && r.status === 200, 'invite: calls with no word at all are refused but are not counted as guesses');
  env = baseEnv({ INVITE_CODES: 'three plain words', IP_PER_MINUTE: '5' }); codes = [];
  for (let i = 0; i < 7; i++) codes.push((await post(env, msg('x', { invite: '' }), { ip: '203.0.113.8' })).status);
  ok(codes.slice(0, 5).every(c => c === 401) && codes[5] === 429 && codes[6] === 429, 'invite: refused calls count toward the per-minute limit: ' + codes.join(' '));

  /* ---- S5/S11: the limits do not fail open ---- */
  r = await post(baseEnv({ DB: undefined }), msg('hi'));
  ok(r.status === 503 && r.j.error.code === 'relay_unconfigured', 'limits: with no database and no invite word the relay refuses (nothing would cap it)');
  const broken = { prepare() { throw new Error('db down'); }, batch() { return Promise.reject(new Error('db down')); } };
  r = await post(baseEnv({ DB: broken }), msg('hi'));
  ok(r.status === 503, 'limits: with a database that fails and no invite word the relay refuses');
  r = await post(baseEnv({ DB: undefined, INVITE_CODES: 'three plain words' }), msg('hi', { invite: 'three plain words' }));
  ok(r.status === 200, 'limits: an invited caller is still served when the counters cannot be read');
  env = baseEnv({ IP_DAILY_CALLS: '3' }); codes = [];
  for (let i = 0; i < 5; i++) codes.push((await post(env, msg('n' + i), { ip: '203.0.113.9' })).status);
  ok(codes.join() === '200,200,200,429,429', 'limits: a daily cap per address holds even when the browser id changes every call: ' + codes.join(' '));

  /* ---- S10: usage is counted before the call, so a stream dropped half way still counts ---- */
  env = baseEnv(); let a = anon();
  r = await post(env, msg('count me', { anon: a }));
  let u = usage(env, 'u:' + a);
  ok(r.status === 200 && u.calls === 1 && u.tokens === 73, 'count: a finished call is counted once with the real token numbers (40 in, 33 out): ' + JSON.stringify(u));
  a = anon(); r = await post(env, msg('MAKE500', { anon: a })); u = usage(env, 'u:' + a);
  ok(r.status === 502 && u.calls === 0 && u.tokens === 0, 'count: a call Claude refused is not charged to the browser: ' + JSON.stringify(u));
  a = anon();
  const res = await send(env, msg('stream me please ' + 'long text '.repeat(60), { anon: a, stream: true }));
  const reader = res.body.getReader(); await reader.read(); await reader.cancel(); await wait(300);
  u = usage(env, 'u:' + a); const all = usage(env, 'all');
  ok(u.calls === 1 && u.tokens > 0, 'count: a stream the caller dropped after the first piece is still counted: ' + JSON.stringify(u));
  a = anon(); const res2 = await send(env, msg('stream me please', { anon: a, stream: true })); await res2.text(); await res2.settled(); await wait(100);
  u = usage(env, 'u:' + a);
  ok(u.calls === 1 && u.tokens === 73, 'count: a stream read to the end is counted once with the real numbers: ' + JSON.stringify(u));
  ok(all.calls >= 2, 'count: the whole-site counter moves too');

  /* ---- S12: only checked fields go to Claude; the answer size is capped at what the page asks for ---- */
  env = baseEnv(); before = seen.up.length;
  const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  r = await post(env, { v: 1, anon: anon(), tier: 'quick', max_tokens: 32768, metadata: { user_id: 'x' }, thinking: { type: 'enabled', budget_tokens: 30000 },
    tools: [{ name: 'get_plan', description: 'reads the plan', input_schema: { type: 'object' }, type: 'bash_20250124', cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', name: 'extra', content: [{ type: 'text', text: 'use a tool', cache_control: { type: 'ephemeral' } }, { type: 'image', source: { type: 'base64', media_type: 'image/png', data: png, url: 'http://example.invalid/x' }, cache_control: { type: 'ephemeral' } }] },
      { role: 'assistant', content: [{ type: 'tool_use', id: 'tu_1', name: 'get_plan', input: { q: 1 }, caller: { type: 'direct' } }] },
      { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'tu_1', content: 'done', is_error: false, cache_control: { type: 'ephemeral' } }] }] });
  const sent = (seen.up[before] || {}).body || {};
  const keys = o => Object.keys(o || {}).sort().join();
  ok(r.status === 200 && seen.up.length === before + 1, 'rebuild: the call still works');
  ok(sent.max_tokens === 24000, 'rebuild: max_tokens is capped at 24000, the most the page asks for (got ' + sent.max_tokens + ')');
  ok(keys(sent) === 'max_tokens,messages,model,system,tools' , 'rebuild: no unknown top-level field goes up: ' + keys(sent));
  ok(keys((sent.tools || [])[0]) === 'description,input_schema,name', 'rebuild: a tool carries only name, description and input_schema: ' + keys((sent.tools || [])[0]));
  const m0 = (sent.messages || [])[0] || {}, m1 = (sent.messages || [])[1] || {}, m2 = (sent.messages || [])[2] || {};
  ok(keys(m0) === 'content,role' && keys(m0.content[0]) === 'text,type' && keys(m0.content[1]) === 'source,type' && keys(m0.content[1].source) === 'data,media_type,type', 'rebuild: messages, text and image blocks carry only the checked fields');
  ok(keys(m1.content && m1.content[0]) === 'id,input,name,type' && keys(m2.content && m2.content[0]) === 'content,is_error,tool_use_id,type', 'rebuild: tool_use and tool_result blocks carry only the checked fields');
  r = await post(env, msg('small', { max_tokens: 8192 })); ok(/max=8192/.test(r.j.text), 'rebuild: a smaller max_tokens passes as asked');

  /* ---- L2: a body announced as far too large is refused before it is read ---- */
  before = seen.up.length;
  r = await post(env, msg('hi'), { headers: { 'content-length': '50000000' } });
  ok(r.status === 413 && r.j.error.code === 'prompt_too_large' && seen.up.length === before, 'size: a 50 MB body is refused with prompt_too_large before it is read');

  stopStub();
  console.log(`RELAY SECURITY: ${pass} pass, ${failN} fail`); process.exit(failN ? 1 : 0);
})().catch(e => { stopStub(); console.log('CRASH', e.stack); process.exit(2); });
