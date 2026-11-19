/* The pages already in people's browsers must keep working through the relay, unchanged: the assistant (plain, streamed, with tools),
   statement reading (text and PDF), photo reading, and the invite word.
   This runs the real relay code of the 38.28 page (cut from the shipped public/index.html) and of the 38.31 page (wip/team/ui41.js),
   both frozen in tests/relay_fixtures, against functions/api/ai.js and a fake Anthropic. It passes before and after the security fixes.
   Run: node tests/relay_clients.test.js */
const fs = require('fs'), path = require('path'), vm = require('vm'), { webcrypto } = require('crypto');
const { startStub, stopStub, send, baseEnv, seen } = require('./relay_harness.js');
let pass = 0, failN = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); c ? pass++ : failN++; };
function page(file, env, invite) {
  const store = invite ? { 'mhr-invite': invite } : {};
  const ctx = vm.createContext({
    console: { warn() {}, log: console.log }, crypto: webcrypto, TextEncoder, TextDecoder, btoa, atob, Uint8Array, JSON, Date, Math, Object, Array, String, Promise, Error, Map, setTimeout, clearTimeout, AbortController, Blob, File,
    location: { protocol: 'http:', origin: 'http://test.local' }, inArtifact: () => false, shrinkPhoto: async f => f,
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
    fetch: (url, opt) => send(env, opt.body, { headers: opt.headers, signal: opt.signal }),
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'relay_fixtures', file), 'utf8') + '\nvar ask = relayFn();', ctx, { filename: file });
  return ctx.ask;
}
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
const pdf = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n2 0 obj<</Type /Page>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF');
const rowsSchema = { type: 'object', properties: { rows: { type: 'array' } } };
const caught = p => p.then(v => ({ v }), e => ({ e }));
async function story(file, label) {
  const env = baseEnv(), ask = page(file, env);
  let r = await caught(ask('hello there', { modelTier: 'quick', cache: false }));
  ok(r.v && /^ECHO/.test(r.v.text) && r.v.truncated === false, `${label}: a plain question is answered`);
  let pieces = 0; r = await caught(ask('stream me please', { cache: false, onText: () => { pieces++; } }));
  ok(r.v && /stream me please/.test(r.v.text) && pieces > 3, `${label}: the assistant's answer streams in, piece by piece (${pieces} pieces)`);
  r = await caught(ask.json('WANTJSON', { modelTier: 'quick', cache: false }));
  ok(r.v && r.v.ok === true && r.v.n === 3, `${label}: a JSON answer is read`);
  let ran = null; r = await caught(ask('use a tool', { tools: [{ name: 'get_plan', description: 'reads the plan', inputSchema: { type: 'object', properties: { q: { type: 'string' } } }, execute: async input => { ran = input; return { play: 320 }; } }] }));
  ok(r.v && ran && ran.q === 'ping' && /tool_result/.test(r.v.text), `${label}: the assistant calls a tool on the page and uses its result`);
  r = await caught(ask.form('----- FILE NAME: bank.csv -----\n2026-10-01,SM SUPERMARKET,2180.5,,\n2026-10-15,PAYROLL CREDIT,,21000,', { name: 'statement_rows', description: 'rows', schema: rowsSchema, modelTier: 'quick', maxTokens: 24000, effort: 'low', system: 'Read the statement.' }));
  ok(r.v && Array.isArray(r.v.rows) && r.v.rows.length === 2 && r.v.kind === 'bank', `${label}: a statement as text is read into rows`);
  const sentMax = seen.up[seen.up.length - 1].body.max_tokens;
  ok(sentMax === 24000, `${label}: the statement reader gets the 24000 tokens it asks for`);
  r = await caught(ask.form('Read this statement.', { name: 'statement_rows', description: 'rows', schema: rowsSchema, maxTokens: 24000, images: [new File([pdf], 'card-oct.pdf', { type: 'application/pdf' })] }));
  ok(r.v && Array.isArray(r.v.rows) && r.v.rows.length === 4, `${label}: a PDF statement is read into rows`);
  const lastUp = seen.up[seen.up.length - 1].body, blocks = lastUp.messages[0].content;
  ok(blocks.some(b => b.type === 'document' && b.source.media_type === 'application/pdf' && /^JVBERi/.test(b.source.data)), `${label}: the PDF reaches Claude whole`);
  r = await caught(ask('read this', { modelTier: 'quick', images: [new File([png], 'receipt.png', { type: 'image/png' })] }));
  ok(r.v && /imgs=1/.test(r.v.text), `${label}: a photo is read`);
  r = await caught(ask('MAKE429', { cache: false })); ok(r.e && r.e.code === 'rate_limited', `${label}: a busy Claude is told as rate_limited`);
  r = await caught(ask('MAKELONG', { cache: false })); ok(r.e && r.e.code === 'prompt_too_large', `${label}: too much at once is told as prompt_too_large`);
  /* with the invite word on */
  const envI = baseEnv({ INVITE_CODES: 'three plain words' });
  r = await caught(page(file, envI, 'three plain words')('hello', { cache: false })); ok(r.v && /^ECHO/.test(r.v.text), `${label}: with the invite word saved, calls pass`);
  r = await caught(page(file, envI)('hello', { cache: false })); ok(r.e && r.e.code === 'invite_required', `${label}: without it the page is told invite_required`);
}
(async () => {
  await startStub();
  await story('client_38.28.js', '38.28 page'); await story('client_38.31.js', '38.31 page');
  ok(seen.blocked.length === 0, 'nothing tried to leave this machine');
  stopStub();
  console.log(`RELAY CLIENTS: ${pass} pass, ${failN} fail`); process.exit(failN ? 1 : 0);
})().catch(e => { stopStub(); console.log('CRASH', e.stack); process.exit(2); });
