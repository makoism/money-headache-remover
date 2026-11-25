/* The AI relay's daily call cap (functions/api/ai.js), run here in node on the D1 stand-in (d1_stub.mjs). No wrangler,
   no network: the call to Claude is a stub. MAKO_SAYS M68: "The AI relay has a daily call cap per household."
   A household is one code word (INVITE_CODES): its count follows the word, never the device, the connection or the
   page's own id, so a second phone or a new page open cannot reset it, and another household has its own count.
   node tests/vault_server/relay_cap.test.mjs */
import { onRequestPost } from '../../functions/api/ai.js';
import { makeD1 } from './d1_stub.mjs';

let bad = 0, n = 0;
const ck = (name, ok, extra) => { n++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || extra === undefined ? '' : ' ' + JSON.stringify(extra))); if (!ok) bad++; };

let upstream = 0;
globalThis.fetch = async () => { upstream++; return new Response(JSON.stringify({ content: [{ type: 'text', text: 'ok' }], usage: { input_tokens: 5, output_tokens: 2 }, stop_reason: 'end_turn', model: 'stub' }), { status: 200, headers: { 'content-type': 'application/json' } }); };

const envOf = (db, extra) => Object.assign({ DB: db, ANTHROPIC_API_KEY: 'test-key', IP_PER_MINUTE: '1000000' }, extra || {});
let seq = 0;
async function ask(env, over, ip) {
  const body = Object.assign({ v: 1, anon: 'anon' + (seq++) + 'xxxxxxxx', tier: 'quick', messages: [{ role: 'user', content: 'hello' }] }, over || {});
  const request = new Request('https://the-burrow.test/api/ai', { method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': ip || '203.0.113.7' }, body: JSON.stringify(body) });
  const r = await onRequestPost({ request, env });
  let j = {}; try { j = await r.json(); } catch (e) { j = {}; }
  return { status: r.status, j };
}

/* ---- with code words: the cap is per code word (the household) ---- */
{
  const env = envOf(makeD1(), { INVITE_CODES: 'acorn,bramble', USER_DAILY_CALLS: '5' });
  const got = [];
  for (let i = 0; i < 5; i++) got.push((await ask(env, { invite: 'acorn', device: 'aaaaaaaaaaaaaaa' + (i % 2) }, '203.0.113.' + (10 + i))).status);
  ck('a household\'s first 5 calls of the day go through, from two devices and five connections', got.join() === '200,200,200,200,200', got);
  const before = upstream;
  const sixth = await ask(env, { invite: 'acorn', device: 'bbbbbbbbbbbbbbbb' }, '203.0.113.99');
  ck('the next call is refused with 429 rate_limited, whatever device or connection it comes from', sixth.status === 429 && sixth.j.error && sixth.j.error.code === 'rate_limited', sixth);
  ck('the refusal says it is the day\'s limit and to try tomorrow', /Daily limit .* reached\. Try again tomorrow/.test((sixth.j.error || {}).message || ''), sixth.j);
  ck('a refused call never reaches Claude (it costs nothing)', upstream === before, upstream - before);
  const upper = await ask(env, { invite: ' ACORN ' });
  ck('the same word typed with capitals or spaces is the same household', upper.status === 429, upper.status);
  const other = await ask(env, { invite: 'bramble', device: 'bbbbbbbbbbbbbbbb' }, '203.0.113.99');
  ck('another household (another code word) has its own count, even on the same device and connection', other.status === 200, other);
  const none = await ask(env, {});
  ck('with code words set, a call with no word is refused before anything is counted', none.status === 401 && none.j.error.code === 'invite_required', none);
  const rows = await env.DB.prepare('SELECT k, calls FROM usage').all();
  const list = (rows && rows.results) || [];
  ck('the count is kept (the table has the household\'s row at 5 calls)', list.some(r => /^u:i:/.test(r.k) && r.calls === 5), list);
  ck('the code word itself is never written to the table', list.length > 0 && !/acorn|bramble/i.test(JSON.stringify(list)), list);
}
/* ---- with no code words: the cap follows the device the page names ---- */
{
  const env = envOf(makeD1(), { USER_DAILY_CALLS: '3' });
  const got = [];
  for (let i = 0; i < 4; i++) got.push((await ask(env, { device: 'cccccccccccccccc' }, '198.51.100.' + i)).status);
  ck('with no code words the count follows the device: 3 through, the 4th refused, on any connection', got.join() === '200,200,200,429', got);
  ck('a new page open (a new anon id) does not reset it', (await ask(env, { device: 'cccccccccccccccc' })).status === 429);
}
/* ---- the built-in number when nothing is set ---- */
{
  const env = envOf(makeD1(), { INVITE_CODES: 'acorn' });
  let last = 0, through = 0;
  for (let i = 0; i < 402; i++) { last = (await ask(env, { invite: 'acorn' })).status; if (last === 200) through++; }
  ck('with no number set, a household gets 400 calls a day and then stops', through === 400 && last === 429, { through, last });
}
console.log(bad ? `relay_cap: ${bad} FAIL of ${n}` : `relay_cap: ALL PASS (${n})`);
process.exit(bad ? 1 : 0);
