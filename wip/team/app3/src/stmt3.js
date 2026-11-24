/* ---------- Statements (DECISIONS_ROUND2 E4, E7; SCHEMA_V3 6.4) ----------
   Add statements: choose files for each account (the bank and each card), read them with the AI (stmt3_ai.js) or with
   any AI the person pastes from (STMT3R.pastePrompt and its checker), then a review: what was read, the card
   statements, each shop with its category (tap it for its lines) and what each line meets. "Add" writes the records
   STMT3P.records builds, through act3 (the one write door), as one step with Undo. Nothing is worked out here: the
   matching is engine/match.js, every amount on screen is one the plan returned.
   For setup3 ("Start from statements"): stmt3Start({ onRead }) opens the same sheet; once the files are read it hands
   onRead({ reads, assign, hints }) the reads, the account each belongs to and STMT3P.setupHints, and writes nothing. */
const STMT3_WORDS = {
  /* [E7] what really happens to a statement, said before anything is sent */
  ai: 'Reading a statement sends the whole file to the AI: every line on it, with your name and account numbers. The AI is made by Anthropic, which keeps what it is sent for a limited time under its own terms. Nothing is sent until you tap Read with the AI, and only the files you chose.',
  any: 'Here you send the files to an AI of your choosing yourself, under that company\'s terms. This page only reads the answer you paste in.',
  kept: 'The lines you add are kept with the rest of your numbers.'
};
const STMT3_TAG = { pay: 'Pay', other_income: 'Other money in', transfer_in: 'Your own money in', rent: 'Rent', util: 'Power and water', food: 'Food', net: 'Internet', phone: 'Phone',
  ins: 'Insurance', subs: 'Subscriptions', gas: 'Transport', loan: 'Loan', card_payment: 'Card payment', transfer_out: 'Sent or moved out', cash: 'Cash', play: 'Fun and shopping', other: 'Other' };
let stmt3 = null;
function stmt3Accts() { return (E3.book.accounts || []).filter(a => a && !a.gone && !a.closed && (a.type === 'bank' || a.type === 'card')); }
function stmt3Start(opts) {
  if (!E3.book) { msg3('Set up first'); return; }
  stmt3 = { files: {}, reads: [], assign: [], changed: {}, skip: {}, cardFor: {}, moveFor: {}, setup: opts || null };
  stmt3Pick();
}
function stmt3Show(html) {
  const sheet = $('#a3Stmt');
  sheet.innerHTML = `<div class="a3-sheet-in">${html}</div>`;
  sheet.hidden = false; $('#a3Home').hidden = true; stmt3Bar(); scrollTo(0, 0);
  return sheet;
}
function stmt3Close() {
  $('#a3Stmt').hidden = true; $('#a3Stmt').innerHTML = ''; $('#a3Home').hidden = false; stmt3 = null; stmt3Bar();
  const b = $('#a3StmtGo'); if (b) b.focus();
}
/* ---- step 1: the files ---- */
function stmt3Pick() {
  const accts = stmt3Accts();
  /* the kind word after the name only when the name does not already say it ("Visa card", never "Main bank bank") */
  const kind = a => { const k = a.type === 'card' ? 'card' : 'bank'; return new RegExp('\\b' + k + '\\b', 'i').test(a.name) ? '' : ` <span class="when">${k}</span>`; };
  const rows = accts.map(a => `<div class="a3-stmt-acct" data-acct="${esc3(a.id)}">
      <p><b>${esc3(a.name)}</b>${kind(a)}</p>
      <label class="a3-btn a3-file">Choose files<input type="file" multiple accept=".csv,.tsv,.txt,.pdf,image/*" data-files="${esc3(a.id)}"></label>
      <ul class="a3-stmt-files" data-list="${esc3(a.id)}">${(stmt3.files[a.id] || []).map(f => `<li>${esc3(f.name)}</li>`).join('')}</ul>
    </div>`).join('');
  const sheet = stmt3Show(`<h1 id="a3StmtT">Add statements</h1>
    <section class="a3-card"><h2>Before you start</h2><p class="a3-sub" data-privacy="ai">${esc3(STMT3_WORDS.ai)}</p><p class="a3-sub">${esc3(STMT3_WORDS.kept)}</p></section>
    <section class="a3-card"><h2>Your files</h2><p class="a3-sub">A CSV from your bank's website works best. PDFs and screenshots work too</p>${rows}
      <p class="a3-sub" id="a3StmtProg" aria-live="polite"></p><p class="a3-err" id="a3StmtErr"></p>
      <div class="a3-actions"><button type="button" class="a3-btn solid" id="a3StmtRead">Read with the AI</button><button type="button" class="a3-btn" id="a3StmtX">Back</button></div></section>
    <details class="a3-card" id="a3StmtAny"><summary>Use any AI instead</summary>
      <p class="a3-sub" data-privacy="any">${esc3(STMT3_WORDS.any)}</p>
      <p class="a3-sub">Copy this request, send it to the AI with your statement files, then paste its whole answer below</p>
      <textarea class="a3-in a3-area" id="a3StmtAsk" readonly rows="5" aria-label="The request for the AI">${esc3(STMT3R.pastePrompt({ today: E3.today() }))}</textarea>
      <div class="a3-actions"><button type="button" class="a3-btn" id="a3StmtCopy">Copy the request</button></div>
      <div class="a3-field"><label for="a3StmtPaste">The AI's answer</label><textarea class="a3-in a3-area" id="a3StmtPaste" rows="5"></textarea></div>
      <p class="a3-err" id="a3StmtPasteErr"></p>
      <div class="a3-actions"><button type="button" class="a3-btn solid" id="a3StmtCheck">Check the answer</button></div>
    </details>`);
  sheet.querySelectorAll('[data-files]').forEach(inp => inp.addEventListener('change', () => {
    stmt3.files[inp.dataset.files] = [...inp.files];
    sheet.querySelector(`[data-list="${inp.dataset.files}"]`).innerHTML = [...inp.files].map(f => `<li>${esc3(f.name)}</li>`).join('');
  }));
  $('#a3StmtX').addEventListener('click', stmt3Close);
  $('#a3StmtRead').addEventListener('click', stmt3ReadAI);
  $('#a3StmtCopy').addEventListener('click', () => { const t = $('#a3StmtAsk'); t.select(); try { navigator.clipboard.writeText(t.value).then(() => msg3('Copied'), () => msg3('Select the request and copy it')); } catch (e) { msg3('Select the request and copy it'); } });
  $('#a3StmtCheck').addEventListener('click', stmt3CheckPaste);
}
async function stmt3ReadAI() {
  const prog = $('#a3StmtProg'), err = $('#a3StmtErr'), btn = $('#a3StmtRead');
  const jobs = [];
  for (const a of stmt3Accts()) for (const f of stmt3.files[a.id] || []) jobs.push({ a, f, line: a.name + ', ' + f.name + ': waiting' });
  if (!jobs.length) { err.textContent = 'Choose a file for at least one account first'; return; }
  err.textContent = ''; btn.disabled = true;
  const paint = () => { prog.innerHTML = jobs.map(j => `<span class="a3-line${j.bad ? ' a3-bad-t' : ''}">${esc3(j.line)}</span>`).join(''); };
  const reads = [], assign = [];
  for (const j of jobs) {
    j.line = j.a.name + ', ' + j.f.name + ': reading'; paint();
    try {
      const r = await STMT3_AI.readFile(j.f, j.a, E3.today());
      j.line = j.a.name + ', ' + j.f.name + ': ' + (r.rows.length ? `${r.rows.length} ${r.rows.length === 1 ? 'line' : 'lines'}${r.from ? `, ${day3(r.from, E3.today().slice(0, 4))} to ${day3(r.to, E3.today().slice(0, 4))}` : ''}` : 'no lines found');
      if (r.rows.length) { reads.push(r); assign.push(j.a.id); }
    } catch (e) { j.bad = true; j.line = j.a.name + ', ' + j.f.name + ': ' + ((e && e.message) || 'could not be read'); }
    paint();
  }
  btn.disabled = false;
  if (!reads.length) { err.textContent = 'Nothing could be read. Each file\'s line above says why'; return; }
  stmt3Got(reads, assign);
}
/* a pasted answer: each statement goes to the account whose name it names, else the next of its kind */
function stmt3CheckPaste() {
  const out = $('#a3StmtPasteErr'), c = STMT3R.checkPaste($('#a3StmtPaste').value, E3.today());
  if (!c.ok) { out.textContent = c.problems.join('. '); return; }
  const accts = stmt3Accts(), used = new Set();
  const norm = s => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
  const assign = c.reads.map(r => {
    const byName = accts.find(a => !used.has(a.id) && norm(r.account).includes(norm(a.name)));
    const byKind = accts.find(a => !used.has(a.id) && (a.type === 'card') === (r.kind === 'card'));
    const a = byName || byKind || accts[0];
    used.add(a.id);
    return a.id;
  });
  if (c.problems.length) msg3(c.problems.join('. '));
  stmt3Got(c.reads, assign);
}
function stmt3Got(reads, assign) {
  stmt3.reads = reads; stmt3.assign = assign;
  if (stmt3.setup && stmt3.setup.onRead) {
    const cats = {}; for (const r of reads) for (const x of r.rows) if (x.cat && !cats[x.k]) cats[x.k] = x.cat;
    const cur = BurrowEngine.ledger.homeOn(E3.book, E3.today());
    const done = stmt3.setup.onRead;
    stmt3Close();
    done({ reads, assign, hints: STMT3P.setupHints(reads, cats, cur, E3.today()) });
    return;
  }
  stmt3Review();
}
/* ---- step 2: the review ---- */
function stmt3Plan() {
  const cats = Object.assign(STMT3P.knownCats(E3.book), stmt3.changed);
  stmt3.plan = STMT3P.plan(E3.book, stmt3.reads, { today: E3.today(), assign: stmt3.assign, cats, cardFor: stmt3.cardFor, cardOf: STMT3P.knownCards(E3.book), moveFor: stmt3.moveFor, moveOf: STMT3P.knownMoves(E3.book) });
  return stmt3.plan;
}
function stmt3Tag(l, yr) {
  if (l.status === 'repeat') return 'already here';
  if (l.status === 'pick') return 'a card payment: which card is asked at the top';
  if (l.status === 'askmove') return 'money sent out: asked at the top';
  if (l.k === 'transfer' && l.status !== 'meets') return 'moved to ' + E3.nameOf(l.to);
  if (l.status === 'typed') { const t = E3.book.events.find(e => e.id === l.typed); return 'you typed this' + (t ? ' on ' + day3(t.date, yr) : ''); }
  if (l.status === 'meets') return l.metImport ? 'the same payment as the line from your bank' : 'the payment you ticked';
  const pays = l.k === 'repay' ? 'pays ' + E3.nameOf(l.to) : '';
  if (l.status === 'settles') { const o = BurrowEngine.ids.occurrence(l.settles[0]); return `${pays ? pays + ', ' : ''}${o ? `${E3.occName(l.settles[0])} due ${day3(o.due, yr)}` : ''}`; }
  return pays;
}
function stmt3Review() {
  const p = stmt3Plan(), yr = E3.today().slice(0, 4), cur = id => E3.curOf(id);
  const byId = {}; for (const l of p.lines) byId[l.id] = l;
  const accts = stmt3Accts();
  const readRows = p.reads.map(r => `<li><span>${esc3(r.file)}<br><span class="when">${r.rows} ${r.rows === 1 ? 'line' : 'lines'}${r.from ? ', ' + esc3(day3(r.from, yr)) + ' to ' + esc3(day3(r.to, yr)) : ''}${r.notes.length ? '. ' + esc3(r.notes.join('. ')) : ''}</span></span>
      <select class="a3-in a3-sel" data-readacct="${r.idx}" aria-label="Which account ${esc3(r.file)} is">${accts.map(a => `<option value="${esc3(a.id)}"${a.id === r.acct ? ' selected' : ''}>${esc3(a.name)}</option>`).join('')}</select></li>`).join('');
  const sts = p.statements.map(s => `<label class="a3-tick a3-tick2" data-stmt="${esc3(s.id)}"><input type="checkbox" ${s.repeat ? 'disabled' : 'checked'} data-skip="${esc3(s.id)}">
      <span><span>${esc3(E3.nameOf(s.acct))}, closed ${esc3(day3(s.close, yr))}</span><span class="when">${s.repeat ? 'already here' : s.due ? 'to pay on ' + esc3(day3(s.due, yr)) : 'the statement'}</span></span>
      <span class="amt">${fig3('statement', s.a, cur(s.acct))}</span></label>`).join('');
  const opts = c => STMT_CATS.map(x => `<option value="${x}"${x === c ? ' selected' : ''}>${esc3(STMT3_TAG[x] || x)}</option>`).join('');
  const shops = p.merchants.map(m => `<div class="a3-stmt-m" data-mk="${esc3(m.key)}">
      <div class="a3-stmt-mrow"><button type="button" class="a3-stmt-mn" data-mx="${esc3(m.key)}" aria-expanded="false"><b>${esc3(m.name)}</b><span class="when">${m.rows.length} ${m.rows.length === 1 ? 'line' : 'lines'}${m.outA ? ', out ' + money3(m.outA, m.cur) : ''}${m.inA ? ', in ' + money3(m.inA, m.cur) : ''}</span></button>
      <select class="a3-in a3-sel" data-cat="${esc3(m.key)}" aria-label="Category for ${esc3(m.name)}">${opts(m.cat)}</select></div>
      <ul class="a3-rows a3-stmt-rows" data-rowsof="${esc3(m.key)}" hidden>${m.rows.map(id => byId[id]).map(l => `<li data-line="${esc3(l.id)}" data-status="${l.status}">
        <label><input type="checkbox" data-skip="${esc3(l.id)}" ${l.status === 'repeat' ? 'disabled' : stmt3.skip[l.id] ? '' : 'checked'}>
        <span>${esc3(day3(l.date, yr))}${l.posted ? ', posted ' + esc3(day3(l.posted, yr)) : ''}<br><span class="when">${esc3(E3.nameOf(l.acct))}${stmt3Tag(l, yr) ? '. ' + esc3(stmt3Tag(l, yr)) : ''}</span></span></label>
        <span class="amt">${l.dir === 'in' ? '+' : ''}${money3(l.a, cur(l.acct))}</span></li>`).join('')}</ul></div>`).join('');
  /* [MAIN 15] a card payment the page could not tie to one card: the person says which; nothing is guessed */
  const picks = p.lines.filter(l => l.status === 'pick').map(l => `<div class="a3-field" data-pickline="${esc3(l.id)}"><label for="a3pk-${esc3(l.id)}">${esc3(l.text)}, ${esc3(day3(l.date, yr))}, ${money3(l.a, cur(l.acct))}</label>
      <select class="a3-in a3-sel" id="a3pk-${esc3(l.id)}" data-pick="${esc3(l.id)}"><option value="">Choose the card</option>${l.cards.map(id => `<option value="${esc3(id)}">${esc3(E3.nameOf(id))}</option>`).join('')}</select></div>`).join('');
  /* [BJ4] money sent out that names none of the person's accounts: a move to one of them, or a spend? */
  const asks = p.lines.filter(l => l.status === 'askmove').map(l => `<div class="a3-field" data-askline="${esc3(l.id)}"><label for="a3mv-${esc3(l.id)}">${esc3(l.text)}, ${esc3(day3(l.date, yr))}, ${money3(l.a, cur(l.acct))}</label>
      <select class="a3-in a3-sel" id="a3mv-${esc3(l.id)}" data-move="${esc3(l.id)}"><option value="">Choose</option>${l.accts.map(id => `<option value="${esc3(id)}">Yes, to ${esc3(E3.nameOf(id))}</option>`).join('')}<option value="no">No, it went to someone else</option></select></div>`).join('');
  /* [walk 4] while a question is open nothing is added, so no line is ever left out without the person knowing */
  const c = p.counts, open = p.lines.some(l => (l.status === 'pick' || l.status === 'askmove') && !stmt3.skip[l.id]);
  const adding = open ? 0 : p.lines.filter(l => l.status !== 'repeat' && !stmt3.skip[l.id]).length;
  const said = [c.settles ? c.settles + ' are bills, pay or card payments you expected' : '', c.typed ? `${c.typed} ${c.typed === 1 ? 'is one you typed' : 'are ones you typed'}` : '',
    c.meets ? c.meets + ' read twice, from your bank and your card' : '', c.repeat ? c.repeat + ' already here, left out' : '', c.pick ? `${c.pick} ${c.pick === 1 ? 'card payment needs' : 'card payments need'} you to say which card` : '', c.askmove ? `${c.askmove} sent out: ${c.askmove === 1 ? 'is it' : 'are they'} a move to your own account?` : ''].filter(Boolean);
  const sheet = stmt3Show(`<h1 id="a3StmtT">What was read</h1>
    <section class="a3-card"><h2>${c.read} ${c.read === 1 ? 'line' : 'lines'}</h2><p class="a3-sub" data-fig="stmtsum">${esc3(said.join('. ') || 'All new')}</p>
      <ul class="a3-rows">${readRows}</ul></section>
    ${asks ? `<section class="a3-card" id="a3StmtMoves"><h2>Is this a move to one of your accounts?</h2><p class="a3-sub">Money moved between your own accounts is not spending. It is added once you answer</p>${asks}</section>` : ''}
    ${picks ? `<section class="a3-card" id="a3StmtPicks"><h2>Which card does this pay?</h2><p class="a3-sub">These left your bank as a card payment, and more than one card could be the one. It is added once you choose</p>${picks}</section>` : ''}
    ${sts ? `<section class="a3-card"><h2>Card statements</h2>${sts}</section>` : ''}
    <section class="a3-card"><h2>Shops and categories</h2><p class="a3-sub">Tap a shop to see its lines. Untick a line to leave it out</p>${shops}</section>
    <p class="a3-err" id="a3StmtErr"></p>
    <div class="a3-actions"><button type="button" class="a3-btn solid" id="a3StmtAdd" ${adding ? '' : 'disabled'}>${adding ? 'Add ' + adding + (adding === 1 ? ' line' : ' lines') : open ? 'Answer the question above' : 'Nothing new to add'}</button><button type="button" class="a3-btn" id="a3StmtBack">Back</button></div>`);
  sheet.querySelectorAll('[data-mx]').forEach(b => b.addEventListener('click', () => {
    const ul = sheet.querySelector(`[data-rowsof="${CSS.escape(b.dataset.mx)}"]`); ul.hidden = !ul.hidden; b.setAttribute('aria-expanded', String(!ul.hidden));
  }));
  sheet.querySelectorAll('[data-cat]').forEach(s => s.addEventListener('change', () => { stmt3.changed[s.dataset.cat] = s.value; stmt3Again(); }));
  sheet.querySelectorAll('[data-readacct]').forEach(s => s.addEventListener('change', () => { stmt3.assign[+s.dataset.readacct] = s.value; stmt3Again(); }));
  sheet.querySelectorAll('[data-move]').forEach(x => x.addEventListener('change', () => { if (x.value) { stmt3.moveFor[x.dataset.move] = x.value; stmt3Again(); } }));
  sheet.querySelectorAll('[data-pick]').forEach(x => x.addEventListener('change', () => { if (x.value) { stmt3.cardFor[x.dataset.pick] = x.value; stmt3Again(); } }));
  sheet.querySelectorAll('[data-skip]').forEach(x => x.addEventListener('change', () => { if (x.checked) delete stmt3.skip[x.dataset.skip]; else stmt3.skip[x.dataset.skip] = true; stmt3Again(); }));
  $('#a3StmtBack').addEventListener('click', stmt3Pick);
  $('#a3StmtAdd').addEventListener('click', stmt3Add);
}
/* the review drawn again after a change, keeping which shops are open and where it was scrolled */
function stmt3Again() {
  const open = [...document.querySelectorAll('[data-rowsof]')].filter(u => !u.hidden).map(u => u.dataset.rowsof), y = ($('#a3') || {}).scrollTop || scrollY;   // the page may scroll inside #a3 (chat3.js)
  stmt3Review();
  for (const k of open) { const u = document.querySelector(`[data-rowsof="${CSS.escape(k)}"]`); if (u) { u.hidden = false; document.querySelector(`[data-mx="${CSS.escape(k)}"]`).setAttribute('aria-expanded', 'true'); } }
  scrollTo(0, y);
}
async function stmt3Add() {
  const p = stmt3.plan, btn = $('#a3StmtAdd');
  const out = STMT3P.records(E3.book, p, { told: E3.told(), skip: stmt3.skip });
  const cats = STMT3P.catsToKeep(p, stmt3.changed, E3.told());
  const n = out.events.filter(e => e.k !== 'check' && !e.gone).length;
  btn.disabled = true;
  const r = await ACT3.run('Statements added', w => {
    for (const e of out.events) { const f = w.find(e.id); if (f && f.rec.gone) w.restore('events', e.id); else if (!f) w.add('events', e); }
    for (const c of out.checkins) w.add('checkins', c);
    w.book.imports = Object.assign({}, w.book.imports, { cats: Object.assign({}, (w.book.imports || {}).cats, cats) });
  }, { undo: 'Added ' + n + (n === 1 ? ' line' : ' lines') + ' from statements' });
  if (!r.ok) { btn.disabled = false; $('#a3StmtErr').textContent = r.text; return; }
  stmt3Close(); renderHome3();
  if (E3.mode === 'try') msg3('Added. These are made-up numbers, so nothing is saved');
}
/* the Add statements button under Home: there when there is a book and Home is showing */
function stmt3Bar() {
  const bar = $('#a3StmtBar'); if (!bar) return;
  bar.hidden = !E3.book || $('#a3Home').hidden || !$('#a3Stmt').hidden;
}
(() => {
  const go = $('#a3StmtGo'); if (go) go.addEventListener('click', () => stmt3Start());
  try { new MutationObserver(stmt3Bar).observe($('#a3Home'), { childList: true, attributes: true, attributeFilter: ['hidden'] }); } catch (e) { /* the bar stays as it is */ }
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#a3Stmt').hidden) stmt3Close(); });
})();
