/* ---------- Ask (DECISIONS_ROUND2 E8; the old app's Ask chat, ui46.js and ui4a.js, on the new engine) ----------
   A question box. Each question goes to the AI with a short summary of today's figures from the engine
   (ASK3C.summary: names and short refs, never a record id, a note, a shop or a single spend), through the same route
   as Add statements (STMT3_AI.connect: the site's relay, or the viewer's own Claude). Nothing is sent until the person
   taps Ask, and "See what is sent" shows the exact summary. The answer comes back in a fixed shape: words, and changes
   the AI proposes from a short list. Each change is a ticked step with the engine's figures before and after
   (ASK3C.preview); only Apply carries them out, through ACT3 (the one write door), with Undo. The AI never writes.
   This file chooses, writes and places; it never adds, takes away or rounds. */
const ASK3 = { open: false, was: null, turns: [], busy: false, anon: null, route: null };
const ASK3_WORDS = {
  what: 'Your question and a short summary of today\'s figures go to Claude, the AI made by Anthropic: through this page\'s own server when it is opened from its own address, or through your own Claude account inside Claude. Your notes, shops and single spends are never sent. Nothing changes until you tap Apply.',
  relay: 'Your question and a short summary of today\'s figures go to Claude, the AI made by Anthropic, through this page\'s own server. Your notes, shops and single spends are never sent. Nothing changes until you tap Apply.',
  claude: 'Your question and a short summary of today\'s figures go to Claude through your own Claude account. Your notes, shops and single spends are never sent. Nothing changes until you tap Apply.',
  none: 'The AI can\'t be reached from this copy of the page. Open it from its own address, or inside Claude.'
};
const ASK3_TRY = ['How much can I spend before pay day?', 'What is due before next pay?', 'I spent 1,200 on lunch today'];

function openAsk3() {
  if (ASK3.open) return;
  if (!E3.book) { msg3('Set up first'); return; }
  ASK3.open = true;
  const sheet = $('#a3Ask');
  sheet.innerHTML = `<div class="a3-sheet-in">
    <h1 id="a3AskT">Ask</h1>
    <div class="a3-card" data-card="ask-what"><p class="a3-next" id="a3AskWhat">${esc3(ASK3.route ? ASK3_WORDS[ASK3.route] : ASK3_WORDS.what)}</p>
      <details class="a3-ask-sent"><summary>See what is sent</summary><pre id="a3AskSent"></pre></details></div>
    <div class="a3-ask-log" id="a3AskLog" aria-live="polite"></div>
    <div class="a3-card" data-card="ask-in">
      <label class="a3-ask-label" for="a3AskIn">Your question</label>
      <textarea class="a3-in a3-text a3-ask-in" id="a3AskIn" rows="3" maxlength="500"></textarea>
      <div class="a3-actions"><button type="button" class="a3-btn solid" id="a3AskSend">Ask</button><button type="button" class="a3-btn" id="a3AskClose">Close</button></div>
      <div class="a3-ask-try">${ASK3_TRY.map(q => `<button type="button" class="a3-link" data-asktry="${esc3(q)}">${esc3(q)}</button>`).join('')}</div>
    </div></div>`;
  ASK3.was = [...document.querySelectorAll('[data-panel], .a3-tabs, #a3Check, #a3StmtBar, #a3Stmt, #a3Set, #a3Setup, #a3Rem')].map(el => [el, el.hidden]);
  ASK3.was.forEach(([el]) => { el.hidden = true; }); sheet.hidden = false;
  ask3Log();
  $('#a3AskSent').textContent = ask3Summary().text;
  $('#a3AskSend').addEventListener('click', () => ask3Send());
  $('#a3AskClose').addEventListener('click', closeAsk3);
  $('#a3AskIn').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask3Send(); } });
  for (const b of sheet.querySelectorAll('[data-asktry]')) b.addEventListener('click', () => { $('#a3AskIn').value = b.dataset.asktry; ask3Send(); });
  scrollTo(0, 0); $('#a3AskIn').focus();
}
function closeAsk3() {
  if (!ASK3.open) return;
  ASK3.open = false;
  $('#a3Ask').hidden = true; $('#a3Ask').innerHTML = '';
  (ASK3.was || []).forEach(([el, h]) => { el.hidden = h; }); ASK3.was = null;
  const b = $('#a3AskGo'); if (b) b.focus();
}
const ask3Summary = () => ASK3C.summary(E3.book, E3.today());
/* the chat so far: each question and answer (the cards with changes are not kept when the sheet closes) */
function ask3Log() {
  $('#a3AskLog').innerHTML = ASK3.turns.map(t => `${t.applied ? '' : `<p class="a3-ask-me">${esc3(t.q)}</p>`}<p class="a3-ask-ai">${esc3(t.a)}</p>`).join('');
}
function ask3Bubble(cls, text) {
  const p = document.createElement('p'); p.className = cls; p.textContent = text; $('#a3AskLog').appendChild(p); return p;
}

/* ---- the AI route: the same two ways as Add statements (STMT3_AI.connect) ---- */
function ask3Anon() {
  if (ASK3.anon) return ASK3.anon;
  const abc = 'abcdefghijklmnopqrstuvwxyz0123456789'; let s = '';
  for (const b of crypto.getRandomValues(new Uint8Array(16))) s += abc[b % abc.length];
  return (ASK3.anon = s);
}
async function ask3Relay(base, rq) {
  const body = { v: 1, anon: ask3Anon(), invite: '', tier: 'default', max_tokens: 2000, effort: 'low',
    tools: [{ name: rq.name, description: rq.description, input_schema: rq.schema }], tool_choice: { type: 'auto' },
    messages: [{ role: 'user', content: [{ type: 'text', text: rq.prompt + `\n\nAnswer by calling the ${rq.name} tool once.` }] }] };
  let r;
  try { r = await fetch(base + '/api/ai', { method: 'POST', headers: { 'content-type': 'application/json', 'x-app': 'mhr2000' }, body: JSON.stringify(body) }); }
  catch (e) { throw new Error('no connection. Check the internet and try again'); }
  if (r.status === 429) throw new Error('too many questions right now, try again in a minute');
  if (!r.ok) throw new Error('the AI did not answer (' + r.status + ')');
  const res = await r.json();
  const use = (res.content || []).find(b => b.type === 'tool_use' && b.name === rq.name);
  if (use && use.input && typeof use.input === 'object') return use.input;
  const text = (res.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim();
  if (text) return { answer: text, actions: [] };
  throw new Error('no answer came back');
}
async function ask3Claude(fn, rq) {
  if (typeof fn.form === 'function') return fn.form(rq.prompt, { name: rq.name, description: rq.description, schema: rq.schema, maxTokens: 2000 });
  if (typeof fn.json === 'function') return fn.json(rq.prompt + '\n\nReply with ONLY one JSON object with these properties: ' + JSON.stringify(rq.schema.properties));
  const r = await fn([{ role: 'user', content: rq.prompt }], { cache: false, modelTier: 'default' });
  return { answer: String((r && r.text) || ''), actions: [] };
}

async function ask3Send() {
  const box = $('#a3AskIn'), q = box.value.trim();
  if (ASK3.busy) return;
  if (!q) { box.focus(); return; }
  ASK3.busy = true; $('#a3AskSend').disabled = true;
  box.value = '';
  ask3Bubble('a3-ask-me', q);
  const bot = ask3Bubble('a3-ask-ai a3-ask-wait', 'Working');
  try {
    const S = ask3Summary();
    $('#a3AskSent').textContent = S.text;
    const route = await STMT3_AI.connect();
    ASK3.route = route.how || 'none';
    $('#a3AskWhat').textContent = ASK3_WORDS[ASK3.route];
    if (!route.how) throw new Error(ASK3_WORDS.none);
    const rq = ASK3C.request(S.text, q, ASK3.turns);
    const raw = route.how === 'relay' ? await ask3Relay(route.base, rq) : await ask3Claude(route.fn, rq);
    const chk = ASK3C.check(raw, S.refs, { book: E3.book, today: E3.today() });
    bot.classList.remove('a3-ask-wait');
    bot.textContent = chk.answer || (chk.steps.length ? 'Here is a change you can apply' : 'No answer came back. Ask it another way');
    ASK3.turns.push({ q, a: bot.textContent });
    if (chk.steps.length || chk.dropped.length) await ask3Card(chk);
  } catch (e) {
    bot.classList.remove('a3-ask-wait'); bot.classList.add('a3-bad');
    const m = String((e && e.message) || e);
    bot.textContent = m === ASK3_WORDS.none ? m : 'That didn\'t go through: ' + m + '. Your question is back in the box';
    box.value = q;
  }
  ASK3.busy = false; $('#a3AskSend').disabled = false;
}

/* ---- a proposed change: ticked steps, the engine's figures before and after, Apply, Not now, Undo ---- */
async function ask3Card(chk) {
  const card = document.createElement('div');
  card.className = 'a3-card a3-ask-card'; card.dataset.card = 'ask-change';
  const cur = E3.home();
  const steps = chk.steps.map(s => Object.assign({ on: true }, s));
  card.innerHTML = `${steps.length ? `<h2>Proposed change</h2>
    <div class="a3-ask-steps">${steps.map((s, i) => `<label class="a3-check"><input type="checkbox" data-askstep="${i}" checked> <span>${esc3(s.text)}</span></label>`).join('')}</div>
    <ul class="a3-rows a3-ask-figs" data-ask="figs"></ul>
    <p class="a3-err" data-ask="err" role="status"></p>
    <div class="a3-actions" data-ask="foot"><button type="button" class="a3-btn solid" data-ask="apply">Apply</button><button type="button" class="a3-btn" data-ask="skip">Not now</button></div>` : ''}
${chk.dropped.length ? `<p class="a3-sub" data-ask="dropped">Left out because the app could not read them: ${esc3(chk.dropped.join('; '))}</p>` : ''}`;
  $('#a3AskLog').appendChild(card);
  if (!steps.length) return;
  const $c = s => card.querySelector(`[data-ask="${s}"]`);
  const on = () => steps.filter(s => s.on);
  async function paint() {
    const list = on();
    $c('apply').textContent = list.length > 1 ? `Apply ${list.length} changes` : 'Apply';
    $c('apply').disabled = !list.length;
    if (!list.length) { $c('figs').innerHTML = ''; $c('err').textContent = ''; return; }
    const p = await ASK3C.preview(E3.book, list, { today: E3.today(), told: () => E3.told(), newId: () => E3.newId() });
    if (!p.ok) { $c('figs').innerHTML = ''; $c('err').textContent = p.text; $c('apply').disabled = true; return; }
    $c('err').textContent = '';
    $c('figs').innerHTML = `<li class="a3-ask-head"><span></span><span>Now</span><span>After</span></li>` + p.rows.map(r => `<li data-askfig="${esc3(r.key)}"><span>${esc3(r.label)}</span>`
      + `<span class="amt">${r.before == null ? '' : fig3('ask.before', r.before, cur)}</span><span class="amt">${r.after == null ? '' : fig3('ask.after', r.after, cur)}</span></li>`).join('');
    const P = BurrowScreens.provenance;   // the figures after are worked out by the engine for a book not kept yet
    $c('figs').querySelectorAll('[data-figure]').forEach(el => P.stamp(el, P.mark(Number(el.dataset.amt), E3.mode === 'try' ? 'sample' : 'worked')));
  }
  card.addEventListener('change', e => { const c = e.target.closest('[data-askstep]'); if (!c) return; steps[+c.dataset.askstep].on = c.checked; paint(); });
  $c('skip').addEventListener('click', () => { card.querySelectorAll('input').forEach(i => { i.disabled = true; }); $c('foot').innerHTML = '<p class="a3-sub">Not applied</p>'; $c('figs').innerHTML = ''; });
  $c('apply').addEventListener('click', async () => {
    const list = on(); if (!list.length) return;
    $c('apply').disabled = true;
    const res = await ASK3C.apply(ACT3, list);
    if (!res.ok) { $c('err').textContent = res.text + '. Nothing changed'; $c('apply').disabled = false; return; }
    card.querySelectorAll('input').forEach(i => { i.disabled = true; });
    const undo = async () => {
      const u = await ASK3C.undoAll(ACT3, res.steps);
      if (u.ok) ASK3.turns.push({ q: '', a: 'Taken back: ' + list.map(s => s.text).join('; '), applied: true });
      if (card.isConnected) $c('foot').innerHTML = `<p class="a3-sub" data-ask="undone">${u.ok ? 'Taken back' : esc3(u.text)}</p>`;
      MSG3.post({ kind: 'toast', key: 'act3', text: u.ok ? 'Undone' : u.text });
    };
    $c('foot').innerHTML = '<p class="a3-sub" data-ask="applied">Applied</p><button type="button" class="a3-btn" data-ask="undo">Undo</button>';
    $c('undo').addEventListener('click', undo);
    MSG3.post({ kind: 'undo', key: 'act3', text: list.length > 1 ? `${list.length} changes from Ask` : list[0].text, action: { label: 'Undo', run: undo } });
    ASK3.turns.push({ q: '(I applied the change)', a: 'Applied: ' + list.map(s => s.text).join('; '), applied: true });
  });
  await paint();
}

document.addEventListener('click', e => { if (e.target.closest && e.target.closest('#a3AskGo')) openAsk3(); });
document.addEventListener('click', e => { if (ASK3.open && e.target.closest && e.target.closest('#a3SetGo')) closeAsk3(); }, true);   // Settings over Ask: Ask closes first
document.addEventListener('keydown', e => { if (e.key === 'Escape' && ASK3.open) closeAsk3(); });
