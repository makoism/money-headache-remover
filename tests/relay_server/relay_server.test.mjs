/* The AI relay (functions/api/ai.js through worker/index.js) run here in node, on the D1 stand-in over SQLite
   (../vault_server/d1_stub.mjs) and a fake upstream in place of api.anthropic.com. No wrangler, no network, no real API.
       node tests/relay_server/relay_server.test.mjs
   A. exactly what the old app sends (src/ui41.js, 38.28 on main), and the answers it reads.
   B. exactly what app3 sends (wip-38.31: wip/team/app3/src/ask3.js ask3Relay, src/stmt3_ai.js viaRelay).
   C. the per-day call cap (USER_DAILY_CALLS): keyed to the invite code when INVITE_CODES is set, else to the page's
      device id, else to the client IP; never to `anon`. The global token cap and the per-minute cap stay.
 */
import worker from '../../worker/index.js';
import { makeD1 } from '../vault_server/d1_stub.mjs';
import { randomBytes } from 'node:crypto';

let bad = 0, n = 0;
const ck = (name, ok, extra) => { n++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : ' ' + String(extra === undefined ? '' : typeof extra === 'string' ? extra : JSON.stringify(extra)).slice(0, 500))); if (!ok) bad++; };
const hex = k => randomBytes(k).toString('hex');
const anonOf = () => { const abc = 'abcdefghijklmnopqrstuvwxyz0123456789'; let s = ''; for (const b of randomBytes(16)) s += abc[b % 36]; return s; };

/* ---- the fake upstream: records every request; answers like the Messages API ---- */
const UP = 'https://fake-upstream.test';
const sent = [];
let usageNext = null; /* the usage the next answer reports */
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
  if (!String(url).startsWith(UP)) throw new Error('a real network call was tried: ' + url);
  const req = JSON.parse(init.body); sent.push({ url: String(url), headers: init.headers, req });
  const usage = usageNext || { input_tokens: 40, output_tokens: 33 }; usageNext = null;
  const last = req.messages[req.messages.length - 1];
  const lastText = typeof last.content === 'string' ? last.content : last.content.map(c => c.type === 'text' ? c.text : '[' + c.type + ']').join(' ');
  if (req.stream) {
    const ev = [
      { type: 'message_start', message: { usage: { input_tokens: usage.input_tokens, cache_creation_input_tokens: usage.cache_creation_input_tokens || 0, cache_read_input_tokens: usage.cache_read_input_tokens || 0, output_tokens: 1 } } },
      { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'Hel' } },
      { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'lo' } },
      { type: 'message_delta', delta: { stop_reason: 'end_turn' }, usage: { output_tokens: usage.output_tokens } },
      { type: 'message_stop' },
    ].map(e => 'event: ' + e.type + '\ndata: ' + JSON.stringify(e) + '\n\n').join('');
    return new Response(ev, { status: 200, headers: { 'content-type': 'text/event-stream' } });
  }
  let content;
  const tool = (req.tools || [])[0];
  if (tool && !/\[tool_result\]/.test(lastText)) content = [{ type: 'text', text: 'Calling.' }, { type: 'tool_use', id: 'tu_1', name: tool.name, input: { answer: 'ok', actions: [] } }];
  else content = [{ type: 'text', text: 'ANSWER ' + lastText.slice(0, 40) }];
  const stop = content.some(b => b.type === 'tool_use') ? 'tool_use' : 'end_turn';
  return new Response(JSON.stringify({ id: 'msg_1', type: 'message', role: 'assistant', model: req.model, content, stop_reason: stop, usage }), { status: 200, headers: { 'content-type': 'application/json' } });
};

const envOf = (db, extra) => Object.assign({ DB: db, ANTHROPIC_API_KEY: 'test-key', ANTHROPIC_BASE_URL: UP, ASSETS: { fetch: async () => new Response('page') } }, extra || {});
async function post(env, body, ip) {
  const req = new Request('https://the-burrow.test/api/ai', { method: 'POST', headers: { 'content-type': 'application/json', 'x-app': 'mhr2000', 'cf-connecting-ip': ip || '203.0.113.7' }, body: JSON.stringify(body) });
  const r = await worker.fetch(req, env, { waitUntil() {} });
  const type = r.headers.get('content-type') || '';
  if (/event-stream/.test(type)) { const t = await r.text(); return { status: r.status, stream: true, events: t.split('\n\n').filter(Boolean).map(b => JSON.parse(b.replace(/^data: /, ''))) }; }
  let j = null; try { j = await r.json(); } catch (e) { j = null; }
  return { status: r.status, j: j || {} };
}
const lastSent = () => sent[sent.length - 1].req;
const sysText = q => typeof q.system === 'string' ? q.system : (q.system || []).map(b => b.text).join('');
const usageRows = db => db.raw.prepare('SELECT k, calls, tokens FROM usage').all().map(r => Object.assign({}, r));
const PDF = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF').toString('base64');
const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
const RESP_KEYS = ['content', 'model', 'stop_reason', 'text', 'truncated', 'usage'];

/* ---- what each app sends (copied from the app files; the shapes must stay accepted unchanged) ---- */
const OLD = {
  /* ui41 relayFn fn(input, opts) with no tools, no onText: { v, anon, invite, tier, json } + messages */
  plain: (anon, extra) => Object.assign({ v: 1, anon, invite: '', tier: 'default', json: false, messages: [{ role: 'user', content: 'How much is left for food?' }] }, extra || {}),
  /* fn.json: json true, quick tier, max_tokens */
  json: anon => ({ v: 1, anon, invite: '', tier: 'quick', json: true, max_tokens: 1500, messages: [{ role: 'user', content: 'Give the JSON.' }] }),
  /* fn with onText: stream true */
  stream: anon => ({ v: 1, anon, invite: '', tier: 'default', json: false, stream: true, messages: [{ role: 'user', content: 'Say hello.' }] }),
  /* fn with images (relayMessages): the last turn becomes [text, image..., document...] */
  files: anon => ({ v: 1, anon, invite: '', tier: 'default', json: true, messages: [{ role: 'user', content: [{ type: 'text', text: 'Read these.' }, { type: 'image', source: { type: 'base64', media_type: 'image/png', data: PNG } }, { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: PDF } }] }] }),
  /* fn with opts.tools: tools without tool_choice, a round loop */
  tools: anon => ({ v: 1, anon, invite: '', tier: 'default', json: false, tools: [{ name: 'get_plan', description: 'Reads the plan.', input_schema: { type: 'object', properties: {} } }, { name: 'get_bills', description: 'Reads the bills.', input_schema: { type: 'object', properties: { month: { type: 'string' } } } }], messages: [{ role: 'user', content: 'What is my plan?' }] }),
  /* fn.form: one tool, tool_choice auto, effort, system */
  form: anon => ({ v: 1, anon, invite: '', tier: 'quick', tools: [{ name: 'statement_rows', description: 'Return the result.', input_schema: { type: 'object', properties: { rows: { type: 'array' } } } }], tool_choice: { type: 'auto' }, max_tokens: 8000, effort: 'low', system: 'Read statements.', messages: [{ role: 'user', content: 'rows\n\nAnswer by calling the statement_rows tool once, with every field filled in. No words outside the tool call.' }] }),
};
const APP3 = {
  ask: anon => ({ v: 1, anon, invite: '', tier: 'default', max_tokens: 2000, effort: 'low', tools: [{ name: 'answer', description: 'The answer and any proposed actions.', input_schema: { type: 'object', properties: { answer: { type: 'string' }, actions: { type: 'array' } } } }], tool_choice: { type: 'auto' }, messages: [{ role: 'user', content: [{ type: 'text', text: 'Can I afford dinner?\n\nAnswer by calling the answer tool once.' }] }] }),
  read: anon => ({ v: 1, anon, invite: '', tier: 'default', max_tokens: 24000, effort: 'low', tools: [{ name: 'statement_rows', description: 'The transaction rows of one statement file.', input_schema: { type: 'object', properties: { rows: { type: 'array' } } } }], tool_choice: { type: 'auto' }, messages: [{ role: 'user', content: [{ type: 'text', text: 'Read it.\n\nAnswer by calling the statement_rows tool once, with every field filled in. No words outside the tool call.' }, { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: PDF } }] }] }),
};

// ---------------- A. the old app (src/ui41.js, 38.28) ----------------
{
  const db = makeD1(), env = envOf(db), anon = anonOf();
  let r = await post(env, OLD.plain(anon));
  ck('A1 plain call: 200 with exactly text, truncated, stop_reason, content, usage, model', r.status === 200 && /^ANSWER How much/.test(r.j.text) && r.j.truncated === false && JSON.stringify(Object.keys(r.j).sort()) === JSON.stringify(RESP_KEYS) && r.j.usage.input === 40 && r.j.usage.output === 33, r.j);
  ck('A2 plain call goes up on the default model with max_tokens 4096 and the key', lastSent().model === 'claude-sonnet-5-5' && lastSent().max_tokens === 4096 && sent[sent.length - 1].headers['x-api-key'] === 'test-key' && sent[sent.length - 1].url === UP + '/v1/messages', lastSent());
  r = await post(env, OLD.json(anon));
  ck('A3 json call (quick tier, max_tokens 1500): 200, haiku, the JSON line in the system text', r.status === 200 && lastSent().model === 'claude-haiku-5-5' && lastSent().max_tokens === 1500 && /Reply with only the JSON value/.test(sysText(lastSent())), lastSent());
  r = await post(env, OLD.stream(anon));
  const t = r.events ? r.events.filter(e => e.t).map(e => e.t).join('') : '', fin = r.events && r.events.find(e => e.done);
  ck('A4 streamed call: event-stream of { t } then { done, truncated, usage }', r.stream && t === 'Hello' && fin && fin.truncated === false && fin.usage.output === 33, r);
  r = await post(env, OLD.files(anon));
  ck('A5 image and PDF blocks pass through unchanged', r.status === 200 && JSON.stringify(lastSent().messages) === JSON.stringify(OLD.files(anon).messages), r.j);
  r = await post(env, OLD.tools(anon));
  ck('A6 tools round 1: stop_reason tool_use and the tool_use block come back', r.status === 200 && r.j.stop_reason === 'tool_use' && r.j.content.some(b => b.type === 'tool_use' && b.name === 'get_plan') && lastSent().tool_choice === undefined, r.j);
  const round2 = Object.assign(OLD.tools(anon), { messages: OLD.tools(anon).messages.concat([{ role: 'assistant', content: r.j.content }, { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'tu_1', content: '{"play":320}' }] }]) });
  r = await post(env, round2);
  ck('A7 tools round 2 with the tool_result: 200 text', r.status === 200 && /^ANSWER/.test(r.j.text), r.j);
  r = await post(env, OLD.form(anon));
  ck('A8 fn.form (one tool, choice auto, effort low, system): 200 tool_use; effort and choice go up', r.status === 200 && r.j.content.some(b => b.type === 'tool_use' && b.name === 'statement_rows') && lastSent().tool_choice.type === 'auto' && lastSent().output_config.effort === 'low' && lastSent().max_tokens === 8000 && /Read statements\./.test(sysText(lastSent())), lastSent());
  r = await post(env, OLD.plain(anon, { stream: true, tools: OLD.tools(anon).tools }));
  ck('A9 stream with tools is answered whole, not streamed (as before)', r.status === 200 && !r.stream && !lastSent().stream, r);
  r = await post(env, Object.assign(OLD.plain(anon), { anon: 'bad id!' }));
  ck('A10 a malformed anon is still refused 400', r.status === 400, r.j);
}

// ---------------- B. app3 (wip-38.31) ----------------
{
  const db = makeD1(), env = envOf(db);
  let r = await post(env, APP3.ask(anonOf()));
  ck('B1 ask3Relay: 200 with the answer tool_use', r.status === 200 && r.j.content.find(b => b.type === 'tool_use' && b.name === 'answer').input.answer === 'ok', r.j);
  ck('B2 ask3Relay goes up with max_tokens 2000, effort low, choice auto, sonnet', lastSent().max_tokens === 2000 && lastSent().output_config.effort === 'low' && lastSent().tool_choice.type === 'auto' && lastSent().model === 'claude-sonnet-5-5', lastSent());
  r = await post(env, APP3.read(anonOf()));
  ck('B3 stmt3_ai viaRelay with a PDF: 200 with the statement_rows tool_use, max_tokens 24000', r.status === 200 && r.j.content.some(b => b.type === 'tool_use' && b.name === 'statement_rows') && lastSent().max_tokens === 24000 && lastSent().messages[0].content[1].type === 'document', r.j);
}

// ---------------- C. the per-day call cap ----------------
{
  // C1: no invite codes, no device: a fresh anon per page open does not reset the count; the IP is the key
  const db = makeD1(), env = envOf(db, { USER_DAILY_CALLS: '2' });
  let r1 = await post(env, OLD.plain(anonOf())), r2 = await post(env, APP3.ask(anonOf())), r3 = await post(env, OLD.plain(anonOf()));
  ck('C1 no code, no device: a new anon each call still hits the cap on the third call (keyed to the IP)', r1.status === 200 && r2.status === 200 && r3.status === 429 && r3.j.error.code === 'rate_limited', [r1.status, r2.status, r3.status, r3.j]);
  const r4 = await post(env, OLD.plain(anonOf()), '198.51.100.9');
  ck('C2 another IP has its own count', r4.status === 200, r4.j);
  ck('C3 no usage row is keyed to an anon', !usageRows(db).some(x => /^u:(?!ip:|d:|i:)/.test(x.k)), usageRows(db));
}
{
  // C4: a device id keeps one count across page opens, and two devices behind one IP count apart
  const db = makeD1(), env = envOf(db, { USER_DAILY_CALLS: '2' });
  const dev = hex(16), dev2 = hex(32);
  let a = await post(env, Object.assign(OLD.plain(anonOf()), { device: dev })), b = await post(env, Object.assign(APP3.ask(anonOf()), { device: dev.toUpperCase() })), c = await post(env, Object.assign(OLD.plain(anonOf()), { device: dev }));
  ck('C4 one device, a new anon each call (and upper case hex): cap reached on the third call', a.status === 200 && b.status === 200 && c.status === 429, [a.status, b.status, c.status]);
  const d = await post(env, Object.assign(OLD.plain(anonOf()), { device: dev2 }));
  ck('C5 a second device behind the same IP still has its own count', d.status === 200, d.j);
  const e = await post(env, { v: 1, device: dev2, messages: [{ role: 'user', content: 'hi' }] });
  ck('C6 a call with a device and no anon is accepted', e.status === 200, e.j);
  for (const badDev of ['abc', hex(33), 'z'.repeat(20), 12345678901234567, '']) {
    const r = await post(env, Object.assign(OLD.plain(anonOf()), { device: badDev }));
    if (r.status !== 400) { ck('C7 a malformed device is refused 400: ' + JSON.stringify(badDev), false, r); break; }
  }
  ck('C7 a malformed device (short, long, not hex, not a string, empty) is refused 400', true);
  const r = await post(env, { v: 1, messages: [{ role: 'user', content: 'hi' }] }, '192.0.2.44');
  ck('C8 a call with no anon and no device is accepted and counted on the IP', r.status === 200 && usageRows(db).some(x => x.k === 'u:ip:192.0.2.44' && x.calls === 1), usageRows(db));
}
{
  // C9: with INVITE_CODES set, the code word is the key: the whole household shares one count
  const db = makeD1(), env = envOf(db, { USER_DAILY_CALLS: '3', INVITE_CODES: 'Acorn, pinecone' });
  const calls = [
    await post(env, Object.assign(OLD.plain(anonOf()), { invite: 'acorn' }), '203.0.113.1'),
    await post(env, Object.assign(APP3.ask(anonOf()), { invite: ' ACORN ', device: hex(16) }), '203.0.113.2'),
    await post(env, Object.assign(OLD.plain(anonOf()), { invite: 'Acorn', device: hex(16) }), '203.0.113.3'),
    await post(env, Object.assign(OLD.plain(anonOf()), { invite: 'acorn', device: hex(16) }), '203.0.113.4'),
  ];
  ck('C9 one code word on four devices and IPs shares one count: the fourth call is refused', calls.slice(0, 3).every(r => r.status === 200) && calls[3].status === 429, calls.map(r => r.status));
  const other = await post(env, Object.assign(OLD.plain(anonOf()), { invite: 'pinecone' }), '203.0.113.1');
  ck('C10 another code word has its own count', other.status === 200, other.j);
  const none = await post(env, OLD.plain(anonOf()));
  ck('C11 a wrong or missing code word is still refused 401', none.status === 401 && none.j.error.code === 'invite_required', none.j);
  ck('C12 the code word itself is never stored (the key is a hash)', !usageRows(db).some(x => /acorn|pinecone/i.test(x.k)) && usageRows(db).filter(x => /^u:i:[0-9a-f]{32}$/.test(x.k)).length === 2, usageRows(db));
}
{
  // C13: the global token cap and the per-minute cap stay
  const db = makeD1(), env = envOf(db, { DAILY_TOKEN_CAP: '100' });
  usageNext = { input_tokens: 60, output_tokens: 50 };
  let r = await post(env, OLD.plain(anonOf()));
  ck('C13 a call counts its tokens (in + out) on the day total', r.status === 200 && usageRows(db).find(x => x.k === 'all').tokens === 110, usageRows(db));
  r = await post(env, Object.assign(OLD.plain(anonOf()), { device: hex(16) }), '198.51.100.1');
  ck('C14 the global token cap still stops every caller', r.status === 429 && /daily AI budget/.test(r.j.error.message), r.j);
  const db2 = makeD1(), env2 = envOf(db2, { IP_PER_MINUTE: '2' });
  const s = [await post(env2, OLD.plain(anonOf())), await post(env2, OLD.plain(anonOf())), await post(env2, OLD.plain(anonOf()))].map(x => x.status);
  ck('C15 the per-minute cap per IP still applies', s[0] === 200 && s[1] === 200 && s[2] === 429, s);
  const db4 = makeD1(), env4 = envOf(db4, { USER_DAILY_CALLS: '1' });
  r = await post(env4, OLD.plain(anonOf())); r = await post(env4, OLD.plain(anonOf()));
  ck('C17 the cap message is plain words and the code stays rate_limited', r.status === 429 && r.j.error.code === 'rate_limited' && /today|tomorrow/i.test(r.j.error.message), r.j);
}

globalThis.fetch = realFetch;
console.log(bad ? `relay_server: ${bad} FAIL of ${n}` : `relay_server: ALL PASS (${n})`);
process.exit(bad ? 1 : 0);
