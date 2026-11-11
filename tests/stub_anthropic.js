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
    if (/MAKECREDIT/.test(lastText)) { res.writeHead(400, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ error: { type: 'invalid_request_error', message: 'Your credit balance is too low to access the Anthropic API. Please go to Plans & Billing to upgrade or purchase credits.' } })); }
    if (/MAKE500/.test(lastText)) { res.writeHead(500, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ error: { type: 'api_error', message: 'boom' } })); }
    const imgs = j.messages.reduce((n, m) => n + (Array.isArray(m.content) ? m.content.filter(c => c.type === 'image').length : 0), 0);
    const docList = j.messages.reduce((a, m) => a.concat(Array.isArray(m.content) ? m.content.filter(c => c.type === 'document') : []), []);
    const badDoc = docList.find(d => !d.source || d.source.type !== 'base64' || d.source.media_type !== 'application/pdf' || !/^JVBERi/.test(d.source.data || ''));
    if (badDoc) { res.writeHead(400, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ error: { type: 'invalid_request_error', message: 'Could not process PDF' } })); }
    const echo = `ECHO model=${j.model} max=${j.max_tokens} sys=${(j.system || '').length} imgs=${imgs} docs=${docList.length} tools=${(j.tools || []).length} text=${lastText.slice(0, 120)}`;
    if (j.tools && j.tools.length && !/tool_result/.test(lastText)) {
      /* first round: call the first tool with a fixed input */
      const out = { id: 'msg_1', type: 'message', role: 'assistant', model: j.model, stop_reason: 'tool_use', content: [{ type: 'text', text: 'Let me check.' }, { type: 'tool_use', id: 'tu_1', name: j.tools[0].name, input: { q: 'ping' } }], usage: { input_tokens: 50, output_tokens: 20 } };
      res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify(out));
    }
    /* the money assistant: answer with text and, when the person asks for a change, a ```mhr block */
    if (/You are the money assistant inside M.H.R.2000/.test(lastText) || /You are the money assistant inside M.H.R.2000/.test(j.messages[0].content)) {
      const q = lastText.split('\n').pop();
      const first = typeof j.messages[0].content === 'string' ? j.messages[0].content : '';
      const picture = /PICTURE \(today/.test(first);
      let text;
      if (/cut my play/i.test(q)) text = 'Play is ' + (first.match(/Play money this month: planned ([\d.]+)/) || [,'?'])[1] + ' a month now. Taking 1,000 off it frees the same for your goals.\n```mhr\n{"why":"Play down by 1,000 a month","actions":[{"do":"set_jar","jar":"play","amount":' + (Math.max(0, +(first.match(/Play money this month: planned ([\d.]+)/) || [,0])[1] - 1000)) + '}]}\n```';
      else if (/trip/i.test(q)) text = 'A trip of 30,000 by next June needs about 4,300 a month. That fits.\n```mhr\n{"why":"Add the trip","actions":[{"do":"add_goal","name":"Trip","target":30000,"due":"2027-06-15"}]}\n```';
      else if (/bad action/i.test(q)) text = 'Trying something odd.\n```mhr\n{"why":"odd","actions":[{"do":"explode"},{"do":"set_line","key":"bill:nothing","amount":5},{"do":"set_balance","amount":"12,345"}]}\n```';
      else if (/home/i.test(q)) text = 'Goals first, then play money.\n```mhr\n{"why":"Goals on top","actions":[{"do":"set_home","sections":["goals","goal","play","log"]}]}\n```';
      else if (/spent/i.test(q)) text = 'Logged as play money, today. PAST=' + ((first.match(/Past months: ([^\n]+)/) || [,'?'])[1]).slice(0, 40) + '\n```mhr\n{"why":"Log the coffee","actions":[{"do":"log_spend","amount":450,"note":"Coffee"}]}\n```';
      else if (/going/i.test(q)) text = picture ? 'Most of it goes to rent and food. PICTURE_SEEN name=' + (first.match(/Name: (\S+)/) || [,'?'])[1] : 'NO_PICTURE';
      else text = 'ECHO ' + q.slice(0, 80);
      if (j.stream) {
        res.writeHead(200, { 'content-type': 'text/event-stream' });
        const send = (type, obj) => res.write(`event: ${type}\ndata: ${JSON.stringify(Object.assign({ type }, obj))}\n\n`);
        send('message_start', { message: { id: 'msg_a', usage: { input_tokens: 2000, output_tokens: 1 } } });
        send('content_block_start', { index: 0, content_block: { type: 'text', text: '' } });
        const parts = text.match(/[\s\S]{1,12}/g) || [text]; let i = 0;
        const tick = () => { if (i < parts.length) { send('content_block_delta', { index: 0, delta: { type: 'text_delta', text: parts[i++] } }); setTimeout(tick, 8); } else { send('content_block_stop', { index: 0 }); send('message_delta', { delta: { stop_reason: 'end_turn' }, usage: { output_tokens: 120 } }); send('message_stop', {}); res.end(); } };
        tick(); return;
      }
      res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ id: 'msg_a', type: 'message', role: 'assistant', model: j.model, stop_reason: 'end_turn', content: [{ type: 'text', text }], usage: { input_tokens: 2000, output_tokens: 120 } }));
    }
    const setup = /work out the monthly numbers/.test(lastText);
    if (setup) {
      const text = JSON.stringify({ summary: 'Two months of GCash and one card statement.' + (/MERALCO BILL PAYMENT,-2455\.1/.test(lastText) ? ' XLSX_SEEN' : ''), pay: { amount: 38000, how: 'twice a month, 15th and 30th' }, other_income: 2000, balance: { amount: 12400, date: '2026-11-10' }, bills: [{ id: 'rent', amount: 8000, note: '5th each month' }, { id: 'util', amount: 1800, note: 'Meralco and Maynilad' }, { id: 'food', amount: 6500, note: 'groceries and meals' }, { id: 'net', amount: 1699, note: 'PLDT' }, { id: 'phone', amount: 599, note: 'Globe' }], subscriptions: [{ name: 'Netflix', amount: 279 }, { name: 'Spotify', amount: 169 }], loans: [{ name: 'Home Credit', amount: 2500, ends: '2027-06' }], card_other: 1500, questions: [{ text: 'Is the 8,000 on the 5th your rent?', relates: 'rent' }], skipped: ['One transfer of 5,000 to a savings account was left out.'] });
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
