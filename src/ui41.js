/* ===== where the AI runs =====
   Two ways to reach Claude, behind one function with the surface of Claude's own `sample`:
     fn(input, opts) -> {text, truncated}; fn.json(input, opts) -> value; fn.limits() -> {...}; failures are {code, message, text?}.
   1. The owner's relay (the site's /api/ai): works for anyone with the link, signed in to nothing, on the owner's prepaid credits.
      Only reachable when the page is served from its own address or opened as a file with RELAY_URL set. A Claude artifact page
      may not call other hosts, so there the relay is never tried.
   2. The viewer's own Claude account (`claude.use('sample')`), inside the Claude viewer.
   connectAsk (ui46.js) picks the first that works. Nothing in this file touches the money model. */
const RELAY_URL = '@@RELAY@@'; /* filled by build.sh from the RELAY file; empty until the site has an address */
const ANON_KEY = 'mhr-anon', INVITE_KEY = 'mhr-invite';
const IMG_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
/* PDF statements go up as document blocks (the relay only; the viewer's own Claude takes images alone) */
const DOC_LIMITS = { maxCount: 12, maxInputBytes: 6000000, maxTotalBytes: 20000000, maxPages: 90, mediaTypes: ['application/pdf'] };
const isPdfFile = f => !!f && (f.type === 'application/pdf' || /\.pdf$/i.test(f.name || ''));
const relayBase = () => { if (inArtifact()) return ''; if (/^https?:$/.test(location.protocol)) return location.origin; return RELAY_URL.replace(/\/$/, ''); };
function anonId() {
  try {
    let v = localStorage.getItem(ANON_KEY);
    if (!v || !/^[a-z0-9]{12,}$/.test(v)) { v = Array.from(crypto.getRandomValues(new Uint8Array(16)), b => 'abcdefghijklmnopqrstuvwxyz0123456789'[b % 36]).join(''); localStorage.setItem(ANON_KEY, v); }
    return v;
  } catch (e) { return 'nostorage000000'; }
}
const inviteCode = () => { try { return localStorage.getItem(INVITE_KEY) || ''; } catch (e) { return ''; } };
function setInviteCode(v) { try { if (v) localStorage.setItem(INVITE_KEY, v); else localStorage.removeItem(INVITE_KEY); } catch (e) { /* no storage */ } }
let relayInfo = null; /* what /api/health said: {ai, vault, invite}, or false when there is no relay */
const timeoutSignal = ms => { const c = new AbortController(); setTimeout(() => c.abort(), ms); return c.signal; };
async function relayHealth(force) {
  const b = relayBase(); if (!b) return (relayInfo = false);
  if (relayInfo !== null && !force) return relayInfo;
  try { const r = await fetch(b + '/api/health', { cache: 'no-store', signal: timeoutSignal(6000) }); relayInfo = r.ok ? await r.json() : false; }
  catch (e) { relayInfo = false; }
  return relayInfo;
}
function bytesToB64(buf) { let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000)); return btoa(s); }
/* a Blob to the base64 the API wants; photos are shrunk first (same helper as the Scan card) */
async function toImageBlock(file) {
  const f = await shrinkPhoto(file);
  if (IMG_TYPES.indexOf(f.type) < 0) throw { code: 'image_rejected', message: 'Only JPEG, PNG, WebP or GIF.' };
  return { type: 'image', source: { type: 'base64', media_type: f.type, data: bytesToB64(new Uint8Array(await f.arrayBuffer())) } };
}
/* a password-protected PDF carries /Encrypt in its trailer; Claude cannot open those, so the person is told before anything is sent */
function pdfLocked(buf) {
  const tail = buf.length > 2000000 ? buf.subarray(buf.length - 2000000) : buf;
  return /\/Encrypt\b/.test(new TextDecoder('latin1').decode(tail));
}
/* a page count good enough for a limit: every page object carries /Type /Page */
function pdfPages(buf) { const m = new TextDecoder('latin1').decode(buf).match(/\/Type\s*\/Page(?![s\w])/g); return m ? m.length : 1; }
async function toDocBlock(file) {
  const name = file.name || 'file';
  if (file.size > DOC_LIMITS.maxInputBytes) throw { code: 'file_rejected', message: `${name} is too large. Export fewer months, or take screenshots of the pages.` };
  const buf = new Uint8Array(await file.arrayBuffer());
  if (buf.length < 8 || String.fromCharCode(buf[0], buf[1], buf[2], buf[3]) !== '%PDF') throw { code: 'file_rejected', message: `${name} is not a PDF.` };
  if (pdfLocked(buf)) throw { code: 'pdf_locked', message: `${name} asks for a password. Open it with the password, then save or print it as a new PDF, or take screenshots of its pages.` };
  return { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: bytesToB64(buf) }, _pages: pdfPages(buf), _bytes: buf.length };
}
async function relayMessages(input, images) {
  let msgs;
  if (typeof input === 'string') msgs = [{ role: 'user', content: input }];
  else if (Array.isArray(input) && input.length) msgs = input.map(m => ({ role: m.role, content: m.content }));
  else throw { code: 'invalid_request', message: 'input must be a prompt or a list of turns.' };
  const list = images ? (images instanceof Blob ? [images] : Array.from(images)) : [];
  if (list.length) {
    const blocks = []; for (const f of list) blocks.push(isPdfFile(f) ? await toDocBlock(f) : await toImageBlock(f));
    /* all the PDFs together have to fit one request: a size cap and a page cap, said plainly before anything is sent */
    const docs = blocks.filter(b => b.type === 'document'), pages = docs.reduce((n, b) => n + (b._pages || 1), 0), bytes = docs.reduce((n, b) => n + (b._bytes || 0), 0);
    if (docs.length > DOC_LIMITS.maxCount) throw { code: 'prompt_too_large', message: `Up to ${DOC_LIMITS.maxCount} PDFs at a time. 2 or 3 months of statements is plenty.` };
    if (pages > DOC_LIMITS.maxPages || bytes > DOC_LIMITS.maxTotalBytes) throw { code: 'prompt_too_large', message: `About ${pages} pages in ${docs.length} PDFs is too much for one read. Pick fewer months: 2 or 3 is plenty.` };
    docs.forEach(b => { delete b._pages; delete b._bytes; });
    const last = msgs[msgs.length - 1]; last.content = [{ type: 'text', text: String(last.content) }].concat(blocks);
  }
  return msgs;
}
async function relayError(r) {
  let j = null; try { j = await r.json(); } catch (e) { j = null; }
  const e = (j && j.error) || {}; return { code: e.code || (r.status === 429 ? 'rate_limited' : 'upstream_error'), message: e.message || ('HTTP ' + r.status), status: r.status };
}
/* tolerant JSON reading, the way sample.json reads: the whole text, else a code fence, else the first { or [ to the last } or ] */
function parseLoose(text) {
  const t = String(text || '').trim();
  const tries = [t];
  const fence = t.match(/```[a-z]*\s*([\s\S]*?)```/i); if (fence) tries.push(fence[1].trim());
  const a = t.search(/[[{]/), b = Math.max(t.lastIndexOf('}'), t.lastIndexOf(']')); if (a >= 0 && b > a) tries.push(t.slice(a, b + 1));
  for (const s of tries) { try { return { ok: true, value: JSON.parse(s) }; } catch (e) { /* next */ } }
  return { ok: false };
}
const relayCache = new Map();
function relayFn() {
  const base = relayBase();
  const call = async (body, signal) => {
    let r; try { r = await fetch(base + '/api/ai', { method: 'POST', headers: { 'content-type': 'application/json', 'x-app': 'mhr2000' }, body: JSON.stringify(body), signal }); }
    catch (e) { if (signal && signal.aborted) throw { code: 'cancelled', message: 'Stopped.' }; throw { code: 'upstream_error', message: 'No connection.' }; }
    if (!r.ok) throw await relayError(r);
    return r;
  };
  const fn = async (input, opts) => {
    opts = opts || {};
    if (opts.signal && opts.signal.aborted) throw { code: 'cancelled', message: 'Stopped before sending.' };
    const tier = opts.modelTier === 'inherit' || !opts.modelTier ? 'default' : opts.modelTier;
    if (['quick', 'default', 'complex'].indexOf(tier) < 0) throw { code: 'invalid_request', message: 'Unknown modelTier.' };
    const wantJson = !!opts.__json, hasImages = !!(opts.images && (opts.images instanceof Blob || opts.images.length));
    const key = !opts.tools && !hasImages && opts.cache !== false ? JSON.stringify([input, tier, wantJson]) : '';
    if (key && relayCache.has(key)) { const c = relayCache.get(key); if (Date.now() - c.t < 300000) { if (opts.onText) opts.onText({ text: c.text, delta: c.text }); return { text: c.text, truncated: c.truncated, modelTierApplied: tier }; } relayCache.delete(key); }
    const body = { v: 1, anon: anonId(), invite: inviteCode(), tier, json: wantJson };
    if (opts.maxTokens > 0) body.max_tokens = Math.floor(opts.maxTokens);
    let messages = await relayMessages(input, opts.images);
    if (opts.tools && opts.tools.length) {
      body.tools = opts.tools.map(t => ({ name: t.name, description: t.description, input_schema: t.inputSchema || { type: 'object', properties: {} } }));
      const texts = []; let res = null;
      for (let round = 0; round < 8; round++) {
        res = await (await call(Object.assign({}, body, { messages }), opts.signal)).json();
        const t = (res.content || []).filter(b => b.type === 'text').map(b => b.text).join(''); if (t) texts.push(t);
        const uses = (res.content || []).filter(b => b.type === 'tool_use');
        if (!uses.length || res.stop_reason !== 'tool_use') break;
        const results = await Promise.all(uses.map(async u => {
          const tool = opts.tools.find(x => x.name === u.name); let out;
          try { out = tool ? await tool.execute(u.input || {}, { signal: opts.signal || new AbortController().signal }) : 'Error: unknown tool'; }
          catch (e) { out = 'Error: ' + ((e && e.message) || String(e)); }
          return { type: 'tool_result', tool_use_id: u.id, content: typeof out === 'string' ? out : JSON.stringify(out === undefined ? null : out).slice(0, 32768) };
        }));
        if (opts.signal && opts.signal.aborted) throw { code: 'cancelled', message: 'Stopped.', text: texts.join('\n\n') };
        messages = messages.concat([{ role: 'assistant', content: res.content }, { role: 'user', content: results }]);
        res = null;
      }
      const text = texts.join('\n\n');
      if (!text) throw { code: 'empty_completion', message: 'No text came back.' };
      if (opts.onText) opts.onText({ text, delta: text });
      return { text, truncated: !!(res && res.truncated), modelTierApplied: tier };
    }
    if (opts.onText) {
      const r = await call(Object.assign({}, body, { messages, stream: true }), opts.signal);
      if (!/event-stream/.test(r.headers.get('content-type') || '')) { const j = await r.json(); opts.onText({ text: j.text, delta: j.text }); return { text: j.text, truncated: !!j.truncated, modelTierApplied: tier }; }
      const reader = r.body.getReader(), dec = new TextDecoder(); let buf = '', text = '', fin = null;
      try {
        for (;;) {
          const { value, done } = await reader.read(); if (done) break;
          buf += dec.decode(value, { stream: true }); let i;
          while ((i = buf.indexOf('\n\n')) >= 0) {
            const block = buf.slice(0, i); buf = buf.slice(i + 2);
            const line = block.split('\n').find(l => l.startsWith('data:')); if (!line) continue;
            let ev; try { ev = JSON.parse(line.slice(5)); } catch (e) { continue; }
            if (ev.t) { text += ev.t; opts.onText({ text, delta: ev.t }); }
            else if (ev.error) throw Object.assign({ text }, ev.error);
            else if (ev.done) fin = ev;
          }
        }
      } catch (e) { if (e && e.code) throw e; if (opts.signal && opts.signal.aborted) throw { code: 'cancelled', message: 'Stopped.', text }; throw { code: 'upstream_error', message: 'The connection dropped.', text }; }
      if (!text) throw { code: 'empty_completion', message: 'No text came back.' };
      if (key) relayCache.set(key, { t: Date.now(), text, truncated: !!(fin && fin.truncated) });
      return { text, truncated: !!(fin && fin.truncated), modelTierApplied: tier };
    }
    const j = await (await call(Object.assign({}, body, { messages }), opts.signal)).json();
    if (!j.text) throw { code: 'empty_completion', message: 'No text came back.' };
    if (key) relayCache.set(key, { t: Date.now(), text: j.text, truncated: !!j.truncated });
    return { text: j.text, truncated: !!j.truncated, modelTierApplied: tier };
  };
  fn.json = async (input, opts) => {
    const r = await fn(input, Object.assign({}, opts || {}, { __json: true }));
    const p = parseLoose(r.text);
    if (!p.ok || r.truncated) { try { console.warn('[mhr] the answer was not usable JSON' + (r.truncated ? ' (cut short)' : '') + ':', String(r.text).slice(0, 3000)); } catch (e) {} throw { code: 'invalid_json', message: r.truncated ? 'The answer was cut short.' : 'No JSON in the answer.', text: r.text }; }
    return p.value;
  };
  fn.limits = async () => ({ maxPromptBytes: 262144, images: { maxCount: 10, maxInputBytes: 20000000, mediaTypes: IMG_TYPES.slice() }, documents: Object.assign({}, DOC_LIMITS, { mediaTypes: DOC_LIMITS.mediaTypes.slice() }), tools: { maxCount: 16 }, modelTiers: ['quick', 'default', 'complex'] });
  fn.relay = true;
  return fn;
}

/* ===== moving between the Claude link and the app's own address =====
   The Claude page is a mirror. Its banner opens the app at its own address with the numbers carried in the link's hash
   (the part after #, which never reaches any server). The app reads it once, offers to load it, and clears it. */
const b64u = s => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = s => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4))));
const moveLink = () => { try { return RELAY_URL + '/#move=' + b64u(JSON.stringify(S)); } catch (e) { return RELAY_URL; } };
const showMoveBanner = () => !!RELAY_URL && inArtifact() && !S.ui.noMove;
function renderMoveBanner() {
  const el = $('#moveBanner'); if (!el) return;
  if (!showMoveBanner()) { el.hidden = true; return; }
  const has = hasData(S);
  put(el, `<div class="hn-t"><b>The app has its own address</b><span>Works without a Claude account: reading statements, receipts and the assistant are on for everyone there.</span></div><div class="hn-b"><a class="btn small solid" id="moveGo" href="${esc(has ? moveLink() : RELAY_URL)}" target="_blank" rel="noopener noreferrer">${has ? 'Open it and move my numbers' : 'Open it'}</a><button type="button" class="link" data-move-hide>Not now</button></div>`);
  el.hidden = false;
}
/* on the app's own address: numbers arriving in the hash */
let moveIn = null;
function moveRead() {
  try {
    const m = location.hash.match(/^#move=([A-Za-z0-9_-]+)$/); if (!m) return;
    history.replaceState(null, '', location.pathname + location.search);
    const d = JSON.parse(unb64u(m[1]));
    if (okBackup(d) && hasData(d)) moveIn = d;
  } catch (e) { moveIn = null; }
}
function moveApply() {
  if (!moveIn) return;
  const d = moveIn; moveIn = null;
  const old = S; S = upgradeLegacy(normalize(d)); S.ui = Object.assign({}, S.ui, { sampleHidden: true }); delete S.ui.noMove; if (!Array.isArray(d.receipts)) S.receipts = old.receipts;
  S.ui.bk = Date.now(); delete S.ui.bkLater;
  editRow = null; editGoal = null; editRc = null; itemsSig = '';
  if (tourIsOpen) closeTour(false); else { persist(); restructure(); }
  cheer('Your numbers are here.'); sfx('next');
}
