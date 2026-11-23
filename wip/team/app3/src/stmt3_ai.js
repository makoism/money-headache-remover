/* ---------- Statements: the AI route (DECISIONS_ROUND2 E4; the old app's ui41.js relayFn and ui46.js connectAsk) ----------
   One statement file, one fixed-shape job: the file goes to the AI with STMT3R.rowsPrompt and the answer comes back in
   STMT3R.ROWS_SCHEMA, then through STMT3R.cleanRead like a pasted answer. Two ways to reach the AI, the old app's order:
     1. the owner's relay, the site's /api/ai, when this page is served from the site (or STMT3_RELAY names it);
     2. the viewer's own Claude (window.claude.use('sample')), inside the Claude viewer.
   Nothing is sent until the person taps Read, and only the files they chose. No key is kept on the device: the relay's
   anonymous id is drawn once per page open. PDFs go only through the relay (the viewer's Claude takes pictures alone).
   A file that is not a picture or a PDF is read here as text (UTF-8, else Shift_JIS, else EUC-JP) and sent as text. */
const STMT3_AI = (() => {
  const IMG = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const PDF_MAX = 6000000, TEXT_MAX = 240000;
  const isPdf = f => f.type === 'application/pdf' || /\.pdf$/i.test(f.name || '');
  const isImg = f => IMG.includes(f.type);
  const anon = (() => { const abc = 'abcdefghijklmnopqrstuvwxyz0123456789'; let s = ''; for (const b of crypto.getRandomValues(new Uint8Array(16))) s += abc[b % 36]; return s; })();
  let route = null;
  function relayBase() {
    const named = typeof window.STMT3_RELAY === 'string' ? window.STMT3_RELAY : '';
    if (named) return named.replace(/\/$/, '');
    return /^https?:$/.test(location.protocol) ? location.origin : '';
  }
  /* which way the AI can be reached from this copy: { how: 'relay' | 'claude', fn } or { how: null, why } */
  async function connect() {
    if (route && route.how) return route;
    const base = relayBase();
    if (base) {
      try {
        const r = await fetch(base + '/api/health', { cache: 'no-store' });
        const h = r.ok ? await r.json() : null;
        if (h && h.ai) return (route = { how: 'relay', base });
      } catch (e) { /* no relay here */ }
    }
    try {
      const c = window.claude;
      if (c && typeof c.use === 'function') { const fn = await c.use('sample'); if (typeof fn === 'function') return (route = { how: 'claude', fn }); }
    } catch (e) { /* not granted */ }
    return (route = { how: null, why: 'The AI can\'t be reached from this copy of the page. Use any AI below' });
  }
  const dataOf = file => new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(',')[1] || ''); fr.onerror = () => rej(new Error('could not be opened')); fr.readAsDataURL(file); });
  async function textOf(file) { const d = STMT3R.decodeBytes(new Uint8Array(await file.arrayBuffer())); return d.text.slice(0, TEXT_MAX); }
  const NAME = 'statement_rows';
  /* one file through the relay: the tool is offered and asked for in the words (a forced tool is refused) */
  async function viaRelay(base, prompt, file, text) {
    const content = [{ type: 'text', text: `${prompt}${text !== null ? `\n\nTHE FILE (${file.name})\n${text}` : ''}` + `\n\nAnswer by calling the ${NAME} tool once, with every field filled in. No words outside the tool call.` }];
    if (text === null) content.push({ type: isPdf(file) ? 'document' : 'image', source: { type: 'base64', media_type: isPdf(file) ? 'application/pdf' : file.type, data: await dataOf(file) } });
    const body = { v: 1, anon, invite: '', tier: 'default', max_tokens: 24000, effort: 'low',
      tools: [{ name: NAME, description: 'The transaction rows of one statement file.', input_schema: STMT3R.ROWS_SCHEMA }], tool_choice: { type: 'auto' },
      messages: [{ role: 'user', content }] };
    let r;
    try { r = await fetch(base + '/api/ai', { method: 'POST', headers: { 'content-type': 'application/json', 'x-app': 'mhr2000' }, body: JSON.stringify(body) }); }
    catch (e) { throw new Error('no connection. Check the internet and try again'); }
    if (r.status === 429) throw new Error('too many requests right now, try again in a minute');
    if (!r.ok) throw new Error('the AI did not answer (' + r.status + ')');
    const res = await r.json();
    const use = (res.content || []).find(b => b.type === 'tool_use' && b.name === NAME);
    if (res.stop_reason === 'max_tokens') throw new Error('too long for one read. Split it or use fewer pages');
    if (use && use.input && typeof use.input === 'object') return use.input;
    const p = STMT3R.parseLoose((res.content || []).filter(b => b.type === 'text').map(b => b.text).join(''));
    if (p.ok && p.value && typeof p.value === 'object') return p.value;
    throw new Error('no rows came back');
  }
  async function viaClaude(fn, prompt, file, text) {
    const ask = `${prompt}${text !== null ? `\n\nTHE FILE (${file.name})\n${text}` : ''}`;
    const opts = text === null ? { images: [file] } : {};
    if (typeof fn.form === 'function') return fn.form(ask, Object.assign({ name: NAME, description: 'The transaction rows of one statement file.', schema: STMT3R.ROWS_SCHEMA, maxTokens: 24000 }, opts));
    if (typeof fn.json === 'function') return fn.json(ask + '\n\nReply with ONLY one JSON object with these properties: ' + JSON.stringify(STMT3R.ROWS_SCHEMA.properties), opts);
    throw new Error('this copy of Claude can\'t answer in a fixed shape');
  }
  /* read one file for one account: a read (STMT3R.cleanRead), or throws Error(plain words) */
  async function readFile(file, acct, today) {
    const r = await connect();
    if (!r.how) throw new Error(r.why);
    if (isPdf(file) && file.size > PDF_MAX) throw new Error('too big. Export fewer months or take screenshots of the pages');
    if (isPdf(file) && r.how !== 'relay') throw new Error('a PDF can only be read on the app\'s own address. Use a CSV, screenshots or any AI below');
    const text = isPdf(file) || isImg(file) ? null : await textOf(file);
    const prompt = STMT3R.rowsPrompt({ today, acctName: acct.name, acctKind: acct.type === 'card' ? 'card' : 'bank' });
    const raw = r.how === 'relay' ? await viaRelay(r.base, prompt, file, text) : await viaClaude(r.fn, prompt, file, text);
    return STMT3R.cleanRead(raw, file.name, today);
  }
  return { connect, readFile, reset: () => { route = null; } };
})();
