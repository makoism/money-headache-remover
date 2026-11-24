/* ---------- the assistant panel (DECISIONS new foundation 12 to 14; DECISIONS_ROUND2 BU, BV, BW; AI_FIRST_PLAN 1 to 4) ----------
   One panel, always on screen: a bar at the foot of a phone ("Ask or tell me something") that opens to a sheet over the
   lower part, a column on the right on a wide screen, and, before setup, the whole first screen (the welcome, drawn into
   #a3Home). The conversation itself is chat3_core.js (CHAT3C, lane A): this file only places its turns and cards, keeps
   the chat on this device (IndexedDB `burrow3chat`, never in the book, the cloud copy or a backup), and gives the core
   what it needs (deps): the relay, the day, E3's book, ACT3, E3.fill and E3.discard.
   Each change the assistant makes is a card with what changed, the engine's figures before and after, and one-tap Undo;
   a delete or a change larger than safe to spend asks first (BW). The fill card has Undo while nothing else is written,
   then Start over, which asks first (BV2.9). When the site's AI is off or the relay fails, two ways always finish setup:
   "Set up on the screens" (setup3, filled from the draft) and "Use any AI" (copy the questions, paste the answer back).
   This file chooses, writes and places; it never adds, takes away or rounds. Words are drafts for Mako's copy pass. */
const CHAT3 = { state: null, busy: false, open: false, route: null, anon: null, db: null, off: null, any: false };
const CHAT3_WORDS = {
  privacy: 'What you type, today\'s figures with the names of your accounts, bills and income, and the setup answers so far go to Claude, the AI made by Anthropic, through this page\'s own server. Your notes, shops and single spends are not sent unless you type them. The chat stays on this device.',
  off: 'The assistant is off right now. You can still finish everything:',
  /* why a change card asks first (M6): the core's card.ask; its card.why is the AI's own words, not shown here */
  ask: { delete: 'This takes something away. Do it?', large: 'This is more than safe to spend. Do it?', guess: 'You didn\'t type this amount, it\'s the AI\'s guess. Is it right?' },
  upload: 'The whole file goes to the AI, with your name, address, employer and account number. On a payslip, crop out your My Number.',
  noFiles: 'Reading files in the chat comes next. For now, type the figures, or add statements on Receipts.',
  welcome: ['Hi, I\'ll set up your Burrow with you. I ask a few questions, about 10 minutes. You can type, and I\'ll say where to find each figure. What you tell me stays on this phone until you say fill it in.',
    'You tell me what\'s in your bank today, what comes in and what goes out and when. From that the app works out what\'s safe to spend until your next pay. Everything I fill in shows on the screens so you can check it.'],
  startOver: 'Start over? Your money on this device goes and the setup answers stay, so you can fill it in again. Anything you logged since is lost.',
};

/* below the wide screen the page scrolls inside #a3, above the bar (app3.css): every screen's scrollTo moves it too.
   A function declaration, so it stands for the window's scrollTo in every file of this page. */
function scrollTo(x, y) { window.scrollTo(x, y); const m = document.getElementById('a3'); if (m) m.scrollTop = y; }

/* ---- the chat kept on this device: its own IndexedDB, never the book's ---- */
function chat3Db() {
  if (CHAT3.db) return Promise.resolve(CHAT3.db);
  return new Promise(res => {
    let q;
    try { q = indexedDB.open('burrow3chat', 1); } catch (e) { res(null); return; }
    q.onupgradeneeded = () => q.result.createObjectStore('chat');
    q.onsuccess = () => { CHAT3.db = q.result; res(CHAT3.db); };
    q.onerror = () => res(null);
  });
}
async function chat3Get(key) {
  const db = await chat3Db(); if (!db) return null;
  return new Promise(res => { const g = db.transaction('chat').objectStore('chat').get(key); g.onsuccess = () => res(g.result || null); g.onerror = () => res(null); });
}
async function chat3Put(key, v) {
  if (E3.mode === 'try') return false;   // a try book keeps nothing, the chat about it neither
  const db = await chat3Db(); if (!db) return false;
  return new Promise(res => { const tx = db.transaction('chat', 'readwrite'); tx.objectStore('chat').put(v, key); tx.oncomplete = () => res(true); tx.onerror = () => res(false); });
}
/* the device id the relay counts by (BU3): drawn once, kept on this device */
async function chat3Anon() {
  if (CHAT3.anon) return CHAT3.anon;
  let a = await chat3Get('anon');
  if (!a) {
    const abc = 'abcdefghijklmnopqrstuvwxyz0123456789'; a = '';
    for (const b of crypto.getRandomValues(new Uint8Array(20))) a += abc[b % abc.length];
    await chat3Put('anon', a);
  }
  return (CHAT3.anon = a);
}
const chat3Save = () => chat3Put('state', CHAT3.state);
/* the code word: kept on this device by STMT3_AI (stmt3_ai.js), its box shown here when the relay asks for one */
const chat3Invite = () => STMT3_AI.word();
function chat3Word(bad) {
  const slot = $('#a3ChatWord'); if (!slot) return;
  STMT3_AI.wordBox(slot, bad, () => { const q = $('#a3ChatIn'); if (q) q.focus(); });
  const w = $('#a3WordIn'); if (w) w.focus();
}

/* ---- the relay: the core's body as is, one round ---- */
async function chat3Send(body) {
  const r0 = CHAT3.route;
  if (!r0 || r0.how !== 'relay') throw new Error('the assistant can\'t be reached from this copy of the page');
  try { return await STMT3_AI.post(r0.base, body, 'the daily limit is reached, or too many messages at once. Try again later, or use the screens'); }   // the one place a relay call is sent, with the code word
  catch (e) { if (e && e.word) CHAT3.word = e.message; throw e; }
}
function chat3Deps() {
  return {
    send: chat3Send, today: () => E3.today(), told: () => E3.told(), newId: () => E3.newId(),
    book: () => E3.book, mode: () => E3.mode, door: E3.book ? ACT3 : null,
    start: b => E3.fill(b), discard: () => E3.discard(),
    anon: CHAT3.anon || '', invite: chat3Invite(),
  };
}
/* is the site's AI there (/api/health says ai: true)? Asked once a page open; never from a plain file with no relay */
async function chat3Route() {
  if (CHAT3.route) return CHAT3.route;
  try { CHAT3.route = await STMT3_AI.connect(); } catch (e) { CHAT3.route = { how: null }; }
  CHAT3.off = CHAT3.route.how !== 'relay';
  return CHAT3.route;
}

/* ---- drawing ---- */
const chat3Full = () => !E3.book;   // before setup the panel is the first screen
function chat3Figs(rows) {
  const cur = E3.book ? E3.home() : 'JPY';
  if (!rows || !rows.length) return '';
  return `<ul class="a3-rows a3-chat-figs"><li class="a3-ask-head"><span></span><span>Before</span><span>After</span></li>${rows.map(r => `<li><span>${esc3(r.label)}</span>`
    + `<span class="amt">${r.before == null ? '' : fig3('ask.before', r.before, cur)}</span><span class="amt">${r.after == null ? '' : fig3('ask.after', r.after, cur)}</span></li>`).join('')}</ul>`;
}
function chat3Card(t) {
  const c = t.card || {}, id = esc3(t.id);
  if (c.kind === 'change') {
    const foot = c.status === 'done' ? `<p class="a3-sub" data-chat="status">Done</p><div class="a3-actions"><button type="button" class="a3-btn" data-chatundo="${id}">Undo</button></div>`
      : c.status === 'ask' ? `<p class="a3-sub" data-chat="status" data-ask="${esc3(c.ask || '')}">${esc3(CHAT3_WORDS.ask[c.ask] || CHAT3_WORDS.ask.large)}</p><div class="a3-actions"><button type="button" class="a3-btn solid" data-chatok="${id}">Do it</button><button type="button" class="a3-btn" data-chatnot="${id}">Not now</button></div>`
      : `<p class="a3-sub" data-chat="status">${esc3(c.status === 'undone' ? 'Taken back' : c.status === 'not now' ? 'Not done' : 'Not done: ' + (c.why || 'the app refused it'))}</p>`;
    return `<div class="a3-card a3-chat-card" data-card="chat-change" data-turn="${id}" data-status="${esc3(c.status)}"><h3>${c.status === 'ask' ? 'A change to check' : 'Changed'}</h3>
      <ul class="a3-chat-lines">${(c.lines || []).map(l => `<li>${esc3(l)}</li>`).join('')}</ul>${chat3Figs(c.rows)}${foot}</div>`;
  }
  if (c.kind === 'draft') {
    return `<div class="a3-card a3-chat-card" data-card="chat-draft" data-turn="${id}"><h3>Your answers so far</h3>
      ${(c.sections || []).map(s => `<div data-section="${esc3(s.key)}"><p class="a3-acct">${esc3(s.title)}</p><ul class="a3-chat-lines">${(s.lines || []).map(l => `<li>${esc3(l)}</li>`).join('')}</ul></div>`).join('')}
      ${(c.need || []).length ? `<p class="a3-sub" data-chat="need">Still needed: ${esc3(c.need.join('; '))}</p>` : ''}
      ${c.ready && !E3.book ? `<div class="a3-actions"><button type="button" class="a3-btn solid" data-chatfill="${id}">Fill in my Burrow</button></div>` : ''}</div>`;
  }
  if (c.kind === 'fill') {
    const f = c.figures || {}, cur = E3.book ? E3.home() : 'JPY';
    const figs = f.safe != null ? `<ul class="a3-rows"><li><span>${esc3(label3('safeToSpend'))}</span><span class="amt">${fig3('safeToSpend.headline', f.safe, cur)}</span></li>${f.bank != null ? `<li><span>${esc3(label3('bankToday'))}</span><span class="amt">${fig3('accounts.*.bank', f.bank, cur)}</span></li>` : ''}</ul>` : '';
    const foot = c.status === 'done' ? `<div class="a3-actions"><button type="button" class="a3-btn" data-chatundo="${id}">${E3.held() ? 'Undo' : 'Start over'}</button></div>`
      : `<p class="a3-sub" data-chat="status">${c.status === 'undone' ? 'Taken back. Your answers are kept' : 'Started over. Your answers are kept'}</p>`;
    return `<div class="a3-card a3-chat-card" data-card="chat-fill" data-turn="${id}" data-status="${esc3(c.status)}"><h3>Filled in</h3>${figs}${foot}</div>`;
  }
  return '';
}
function chat3Turn(t) {
  if (t.who === 'person') return `<p class="a3-ask-me" data-turn="${esc3(t.id)}">${esc3(t.text)}</p>`;
  /* [AI_FIRST_PLAN 7] an amount the AI wrote that is in nothing it was given: marked for checking against the screens */
  if (t.who === 'ai') return `<p class="a3-ask-ai" data-turn="${esc3(t.id)}">${esc3(t.text)}${(t.check || []).length ? `<span class="a3-chat-check" data-chat="check"><br>Check this: ${esc3(t.check.join(', '))} is the AI's own figure, not the app's. The screens have the app's figures</span>` : ''}</p>`;
  if (t.who === 'note') return `<p class="a3-chat-saved" data-turn="${esc3(t.id)}" role="status">${esc3(t.text)}</p>`;
  if (t.who === 'card') return chat3Card(t);
  return '';
}
/* the parts every form of the panel shares: the log, the box, the privacy line and "See what is sent", the ways when off */
function chat3Inner() {
  const st = CHAT3.state || CHAT3C.fresh();
  const welcome = chat3Full() && !st.turns.length ? CHAT3_WORDS.welcome.map(w => `<p class="a3-ask-ai">${esc3(w)}</p>`).join('') : '';
  const off = CHAT3.off ? `<div class="a3-card" data-card="chat-off"><p class="a3-sub">${esc3(CHAT3_WORDS.off)}</p><div class="a3-chat-ways">
      ${chat3Full() ? '<button type="button" class="a3-btn" id="a3ChatScreens">Set up on the screens</button>' : ''}
      <button type="button" class="a3-btn" id="a3ChatAny">Use any AI</button></div><div id="a3ChatAnyBox"></div></div>` : '';
  const lastCard = st.turns.filter(t => t.who === 'card' && t.card && t.card.kind === 'draft').pop();
  const live = !E3.book && st.draft && (!lastCard || JSON.stringify(lastCard.card) !== JSON.stringify(CHAT3C.draftCard(st.draft, E3.today())))
    ? chat3Card({ id: 'live', who: 'card', card: CHAT3C.draftCard(st.draft, E3.today()) }) : '';
  return `<div class="a3-chat-log" id="a3ChatLog" aria-live="polite">${welcome}${st.turns.map(chat3Turn).join('')}${live}</div>${off}
    <div id="a3ChatWord"></div>
    <div class="a3-chat-row"><label class="a3-vh" for="a3ChatIn">Ask or tell me something</label>
      <textarea class="a3-in a3-text" id="a3ChatIn" rows="1" maxlength="1000" placeholder="Ask or tell me something"></textarea>
      <button type="button" class="a3-btn solid" id="a3ChatSend">Send</button></div>
    <div class="a3-chat-ways"><button type="button" class="a3-link" id="a3ChatFile">Send a file</button></div><div id="a3ChatFileBox"></div>
    <p class="a3-sub" data-privacy="chat">${esc3(CHAT3_WORDS.privacy)}</p>
    <details class="a3-ask-sent"><summary>See what is sent</summary><pre id="a3ChatSent"></pre></details>`;
}
/* the panel itself: on Home before setup it is the welcome card; after setup the bar or the column */
function renderChat3() {
  const aside = $('#a3Chat');
  if (!aside) return;
  if (chat3Full() || E3.mode === 'try') { aside.hidden = true; aside.innerHTML = ''; document.body.classList.remove('a3-has-chat'); return; }
  aside.hidden = false; document.body.classList.add('a3-has-chat');
  const keep = $('#a3ChatIn') && $('#a3ChatIn').closest('#a3Chat') ? $('#a3ChatIn').value : '';
  aside.innerHTML = `<div class="a3-chat-head"><h2>The assistant</h2><button type="button" class="a3-link" id="a3ChatClose">Close</button></div>
    <div class="a3-chat-body">${chat3Inner()}</div>`;
  if (CHAT3.open) aside.setAttribute('data-open', ''); else aside.removeAttribute('data-open');
  /* closed on a phone: only the box shows, as the bar; a tap on it opens the sheet */
  const row = aside.querySelector('.a3-chat-row'); aside.appendChild(row);
  $('#a3ChatIn').value = keep;
  chat3Wire(aside);
}
/* before setup: the whole first screen, with the ways in that were there before */
function renderWelcome3(host) {
  host.innerHTML = `<section class="a3-card a3-welcome" data-card="first"><h2>Welcome to the burrow</h2>${chat3Inner()}
    <div class="a3-actions"><button type="button" class="a3-btn" id="a3SetupGo">Set up on the screens instead</button><button type="button" class="a3-btn" id="a3TryGo">See it with made-up numbers first</button><button type="button" class="a3-btn" id="a3OtherGo">I already use the burrow on another device</button></div></section>`;
  chat3Wire(host);
}
function chat3Wire(host) {
  const log = host.querySelector('#a3ChatLog');
  if (log) { const body = log.closest('.a3-chat-body'); if (body) body.scrollTop = body.scrollHeight; }
  const box = host.querySelector('#a3ChatIn');
  box.addEventListener('focus', () => { if (!chat3Full() && !CHAT3.open) { CHAT3.open = true; $('#a3Chat').setAttribute('data-open', ''); chat3SentNow(); } });
  box.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); chat3Go(); } });
  host.querySelector('#a3ChatSend').addEventListener('click', () => chat3Go());
  const close = host.querySelector('#a3ChatClose');
  if (close) close.addEventListener('click', () => { CHAT3.open = false; $('#a3Chat').removeAttribute('data-open'); });
  host.querySelector('#a3ChatFile').addEventListener('click', chat3FileNotice);
  host.querySelectorAll('[data-chatundo]').forEach(b => b.addEventListener('click', () => chat3Undo(b.dataset.chatundo)));
  host.querySelectorAll('[data-chatok]').forEach(b => b.addEventListener('click', () => chat3Act(() => CHAT3C.confirm(CHAT3.state, b.dataset.chatok, chat3Deps()))));
  host.querySelectorAll('[data-chatnot]').forEach(b => b.addEventListener('click', () => chat3Act(() => CHAT3C.notNow(CHAT3.state, b.dataset.chatnot))));
  host.querySelectorAll('[data-chatfill]').forEach(b => b.addEventListener('click', () => chat3Act(() => CHAT3C.fillNow(CHAT3.state, chat3Deps()))));
  const scr = host.querySelector('#a3ChatScreens'); if (scr) scr.addEventListener('click', chat3Screens);
  const any = host.querySelector('#a3ChatAny'); if (any) any.addEventListener('click', chat3Any);
  if (CHAT3.any) chat3Any();
  host.querySelector('details.a3-ask-sent').addEventListener('toggle', chat3SentNow);
}
function chat3SentNow() {
  const pre = $('#a3ChatSent'); if (!pre || !CHAT3.state) return;
  try { pre.textContent = CHAT3C.sentText(CHAT3.state, ($('#a3ChatIn') || {}).value || '', chat3Deps()); } catch (e) { pre.textContent = ''; }
}
/* every redraw after the chat changed: the panel, and Home (a fill or a change shows there at once) */
function chat3Redraw() {
  if (E3.book && $('#a3Home').querySelector('.a3-welcome')) renderHome3();
  else if (!E3.book) renderHome3();
  else { renderChat3(); if (!$('#a3Home').hidden) renderHome3(); }
  if (E3.book) renderChat3();
}

/* ---- what the person does ---- */
async function chat3Go() {
  const box = $('#a3ChatIn'), q = (box.value || '').trim();
  if (CHAT3.busy) return;
  if (!q) { box.focus(); return; }
  await chat3Route();
  /* the relay asks for a code word and none is kept: its box first, the message stays in the box */
  if (!CHAT3.off && await STMT3_AI.needWord()) { chat3Word('Type the code word first, then send again'); return; }
  CHAT3.busy = true; $('#a3ChatSend').disabled = true;
  await chat3Anon();
  box.value = '';
  const log = $('#a3ChatLog');
  log.insertAdjacentHTML('beforeend', `<p class="a3-ask-me">${esc3(q)}</p><p class="a3-ask-ai a3-ask-wait" id="a3ChatWait">Working</p>`);
  let res = null;
  if (CHAT3.off) {
    res = { state: CHAT3.state, shown: [], stop: 'error', error: 'the assistant is off right now' };
  } else {
    try { res = await CHAT3C.turn(CHAT3.state, q, chat3Deps()); } catch (e) { res = { state: CHAT3.state, shown: [], stop: 'error', error: String((e && e.message) || e) }; }
  }
  CHAT3.state = res.state || CHAT3.state;
  if (CHAT3.word) {   // the word did not match: nothing of this message is kept; its box again, the message back in the box
    const added = new Set((res.shown || []).map(t => t.id));
    CHAT3.state = Object.assign({}, CHAT3.state, { turns: CHAT3.state.turns.filter(t => !added.has(t.id)) });
  }
  await chat3Save();
  CHAT3.busy = false;
  if (CHAT3.word) {
    const bad = CHAT3.word; CHAT3.word = null;
    chat3Redraw(); const b = $('#a3ChatIn'); if (b) b.value = q; chat3Word(bad); return;
  }
  if (res.stop === 'error') {
    CHAT3.off = true;   // the ways that always finish show beside the words
    chat3Redraw();
    if (!res.shown.length) {   // nothing was kept by the core (the AI is off here): the message goes back in the box
      const b = $('#a3ChatIn'); if (b) b.value = q;
      const l = $('#a3ChatLog'); if (l) l.insertAdjacentHTML('beforeend', `<p class="a3-ask-ai a3-bad" data-chat="error">That didn't go through: ${esc3(res.error || 'no answer')}. Your message is back in the box</p>`);
    }
    return;
  }
  chat3Redraw();
}
async function chat3Act(fn) {
  if (CHAT3.busy) return;
  CHAT3.busy = true;
  let r;
  try { r = await fn(); } catch (e) { r = { ok: false, text: String((e && e.message) || e) }; }
  CHAT3.busy = false;
  if (r && r.state) CHAT3.state = r.state;
  await chat3Save();
  if (r && r.ok === false && r.text) msg3(r.text);
  chat3Redraw();
  return r;
}
/* Undo on a card; for the fill once something else was written it is Start over, asked first */
async function chat3Undo(turnId) {
  const t = (CHAT3.state.turns || []).find(x => x.id === turnId);
  const isFill = t && t.card && t.card.kind === 'fill';
  if (isFill && !E3.held()) {
    if (!confirm(CHAT3_WORDS.startOver)) return;
    const r = await chat3Act(() => CHAT3C.startOver(CHAT3.state, chat3Deps()));
    if (r && r.ok !== false) MSG3.post({ kind: 'toast', key: 'chat3', text: 'Started over' });
    return;
  }
  const r = await chat3Act(() => CHAT3C.undo(CHAT3.state, turnId, chat3Deps()));
  if (r && r.ok !== false) MSG3.post({ kind: 'toast', key: 'chat3', text: 'Undone' });
}
/* before a file: what the whole file carries (BV6) */
function chat3FileNotice() {
  const box = $('#a3ChatFileBox'); if (!box) return;
  box.innerHTML = `<div class="a3-card" data-card="chat-upload"><p class="a3-sub" data-privacy="upload">${esc3(CHAT3_WORDS.upload)}</p>
    <div class="a3-actions"><label class="a3-btn a3-file">Choose the file<input type="file" accept=".csv,.tsv,.txt,.pdf,image/*" id="a3ChatPick"></label><button type="button" class="a3-btn" id="a3ChatFileX">Not now</button></div><p class="a3-sub" id="a3ChatFileSay"></p></div>`;
  $('#a3ChatFileX').addEventListener('click', () => { box.innerHTML = ''; });
  $('#a3ChatPick').addEventListener('change', () => { $('#a3ChatFileSay').textContent = CHAT3_WORDS.noFiles; });
}
/* "Set up on the screens": setup3, filled from the draft (ANSWERS3.toForm, the one shared answers function); the boxes
   are setup3's own, filled as a person would, so its Save is the same */
function chat3Screens() {
  openSetup3();
  const d = CHAT3.state && CHAT3.state.draft;
  if (!d || !(d.banks || []).length || typeof ANSWERS3 !== 'object') return;
  try { chat3FormFill(ANSWERS3.toForm(d)); } catch (e) { /* the form stays as it was: every box can still be typed */ }
}
function chat3FormFill(f) {
  const cur = f.cur || 'JPY';
  const amt = (el, v) => { if (el && v != null) el.value = SM.toInput(v, cur); };
  const val = (el, v) => { if (el && v != null) { el.value = String(v); el.dispatchEvent(new Event('change', { bubbles: true })); } };
  const txt = (el, v) => { if (el && v != null) el.value = v; };
  const last = sel => $$(sel).pop();
  val($('#s3Cur'), cur); val($('#s3Country'), f.country);
  txt($('#s3BankName'), f.bankName); amt($('#s3Bank'), f.bank);
  for (const a of f.accts || []) { $('#s3AddAcct').click(); const row = last('#a3Setup [data-row^=acct]'); txt(row.querySelector('[data-f=name]'), a.name); amt(row.querySelector('[data-f=amount]'), a.amount); val(row.querySelector('[data-f=type]'), a.type); }
  const p = f.pay || {};
  txt($('#s3PayName'), p.name); amt($('#s3PayAmt'), p.amount); val($('#s3PayEvery'), p.every); val($('#s3PayDay'), p.day); val($('#s3PayDay2'), p.day2);
  txt($('#s3PayStart'), p.start); val($('#s3PayShift'), p.shift); val($('#s3PayAcct'), p.acct);
  for (const x of f.pays || []) { $('#s3AddPay').click(); const row = last('#a3Setup [data-row^=pay]'); txt(row.querySelector('[data-f=name]'), x.name); amt(row.querySelector('[data-f=amount]'), x.amount); val(row.querySelector('[data-f=every]'), x.every); val(row.querySelector('[data-f=day]'), x.day); val(row.querySelector('[data-f=day2]'), x.day2); txt(row.querySelector('[data-f=start]'), x.start); val(row.querySelector('[data-f=acct]'), x.acct); }
  for (const c of f.cards || []) { $('#s3AddCard').click(); const row = last('#a3Setup [data-row^=card]'); txt(row.querySelector('[data-f=name]'), c.name); amt(row.querySelector('[data-f=owed]'), c.owed); val(row.querySelector('[data-f=payDay]'), c.payDay); val(row.querySelector('[data-f=closeDay]'), c.closeDay); val(row.querySelector('[data-f=payFrom]'), c.payFrom); val(row.querySelector('[data-f=shift]'), c.shift); amt(row.querySelector('[data-f=statement]'), c.statement); }
  for (const b of f.bills || []) { $('#s3AddBill').click(); const row = last('#a3Setup [data-row^=bill]'); txt(row.querySelector('[data-f=name]'), b.name); amt(row.querySelector('[data-f=amount]'), b.amount); val(row.querySelector('[data-f=every]'), b.every); val(row.querySelector('[data-f=month]'), b.month); val(row.querySelector('[data-f=day]'), b.day); val(row.querySelector('[data-f=from]'), b.from); }
  amt($('#s3Free'), f.free); amt($('#s3Min'), f.min);
  /* the questions the day asks (bills already out, a statement), from the boxes just filled, then their answers */
  $('#a3Setup').dispatchEvent(new Event('change', { bubbles: true }));
  (f.bills || []).forEach((b, i) => val($$('#a3Setup [data-row^=bill]')[i].querySelector('[data-f=takenOut]'), b.takenOut));
  if (f.payToday && $('#s3PayToday')) val($('#s3PayToday'), f.payToday);   // setup3's own question (lane/setupfix), when it has it
}
/* "Use any AI": the core's questions and answer shape as one request to copy (CHAT3C.copyPrompt); the answer pasted
   back goes through the same draft checks (CHAT3C.pasteBack), then the same draft card and Fill */
function chat3Any() {
  CHAT3.any = true;
  const box = $('#a3ChatAnyBox'); if (!box) return;
  box.innerHTML = `<p class="a3-sub">Copy this, send it to any AI chat, answer its questions there, then paste its whole last answer below</p>
    <textarea class="a3-in a3-text a3-chat-copy" id="a3ChatAnyAsk" readonly aria-label="The request for the AI">${esc3(CHAT3C.copyPrompt(CHAT3.state, E3.today()))}</textarea>
    <div class="a3-actions"><button type="button" class="a3-btn" id="a3ChatAnyCopy">Copy the request</button></div>
    <div class="a3-field"><label for="a3ChatAnyPaste">The AI's answer</label><textarea class="a3-in a3-text a3-chat-copy" id="a3ChatAnyPaste"></textarea></div>
    <p class="a3-err" id="a3ChatAnyErr" role="alert"></p>
    <div class="a3-actions"><button type="button" class="a3-btn solid" id="a3ChatAnyCheck">Check the answer</button></div>`;
  $('#a3ChatAnyCopy').addEventListener('click', () => { const t = $('#a3ChatAnyAsk'); t.select(); try { navigator.clipboard.writeText(t.value).then(() => msg3('Copied'), () => msg3('Select the request and copy it')); } catch (e) { msg3('Select the request and copy it'); } });
  $('#a3ChatAnyCheck').addEventListener('click', chat3AnyCheck);
}
async function chat3AnyCheck() {
  const r = CHAT3C.pasteBack(CHAT3.state, $('#a3ChatAnyPaste').value, chat3Deps());
  if (!r.ok) { $('#a3ChatAnyErr').textContent = r.text; return; }
  CHAT3.state = r.state; CHAT3.any = false;
  await chat3Save();
  chat3Redraw();
}

/* ---- start: the chat kept on this device, then the panel ---- */
async function startChat3() {
  const kept = E3.mode === 'try' ? null : await chat3Get('state');
  CHAT3.state = kept && kept.v === 1 ? kept : CHAT3C.fresh();
  await chat3Route();
  /* anything written through act3 after the fill means the fill can no longer be undone: the cloud copy may send */
  if (ACT3 && typeof ACT3.onChange === 'function') ACT3.onChange(() => { if (E3.held()) E3.release().then(() => renderChat3()); });
  if (!E3.book) renderHome3(); else renderChat3();
}
root3.BurrowApp3.chat = { CHAT3, redraw: chat3Redraw, save: chat3Save };   // for the page tests (start3.js)
