/* A stand-in for api.anthropic.com used by the relay tests. It answers like the Messages API:
   non-stream JSON, streamed SSE, tool_use when the request carries tools, and error statuses on demand. */
const http = require('http');
const port = +process.argv[2] || 8790;
const srv = http.createServer((req, res) => {
  let body = ''; req.on('data', c => body += c); req.on('end', () => {
    const j = JSON.parse(body || '{}'), last = j.messages[j.messages.length - 1];
    const lastText = typeof last.content === 'string' ? last.content : last.content.map(c => c.type === 'text' ? c.text : c.type === 'tool_result' ? '[tool_result ' + JSON.stringify(c.content) + ']' : '[' + c.type + ']').join(' ');
    if (req.headers['x-api-key'] !== 'test-key') { res.writeHead(401, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ error: { type: 'authentication_error', message: 'invalid x-api-key' } })); }
    if (/MAKE429/.test(lastText)) { res.writeHead(429, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ error: { type: 'rate_limit_error', message: 'slow down' } })); }
    if (/MAKE500/.test(lastText)) { res.writeHead(500, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ error: { type: 'api_error', message: 'boom' } })); }
    const imgs = j.messages.reduce((n, m) => n + (Array.isArray(m.content) ? m.content.filter(c => c.type === 'image').length : 0), 0);
    const echo = `ECHO model=${j.model} max=${j.max_tokens} sys=${(j.system || '').length} imgs=${imgs} tools=${(j.tools || []).length} text=${lastText.slice(0, 120)}`;
    if (j.tools && j.tools.length && !/tool_result/.test(lastText)) {
      /* first round: call the first tool with a fixed input */
      const out = { id: 'msg_1', type: 'message', role: 'assistant', model: j.model, stop_reason: 'tool_use', content: [{ type: 'text', text: 'Let me check.' }, { type: 'tool_use', id: 'tu_1', name: j.tools[0].name, input: { q: 'ping' } }], usage: { input_tokens: 50, output_tokens: 20 } };
      res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify(out));
    }
    const setup = /work out the monthly numbers/.test(lastText);
    if (setup) {
      const text = JSON.stringify({ summary: 'Two months of GCash and one card statement.', pay: { amount: 38000, how: 'twice a month, 15th and 30th' }, other_income: 2000, balance: { amount: 12400, date: '2026-11-10' }, bills: [{ id: 'rent', amount: 8000, note: '5th each month' }, { id: 'util', amount: 1800, note: 'Meralco and Maynilad' }, { id: 'food', amount: 6500, note: 'groceries and meals' }, { id: 'net', amount: 1699, note: 'PLDT' }, { id: 'phone', amount: 599, note: 'Globe' }], subscriptions: [{ name: 'Netflix', amount: 279 }, { name: 'Spotify', amount: 169 }], loans: [{ name: 'Home Credit', amount: 2500, ends: '2027-06' }], card_other: 1500, questions: [{ text: 'Is the 8,000 on the 5th your rent?', relates: 'rent' }], skipped: ['One transfer of 5,000 to a savings account was left out.'] });
      const out = { id: 'msg_s', type: 'message', role: 'assistant', model: j.model, stop_reason: 'end_turn', content: [{ type: 'text', text }], usage: { input_tokens: 900, output_tokens: 300 } };
      res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify(out));
    }
    const extract = /Reply with only the JSON value/.test(j.system || '') && /receipts/.test(lastText);
    const text = extract ? '{"summary":"Two receipts found.","receipts":[{"date":"2026-11-05","amount":120,"category":"other","note":"Cafe"},{"date":"2026-11-06","amount":45.5,"category":"other","note":"Bus"}],"pay":null,"balance":null,"bills":[],"skipped":[]}' : /WANTJSON/.test(lastText) ? '{"ok":true,"n":3}' : echo;
    if (j.stream) {
      res.writeHead(200, { 'content-type': 'text/event-stream' });
      const send = (type, obj) => res.write(`event: ${type}\ndata: ${JSON.stringify(Object.assign({ type }, obj))}\n\n`);
      send('message_start', { message: { id: 'msg_2', usage: { input_tokens: 40, output_tokens: 1 } } });
      send('content_block_start', { index: 0, content_block: { type: 'text', text: '' } });
      const parts = text.match(/.{1,9}/g) || [text]; let i = 0;
      const tick = () => { if (i < parts.length) { send('content_block_delta', { index: 0, delta: { type: 'text_delta', text: parts[i++] } }); setTimeout(tick, 15); } else { send('content_block_stop', { index: 0 }); send('message_delta', { delta: { stop_reason: 'end_turn' }, usage: { output_tokens: 33 } }); send('message_stop', {}); res.end(); } };
      tick(); return;
    }
    const out = { id: 'msg_3', type: 'message', role: 'assistant', model: j.model, stop_reason: /MAKETRUNC/.test(lastText) ? 'max_tokens' : 'end_turn', content: [{ type: 'text', text }], usage: { input_tokens: 40, output_tokens: 33 } };
    res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(out));
  });
});
srv.listen(port, '127.0.0.1', () => console.log('stub on', port));
