/* ---------- Receipts (the receipts lane; old app: ui4.js and the Log spend card, rebuilt on the new engine) ----------
   Log a spend fast (amount, what it was for, the account or card, the day (today unless changed), a note), a refund,
   or money moved between two of your own accounts. The list goes by period (the engine's res.period, named by its
   dates) with Earlier and Later, and a search across everything. A tap on a row opens it to change or remove; every
   write goes through ACT3 (src/act3.js), which gives the Undo bar. Free to spend left and safe to spend are the
   engine's, before and after: for a draft the engine is asked about the book the draft would make (ACT3.dry). This
   file chooses, writes and places; it never adds, takes away or rounds (tests: no_maths.js, e3_receipts.js). */
const RC3 = { mode: 'spend', edit: null, at: null, search: '', last: null, held: null, from: null };
const RC_KIND3 = { spend: 'logSpend', refund: 'refund', moved: 'moveMoney', in: 'moneyIn' };
const RC_SPEND_FROM3 = { bank: 1, cash: 1, ewallet: 1, wallet: 1, card: 1, paylater: 1 };
const RC_OWN3 = { bank: 1, cash: 1, ewallet: 1, wallet: 1 };

/* ---- what is in the book, by name (lookups, nothing worked out) ---- */
const rcLive3 = x => x && !x.gone;
function rcAccounts3(kinds) { return ((E3.book && E3.book.accounts) || []).filter(a => rcLive3(a) && kinds[a.type] && !a.closed); }
function rcFors3() {
  const b = E3.book || {}, out = [{ v: 'line:free', name: 'Free to spend' }];
  for (const l of ((b.plan || {}).budgets || []).filter(rcLive3)) out.push({ v: 'line:' + l.id, name: l.name });
  for (const g of (b.places || []).filter(rcLive3)) out.push({ v: 'place:' + g.id, name: g.name });
  return out;
}
function rcForName3(e) {
  if (e.place) { const g = (E3.book.places || []).find(x => x.id === e.place); return g ? g.name : e.place; }
  if (!e.line || e.line === 'free') return 'Free to spend';
  const l = ((E3.book.plan || {}).budgets || []).find(x => x.id === e.line); return l ? l.name : 'a line no longer in your plan';
}
/* the records Receipts lists: what a person logged or an import read, never a ticked pay or bill (those carry `settles`) */
/* what was logged, as the engine knows it on the shown day: a record dated or told after that day is not known yet
   (the look ahead's own rule; it matters when the made-up book is stepped through the days) */
const rcKnown3 = e => e.date <= E3.today() && String(e.told || e.date).slice(0, 10) <= E3.today();
/* [BI2] each record once: a statement line matched to a typed record or a move is one row, through the engine's countOnce
   (the look ahead's own matching, for the shown day; worked out once per book and day) */
let rcOnce3 = { book: null, day: null, res: null };
function rcCounted3() {
  if (!E3.book) return [];
  if (rcOnce3.book !== E3.book || rcOnce3.day !== E3.today()) {
    let res = null; try { res = E3.view(E3.today()); } catch (e) { res = null; }
    rcOnce3 = { book: E3.book, day: E3.today(), res };
  }
  return BurrowEngine.lookahead.countOnce(E3.book, rcOnce3.res);
}
/* [walk 4] a statement row that stands for typed records shows their notes beside its own words: "SUPER (groceries)" */
function rcNote3(e) {
  const away = (rcOnce3.res && rcOnce3.res.dropped) || {};
  const typed = e.src && e.src.type === 'statement' ? ((E3.book && E3.book.events) || []).filter(t => t && t.note && away[t.id] === e.id && t.note !== e.note).map(t => t.note) : [];
  return [e.note || '', typed.length ? '(' + typed.join(', ') + ')' : ''].filter(Boolean).join(' ');
}
function rcRows3() {
  return rcCounted3().filter(e => rcLive3(e) && rcKnown3(e) && !e.of && !(e.settles && e.settles.length)
    && (e.k === 'spend' || e.k === 'transfer' || (e.k === 'in' && e.sub === 'refund') || rcMoneyIn3(e)));
}
/* [M6, M61; qc-data-safety B1] the one question before a remove on the screens (Receipts and Plan use it; tests/e3_removes.js
   counts every removing button). The first tap writes nothing: `host` shows what goes, with a yes and a no */
function sure3(host, words, yes, run) {
  if (!host) return;
  host.innerHTML = `<div class="a3-sure" data-sure><p class="a3-warn">${esc3(words)}</p><div class="a3-actions"><button type="button" class="a3-btn solid" data-sureyes>${esc3(yes)}</button><button type="button" class="a3-btn" data-sureno>No, keep it</button></div></div>`;
  host.querySelector('[data-sureyes]').addEventListener('click', () => { host.innerHTML = ''; run(); });
  host.querySelector('[data-sureno]').addEventListener('click', () => { host.innerHTML = ''; });
  host.querySelector('[data-sureno]').focus();
}
/* [M7, M61; qc-data-safety B2] what the book holds that is dated or told after today (a backup or another device whose
   clock was ahead): not counted yet by the engine's rule, and never hidden. Listed apart, found by search, opened and
   removed like any row */
function rcAhead3(book) {
  book = book || E3.book;
  if (!book) return [];
  return (book.events || []).filter(e => e && rcLive3(e) && !rcKnown3(e) && !e.of && !(e.settles && e.settles.length)
    && (e.k === 'spend' || e.k === 'transfer' || (e.k === 'in' && e.sub === 'refund') || rcMoneyIn3(e)))
    .sort((x, y) => (x.date < y.date ? -1 : x.date > y.date ? 1 : 0));
}
/* [slice 6] money in typed on Receipts (a client payment, a gift): `in` with no `sub` */
function rcMoneyIn3(e) { return e.k === 'in' && !e.sub && !!e.src && e.src.type === 'typed';
}
function rcWhat3(e) {
  if (e.k === 'transfer') return `Moved to ${E3.nameOf(e.acct2)}`;
  if (rcMoneyIn3(e)) return 'Money in';
  if (e.k === 'in') return e.line ? `Refund, back to ${rcForName3(e)}` : 'Refund';
  return rcForName3(e);
}

/* ---- the engine's figures for a book, for the day ---- */
function rcFigs3(book) {
  try {
    const r = book === E3.book ? E3.view(E3.today()) : BurrowEngine.lookahead.lookahead(book, E3.today());
    return { free: r.period && r.period.free ? r.period.free.left : null, safe: r.safeToSpend.headline, period: r.period, capped: !!r.safeToSpend.cappedByFreeToSpend };
  } catch (e) { return null; }
}
/* [NS-FIX 4] a spend on a line that leaves the line over (the engine's `over` on the book the draft would make): the same
   words as Plan, "¥1,076 over Food. It comes out of what your bank can spare" (BM1); null otherwise */
/* [LISTFIX B6] a new spend on a card leaves the bank only when the card is paid, so safe to spend may not drop, or may
   even rise: the words say when, from the engine's statements on the book with the spend (the first unpaid one it is in:
   no close day, or closing on or after the spend's day; with the close day not sure, the next payment) */
function rcCardWords3(book, x) {
  if (RC3.edit || RC3.mode !== 'spend' || !x || !x.acct) return null;
  const a = ((E3.book && E3.book.accounts) || []).find(y => y.id === x.acct);
  if (!a || a.type !== 'card') return null;
  let r; try { r = BurrowEngine.lookahead.lookahead(book, E3.today()); } catch (e) { return null; }
  /* close day not sure: everything on it is paid on its next payment day (the engine's next, "all owed") */
  const k = r.cards[x.acct] || {};
  const st = k.next && k.next.statement === 'all owed' ? { payment: k.next.payment_date } : (k.statements || []).find(s => !s.paid && s.payment && (!s.closed || s.closed >= x.date));
  return st ? `It goes on ${E3.nameOf(x.acct)} and leaves your bank when the card is paid on ${day3(st.payment, E3.today().slice(0, 4))}` : null;
}
function rcOver3(f, x) {
  if (!f || !f.period || !x || !x.line || x.line === 'free' || RC3.mode !== 'spend') return null;
  const l = (f.period.lines || []).find(y => y.id === x.line && y.over > 0);
  return l ? overWords3(l.name, money3(l.over, E3.home())) : null;
}
function rcFigRow3(label, path, now, was, fig) {
  const cur = E3.home();
  const wasTxt = was != null && was !== now ? ` <span class="a3-was" data-fig="${fig}-was">was ${fig3(path, was, cur)}</span>` : '';
  return `<li><span>${esc3(label)}</span><span class="amt" data-fig="${fig}">${fig3(path, now, cur)}${wasTxt}</span></li>`;
}

/* ---- the panel ---- */
function renderRc3() {
  const host = $('#a3Rc');
  if (!host || host.hidden) return;
  if (!E3.book) { host.innerHTML = `<section class="a3-card"><h2>Receipts</h2><p class="a3-sub">Set up first, then log what you spend here</p></section>`; return; }
  const f = rcFigs3(E3.book);
  const was = RC3.last;
  const left = f ? `<ul class="a3-rows">${f.free != null ? rcFigRow3(label3('freeToSpendLeft'), 'period.free.left', f.free, was && was.free, 'rc-free') : ''}${rcFigRow3(label3('safeToSpend'), 'safeToSpend.headline', f.safe, was && was.safe, 'rc-safe')}</ul>` : '';
  /* the heading names no figure: each row carries its own label from names.js, the same name as on Home and Plan */
  host.innerHTML = `<section class="a3-card" data-card="rc-left"><h2>Where you stand</h2>${left}</section>
    <section class="a3-card" data-card="rc-form" id="rcForm">${rcFormHtml3()}</section>
    <section class="a3-card" data-card="rc-list" id="rcList"></section>`;
  rcWire3();
  rcList3();
}
function rcOptions3(list, sel) { return list.map(o => `<option value="${esc3(o.v)}"${o.v === sel ? ' selected' : ''}>${esc3(o.name)}</option>`).join(''); }
function rcFormHtml3() {
  const m = RC3.mode, e = RC3.edit, today = E3.today(), main = ((E3.book.home || {}).main || {}).v;
  const acctOpts = kinds => rcAccounts3(kinds).map(a => ({ v: a.id, name: a.name }));
  const pick = (cur, list, dflt) => (cur != null ? cur : list.some(o => o.v === dflt) ? dflt : list[0] && list[0].v);
  const fromList = acctOpts(m === 'moved' || m === 'in' ? RC_OWN3 : RC_SPEND_FROM3);
  const mainId = main && main.acct;
  /* [qc-numbers monthrule2 blocker 2] the From a person picked wins (also on a change), so To is every own account but that one */
  const held = RC3.from && fromList.some(o => o.v === RC3.from) ? RC3.from : null;
  const fromSel = pick(held || (e ? e.acct : null), fromList, mainId);
  let fields = '';
  /* [K18] money moves only between your own accounts: with one, there is nowhere to move it to, so the form says so
     instead of an empty To list and a Save that fails (a way to add an account goes here once the app has one) */
  const noTo = m === 'moved' && !e && fromList.length < 2;
  if (noTo) {
    fields = '';
  } else if (m === 'moved') {
    const toList = fromList.filter(o => o.v !== fromSel);
    fields = `<div class="a3-field"><label for="rcFrom">From</label><select class="a3-in a3-sel" id="rcFrom">${rcOptions3(fromList, fromSel)}</select></div>
      <div class="a3-field"><label for="rcTo">To</label><select class="a3-in a3-sel" id="rcTo">${rcOptions3(toList, pick(e ? e.acct2 : null, toList, null))}</select></div>`;
  } else if (m === 'in') {
    fields = `<div class="a3-field"><label for="rcAcct">Came into</label><select class="a3-in a3-sel" id="rcAcct">${rcOptions3(fromList, fromSel)}</select></div>`;
  } else {
    const fors = m === 'refund' ? [{ v: '', name: 'Nothing, it only comes back to the account' }].concat(rcFors3()) : rcFors3();
    const forSel = e ? (e.place ? 'place:' + e.place : e.line ? 'line:' + e.line : m === 'refund' ? '' : 'line:free') : m === 'refund' ? '' : 'line:free';
    fields = `<div class="a3-field"><label for="rcFor">${m === 'refund' ? 'Give it back to' : 'What it was for'}</label><select class="a3-in a3-sel" id="rcFor">${rcOptions3(fors, forSel)}</select></div>
      <div class="a3-field"><label for="rcAcct">${m === 'refund' ? 'Came back to' : 'Paid from'}</label><select class="a3-in a3-sel" id="rcAcct">${rcOptions3(fromList, fromSel)}</select></div>`;
  }
  const amt = e ? SM.toInput(e.a, E3.curOf(e.acct)) : '';
  const word = { spend: 'Log spend', refund: 'Log refund', moved: 'Log money moved', in: 'Log money in' }[m];
  /* M22: two main doors, Money went out and Money came in; Refund and Moved under them as smaller choices (same modes) */
  const seg = (k, n, main) => `<button type="button" class="a3-seg${main ? ' a3-door' : ' a3-seg-s'}" data-mode="${k}"${main ? ' data-door="main"' : ''} aria-pressed="${k === m}"${e ? ' disabled' : ''}>${n}</button>`;
  const modes = `<div class="a3-doors">${seg('spend', 'Money went out', true)}${seg('in', 'Money came in', true)}</div><div class="a3-segs">${seg('refund', 'Refund')}${seg('moved', 'Moved')}</div>`;
  if (noTo) return `<h2>Log money moved between your accounts</h2>
    <div role="group" aria-label="What happened">${modes}</div>
    <p class="a3-sub" id="rcNoTo">Moving money needs a second account of your own, like savings, cash or an e-wallet. You have one, so there is nowhere to move it to yet</p>`;
  return `<h2>${e ? 'Change this' : { spend: 'Log a spend', refund: 'Log a refund', moved: 'Log money moved between your accounts', in: 'Log money that came in, like a client payment or a gift' }[m]}</h2>
    <div role="group" aria-label="What happened">${modes}</div>
    <div class="a3-field"><label for="rcAmt">Amount</label><input class="a3-in" data-amount type="text" inputmode="decimal" autocomplete="off" id="rcAmt" value="${esc3(amt)}" placeholder="${esc3(SM.symbol(E3.home()).trim())}"></div>
    ${fields}
    <div class="a3-field"><label for="rcDate">Day</label><input class="a3-in a3-date" type="date" id="rcDate" value="${esc3(e ? e.date : today)}" max="${esc3(today)}"></div>
    <div class="a3-field"><label for="rcNote">Note</label><input class="a3-in a3-text" type="text" id="rcNote" autocomplete="off" value="${esc3(e && e.note ? e.note : '')}" placeholder="Optional"></div>
    <p class="a3-sub" id="rcAfter" aria-live="polite"></p>
    <p class="a3-err" id="rcErr" role="alert"></p><div id="rcSure"></div>
    <div class="a3-warn" id="rcAsk" role="alert" hidden><p id="rcAskText"></p><div class="a3-actions"><button type="button" class="a3-btn solid" id="rcAskYes">Save it anyway</button><button type="button" class="a3-btn" id="rcAskNo">Change the amount</button></div></div>
    <div class="a3-actions"><button type="button" class="a3-btn solid" id="rcSave">${e ? 'Save change' : word}</button>${e ? '<button type="button" class="a3-btn" id="rcRemove">Remove</button><button type="button" class="a3-btn" id="rcCancel">Cancel</button>' : ''}</div>`;
}
/* what the form holds, as the action's arguments, or { bad: words } */
function rcDraft3() {
  const m = RC3.mode, acct = m === 'moved' ? $('#rcFrom').value : $('#rcAcct').value;
  const a = typed3($('#rcAmt').value, E3.curOf(acct));
  if (a === null) return { bad: 'Type the amount, like 1200' };
  const x = { date: $('#rcDate').value, a, note: $('#rcNote').value };
  if (m === 'moved') return Object.assign(x, { from: acct, to: $('#rcTo').value });
  x.acct = acct;
  if (m === 'in') return x;
  const f = $('#rcFor').value;
  if (f.startsWith('place:')) x.place = f.slice(6); else if (f.startsWith('line:')) x.line = f.slice(5);
  return x;
}
/* the edit's fields from a draft: a moved record names its accounts acct and acct2 */
function rcFields3(x) {
  const f = { date: x.date, a: x.a, note: x.note };
  if (RC3.mode === 'moved') return Object.assign(f, { acct: x.from, acct2: x.to });
  f.acct = x.acct;
  if (RC3.mode === 'in') return f;
  if (x.place) f.place = x.place; else if (x.line) f.line = x.line; else { f.line = null; f.place = null; }
  return f;
}
function rcPreview3() {
  rcAskOff3();
  const out = $('#rcAfter'); if (!out) return;
  const x = rcDraft3();
  if (x.bad || !x.a) { out.textContent = ''; return; }
  let b;
  try { b = RC3.edit ? ACT3.dry('edit', RC3.edit.id, rcFields3(x)) : ACT3.dry(RC_KIND3[RC3.mode], x); } catch (e) { out.textContent = ''; return; }
  const f = rcFigs3(b), cur = E3.home();
  if (!f) { out.textContent = ''; return; }
  const ov = rcOver3(f, x);
  out.innerHTML = `After this: ${f.free != null ? `${esc3(label3('freeToSpendLeft'))} <b data-fig="rc-free-after">${fig3('period.free.left', f.free, cur)}</b>, ` : ''}${esc3(label3('safeToSpend').toLowerCase())} <b data-fig="rc-safe-after">${fig3('safeToSpend.headline', f.safe, cur)}</b>${ov ? `<br><span class="a3-late" data-fig="rc-over">${esc3(ov)}</span>` : ''}`;
}
function rcWire3() {
  /* a mode keeps what was typed, also across Moved with nowhere to move to (which has no boxes) */
  for (const b of document.querySelectorAll('[data-mode]')) b.addEventListener('click', () => { const keep = $('#rcAmt') ? rcKeep3() : (RC3.held || {}); RC3.held = keep; RC3.mode = b.dataset.mode; $('#rcForm').innerHTML = rcFormHtml3(); rcPut3(keep); rcWire3(); if ($('#rcAmt')) $('#rcAmt').focus(); });
  const amt = $('#rcAmt');
  if (!amt) return;
  BurrowScreens.inputs.bind(amt, { kind: 'amount', code: E3.home(), optional: true });
  for (const el of document.querySelectorAll('#rcForm input, #rcForm select')) { el.addEventListener('input', rcPreview3); el.addEventListener('change', rcPreview3); }
  const from = $('#rcFrom');
  if (from) from.addEventListener('change', () => { const keep = rcKeep3(); RC3.from = from.value; $('#rcForm').innerHTML = rcFormHtml3(); rcPut3(keep); rcWire3(); });
  $('#rcSave').addEventListener('click', () => rcSave3());
  $('#rcAskYes').addEventListener('click', () => rcSave3(true));
  $('#rcAskNo').addEventListener('click', () => { rcAskOff3(); $('#rcAmt').focus(); });
  amt.addEventListener('keydown', e => { if (e.key === 'Enter') rcSave3(); });
  amt.addEventListener('input', rcAskOff3);
  if ($('#rcRemove')) $('#rcRemove').addEventListener('click', rcRemove3);
  if ($('#rcCancel')) $('#rcCancel').addEventListener('click', () => { RC3.from = null; RC3.edit = null; RC3.mode = 'spend'; renderRc3(); });
  rcPreview3();
}
/* what was typed survives a change of mode or account */
function rcKeep3() { const v = id => ($(id) ? $(id).value : null); return { amt: v('#rcAmt'), date: v('#rcDate'), note: v('#rcNote'), from: v('#rcFrom') }; }
function rcPut3(k) { if (!$('#rcAmt')) return; if (k.amt != null) $('#rcAmt').value = k.amt; if (k.date) $('#rcDate').value = k.date; if (k.note != null) $('#rcNote').value = k.note; if (k.from && $('#rcFrom') && [...$('#rcFrom').options].some(o => o.value === k.from)) { $('#rcFrom').value = k.from; } }

function rcWords3(x, r) {
  const cur = E3.curOf(x.acct || x.from), amt = money3(x.a, cur);
  if (RC3.edit) return 'Changed';
  if (RC3.mode === 'moved') return `Moved ${amt} to ${E3.nameOf(x.to)}`;
  if (RC3.mode === 'refund') return `Refund of ${amt} logged`;
  if (RC3.mode === 'in') return `Money in of ${amt} logged`;
  return `Logged ${amt} on ${rcForName3(x)}`;
}
/* [north star F5] what a bank, cash or e-wallet account holds without this spend: the engine's figure for today, on the
   book without the record being changed (a new spend: the book as it is); null for a card or a loan */
function rcHolds3(x) {
  const a = ((E3.book && E3.book.accounts) || []).find(y => y.id === x.acct);
  if (!a || a.type === 'card' || a.type === 'loan') return null;
  try {
    const r = RC3.edit ? BurrowEngine.lookahead.lookahead(ACT3.dry('remove', RC3.edit.id), E3.today()) : E3.view(E3.today());
    return r.accounts[x.acct] ? r.accounts[x.acct].bank : null;
  } catch (e) { return null; }
}
function rcAskOff3() { const q = $('#rcAsk'); if (q) q.hidden = true; }
async function rcSave3(sure) {
  const err = $('#rcErr'), x = rcDraft3();
  if (x.bad) { err.textContent = x.bad; $('#rcAmt').focus(); return; }
  /* [north star F5] a spend larger than what its account holds asks first; nothing is saved until "Save it anyway" */
  if (RC3.mode === 'spend' && !sure) {
    const holds = rcHolds3(x);
    if (holds !== null && x.a > holds) {
      $('#rcAskText').textContent = `That is more than ${E3.nameOf(x.acct)} holds (${money3(holds, E3.curOf(x.acct))}). Save it anyway?`;
      $('#rcAsk').hidden = false; $('#rcAskYes').focus();
      return;
    }
  }
  rcAskOff3();
  const before = rcFigs3(E3.book);
  let ov = null, onCard = null, both = null;
  try {
    const dry = RC3.edit ? ACT3.dry('edit', RC3.edit.id, rcFields3(x)) : ACT3.dry(RC_KIND3[RC3.mode], x), df = rcFigs3(dry);
    ov = rcOver3(df, x); onCard = rcCardWords3(dry, x);
    /* [C2] a spend on Free to spend while Free to spend left caps safe to spend (the engine, on the book with the spend):
       the bar says it lowers both, and why */
    both = RC3.mode === 'spend' && x.line === 'free' && df && df.capped ? 'Safe to spend goes down with it, it\'s what\'s left of your Free to spend' : null;
  } catch (e) { ov = null; }
  const said = [rcWords3(x), onCard, ov, both].filter(Boolean).join('. ');
  const r = RC3.edit ? await ACT3.edit(RC3.edit.id, rcFields3(x), { undo: said, seen: rcSeen3() }) : await ACT3[RC_KIND3[RC3.mode]](x, { undo: said });
  if (!r.ok) { $('#rcErr').textContent = r.text; rcLook3(r); return; }   // the form may have been drawn again meanwhile (another tab)
  RC3.last = before;
  if (RC3.edit) { RC3.from = null; RC3.edit = null; RC3.mode = 'spend'; }
  renderRc3();
  const a = $('#rcAmt'); if (a) a.focus();
}
/* [STALE_SHEET_PLAN, M61] the receipt being changed, as it was when it was opened: the door refuses a save or a remove
   if it changed somewhere else since. Refused, the list is shown as it is now, what was typed stays in the boxes, and the
   receipt is looked at again, so a second Save is a choice made knowing it changed */
const rcSeen3 = () => ({ [RC3.edit.id]: (RC3.edit.at || '') + '|' + (RC3.edit.by || '') });
function rcLook3(r) {
  if (r.why !== 'other' || !RC3.edit) return;
  const now = ((E3.book && E3.book.events) || []).find(e => e.id === RC3.edit.id && !e.gone);
  if (!now) { const t = $('#rcErr').textContent; RC3.from = null; RC3.edit = null; RC3.mode = 'spend'; renderRc3(); $('#rcErr').textContent = t; return; }
  RC3.edit = JSON.parse(JSON.stringify(now));
  if (typeof rcList3 === 'function') rcList3();
}
function rcRemove3() {
  const e = RC3.edit; if (!e) return;
  sure3($('#rcSure'), `Remove ${money3(e.a, E3.curOf(e.acct))}, ${rcWhat3(e)}? Undo brings it back, after a reload too from Recent changes in Settings`, 'Yes, remove it', rcRemoveGo3);
}
async function rcRemoveGo3() {
  const e = RC3.edit; if (!e) return;
  const before = rcFigs3(E3.book);
  const r = await ACT3.remove(e.id, { undo: `Removed ${money3(e.a, E3.curOf(e.acct))}, ${rcWhat3(e)}`, seen: rcSeen3() });
  if (!r.ok) { $('#rcErr').textContent = r.text; rcLook3(r); return; }
  RC3.last = before; RC3.from = null; RC3.edit = null; RC3.mode = 'spend';
  renderRc3();
}
function rcOpen3(id) {
  const e = rcRows3().concat(rcAhead3()).find(x => x.id === id); if (!e) return;
  RC3.from = null; RC3.edit = JSON.parse(JSON.stringify(e)); RC3.mode = e.k === 'transfer' ? 'moved' : rcMoneyIn3(e) ? 'in' : e.k === 'in' ? 'refund' : 'spend';
  $('#rcForm').innerHTML = rcFormHtml3(); rcWire3();
  $('#rcForm').scrollIntoView({ block: 'start' }); $('#rcAmt').focus();
}

/* ---- the list: by period (the engine's), Earlier and Later, or a search across everything ---- */
/* the engine's periods (engine/periods.js): the one running now and the ones gone by, newest first; RC3.at is the
   start of the one shown (null: the one running now). Earlier and Later step to its neighbours in the engine's list. */
function rcPeriod3() {
  let r;
  try { r = BurrowEngine.periods.periods(E3.book, E3.today()); } catch (e) { return null; }
  if (!r || !r.current) return null;
  const all = [r.current].concat(r.past || []);
  let i = all.findIndex(x => x.start === RC3.at);
  if (i < 0) { i = 0; RC3.at = null; }
  const older = all.slice(i)[1], newer = all.slice(0, i).pop();
  return Object.assign({}, all[i], { older: older ? older.start : null, newer: newer ? (newer === r.current ? 'now' : newer.start) : null });
}
function rcSpent3(per) {
  const cur = E3.home(), rows = [];
  if (per.free) rows.push(['Free to spend', per.free]);
  for (const l of per.lines || []) rows.push([l.name, l]);
  if (!rows.length) return '';
  return `<ul class="a3-rows a3-spent" data-fig="rc-spent">${rows.map(([n, x]) => `<li><span>${esc3(n)}</span><span class="amt">spent ${fig3('periods.*.spent', x.spent, cur)} of ${fig3('periods.*.start', x.start, cur)}</span></li>`).join('')}</ul>`;
}
/* [S3, AN4, O1] records told after a bank figure but dated before it are inside that figure (the bank did not move,
   the figure's gap did): the engine names them (res.heldByCheck), and the row says so */
function rcHeld3() {
  const out = {};
  try { for (const h of E3.view(E3.today()).heldByCheck || []) out[h.id] = h.check; } catch (e) { /* no figures: nothing to say */ }
  return out;
}
/* [LISTFIX A1, T2, CHECKGAP] a gap found at Check your bank is spending: the engine's fillers (each account's and each
   card's), listed in the period its one part counts in (the check's own, whole), so the list and the spent figure
   agree; the row's dates are the days the gap covers. A gain
   held for its question counts nowhere and is left out. Not a button: a gap changes only at a check. */
function rcGaps3(per) {
  let r; try { r = E3.view(E3.today()); } catch (e) { return []; }
  const inPer = d => !per || !per.start || !per.end || (d >= per.start && d <= per.end), out = [];
  const onWhat = place => (!place || place === 'free' ? { line: 'free' } : ((E3.book.plan || {}).budgets || []).some(l => l.id === place) ? { line: place } : { place });
  for (const id of Object.keys(r.accounts || {})) for (const f of r.accounts[id].fillers || []) {
    if (f.held || f.apart) continue;   // [LISTFIX2] held for its question, or never spending (the engine's marks)
    for (const pt of f.parts || []) if (pt.amount && inPer(pt.from)) out.push({ acct: id, check: f.to, from: f.from, to: f.to, amount: pt.amount, on: onWhat(pt.place || f.place), fixOf: pt.fixOf || null, fixDay: pt.fixOf ? pt.from : null });
  }
  /* [CARDGAP] a card's gap by its parts too (the engine cuts it by days at each period start, as a bank's) */
  for (const id of Object.keys(r.cards || {})) for (const f of r.cards[id].fillers || []) {
    if (f.apart) continue;
    for (const pt of f.parts || []) if (pt.amount && inPer(pt.from)) out.push({ acct: id, check: f.day, from: f.from, to: f.to, amount: pt.amount, on: { line: 'free' } });
  }
  return out;
}
function rcGapLi3(g, yr) {
  /* [coordinator, slice 10] a bank figure changed later: the change is its own part, on the day it was changed (FB), and
     its row says so, never as a gap found over those days */
  if (g.fixOf) {
    const what = g.fixOf !== g.check ? `your bank check of ${day3(g.check, yr)} came after it, so its gap moves the other way and the two cancel`
      : g.amount > 0 ? 'it showed less than you first typed, so more went out' : 'it showed more than you first typed, so less went out';
    return `<li data-gap="${esc3(g.acct)}" data-check="${esc3(g.check)}" data-fix="${esc3(g.fixOf)}"><span>Your bank figure of ${esc3(day3(g.fixOf, yr))} changed on ${esc3(day3(g.fixDay, yr))}<br><span class="when">${esc3(E3.nameOf(g.acct))}, ${esc3(what)}, on ${esc3(rcForName3(g.on))}</span></span><span class="amt">${money3(g.amount, E3.curOf(g.acct))}</span></li>`;
  }
  const when = g.from === g.to ? day3(g.to, yr) : `${day3(g.from, yr)} to ${day3(g.to, yr)}`;
  const what = g.amount > 0 ? 'more went out than you logged' : 'less went out than you logged, so it comes off your spending';
  return `<li data-gap="${esc3(g.acct)}" data-check="${esc3(g.check)}"><span>Found at your bank check on ${esc3(day3(g.check, yr))}<br><span class="when">${esc3(when)}, ${esc3(E3.nameOf(g.acct))}, ${esc3(what)}, on ${esc3(rcForName3(g.on))}</span></span><span class="amt">${money3(g.amount, E3.curOf(g.acct))}</span></li>`;
}
/* [AMOUNT_HISTORY_PLAN 4] a spend or refund whose amount was changed (or that was removed) after the bank check that
   held it: the engine counts what it was at the check in its own period and the change in the check's period
   (res.splits), so the list shows the same: id -> the split */
function rcSplits3() {
  const out = {};
  try { for (const x of E3.view(E3.today()).splits || []) out[x.id] = x; } catch (e) { /* no figures: nothing to split */ }
  return out;
}
/* the change's own row, in the check's period: not a button (the record is changed in its own row) */
function rcSplitLi3(e, s, yr) {
  const back = e.k === 'in' ? s.more : s.less, amt = back ? 'back ' + money3(back, E3.curOf(e.acct)) : money3(e.k === 'in' ? s.less : s.more, E3.curOf(e.acct));
  const what = e.gone ? 'Removed' : 'Changed';
  return `<li data-split="${esc3(e.id)}" data-k="${esc3(e.k)}"><span>${what} on ${esc3(day3(s.told, yr))}, ${esc3(rcWhat3(e))}<br><span class="when">${esc3(day3(e.date, yr))}, ${esc3(E3.nameOf(e.acct))}${rcNote3(e) ? ', ' + esc3(rcNote3(e)) : ''}, it was ${esc3(money3(s.atCheck, E3.curOf(e.acct)))} at your bank check on ${esc3(day3(s.check, yr))}, so the change counts here</span></span><span class="amt${back ? ' a3-in-amt' : ''}">${amt}</span></li>`;
}
function rcList3() {
  const host = $('#rcList'); if (!host) return;
  const held = rcHeld3(), splits = rcSplits3();
  const q = RC3.search.trim().toLowerCase(), yr = E3.today().slice(0, 4);
  const per = q ? null : rcPeriod3();
  const text = e => [rcWhat3(e), E3.nameOf(e.acct), rcNote3(e), money3(e.a, E3.curOf(e.acct)), String(e.a), day3(e.date, 'any')].join(' ').toLowerCase();
  const rows = rcRows3().filter(e => (q ? text(e).includes(q) : !per || !per.start || !per.end || (e.date >= per.start && e.date <= per.end)))
    .sort((x, y) => (x.date !== y.date ? (x.date < y.date ? 1 : -1) : String(x.told) < String(y.told) ? 1 : -1));
  const head = q ? `<p class="a3-sub" data-fig="rc-period" data-search="1">Searching everything</p>`
    : per && per.start && per.end ? `<div class="a3-pernav"><button type="button" class="a3-btn" id="rcOlder"${per.older ? '' : ' disabled'}>Earlier</button><p class="a3-mid a3-per" data-fig="rc-period" data-start="${esc3(per.start)}" data-end="${esc3(per.end)}">${esc3(period3(per))}</p><button type="button" class="a3-btn" id="rcNewer"${per.newer ? '' : ' disabled'}>Later</button></div>${rcSpent3(per)}`
    : `<p class="a3-sub" data-fig="rc-period">Everything</p>`;
  const gaps = q ? [] : rcGaps3(per && per.start && per.end ? per : null);
  /* [AMOUNT_HISTORY_PLAN 4] with a period shown and the check in another period: the record here at what it was at the
     check, and the change listed in the check's period; searching, or both in one period, the record as it is now */
  const inPer = d => !!(per && per.start && per.end && d >= per.start && d <= per.end);
  const split = e => (!q && splits[e.id] && inPer(e.date) !== inPer(splits[e.id].check) ? splits[e.id] : null);
  const gone = ((E3.book && E3.book.events) || []).filter(e => e && e.gone && splits[e.id] && split(e));
  const changes = ((E3.book && E3.book.events) || []).filter(e => e && split(e) && inPer(splits[e.id].check));
  /* [qc-numbers confirm, CONFUSING] money in on no line, changed or removed after the check that held it, both in this
     period: its change counts on spending (beside the gap it opened), so it has its own row and the rows add to spent */
  const sameIn = q ? [] : ((E3.book && E3.book.events) || []).filter(e => e && e.k === 'in' && !e.line && splits[e.id] && inPer(e.date) && inPer(splits[e.id].check));
  /* [coordinator, slice 10] the payments ticked in this stretch (pay, bills, card payments: PLAN3W.ticksOf, the one source
     the Plan sheets list too), each with Remove this tick */
  const ticks = PLAN3W.ticksOf(E3.book).filter(e => rcKnown3(e) && (q ? [PLAN3W.tickName(E3.book, e), money3(e.a, E3.curOf(e.acct)), String(e.a), day3(e.date, 'any')].join(' ').toLowerCase().includes(q) : inPer(e.date) || !(per && per.start && per.end)));
  const items = rows.map(e => ({ date: e.date, e })).concat(gaps.map(g => ({ date: g.to, g }))).concat(ticks.map(e => ({ date: e.date, t: e })))
    .concat(gone.filter(e => inPer(e.date)).map(e => ({ date: e.date, e })))
    .concat(changes.concat(sameIn).map(e => ({ date: splits[e.id].check, c: e })))
    .sort((x, y) => (x.date !== y.date ? (x.date < y.date ? 1 : -1) : 0));
  const rcLi3 = e => {
    const s = split(e), shown = s ? s.atCheck : e.a, cur = E3.curOf(e.acct);
    const was = s ? `<br><span data-fig="rc-split">${e.gone ? `removed on ${esc3(day3(s.told, yr))}` : `now ${esc3(money3(e.a, cur))}`}, as it was at your bank check on ${esc3(day3(s.check, yr))}. The change counts in that check's pay period</span>` : '';
    const inner = `<span>${esc3(rcWhat3(e))}<br><span class="when">${esc3(day3(e.date, yr))}, ${esc3(E3.nameOf(e.acct))}${rcNote3(e) ? ', ' + esc3(rcNote3(e)) : ''}${held[e.id] ? `<br><span data-fig="rc-held">already in your bank figure of ${esc3(day3(held[e.id], yr))}</span>` : ''}${was}</span></span><span class="amt${e.k === 'in' ? ' a3-in-amt' : ''}">${e.k === 'in' ? (e.sub === 'refund' ? 'back ' : 'in ') : ''}${money3(shown, cur)}</span>`;
    return e.gone ? `<li data-split="${esc3(e.id)}" data-k="${esc3(e.k)}">${inner}</li>`
      : `<li data-rc="${esc3(e.id)}" data-k="${esc3(e.k)}"><button type="button" class="a3-rcrow" aria-label="Change ${esc3(rcWhat3(e))}, ${esc3(money3(e.a, cur))}">${inner}</button></li>`;
  };
  const li = items.map(x => (x.t ? tickLi3(x.t, yr) : x.g ? rcGapLi3(x.g, yr) : x.c ? rcSplitLi3(x.c, splits[x.c.id], yr) : rcLi3(x.e))).join('');
  const ahead = rcAhead3().filter(e => !q || text(e).includes(q));
  const toldDay = e => String(e.told || e.date).slice(0, 10);
  const aheadLi = e => `<li data-rcahead="${esc3(e.id)}" data-k="${esc3(e.k)}"><button type="button" class="a3-rcrow" aria-label="Open ${esc3(rcWhat3(e))}, ${esc3(money3(e.a, E3.curOf(e.acct)))}"><span>${esc3(rcWhat3(e))}<br><span class="when">${esc3(day3(e.date, 'any'))}, ${esc3(E3.nameOf(e.acct))}${e.date <= E3.today() ? ', logged when a device said it was ' + esc3(day3(toldDay(e), 'any')) : ''}</span></span><span class="amt">${money3(e.a, E3.curOf(e.acct))}</span></button></li>`;
  const aheadHtml = ahead.length ? `<div class="a3-ahead" data-fig="rc-ahead"><p class="a3-warn">${ahead.length === 1 ? '1 thing is' : ahead.length + ' things are'} dated after today. They do not count until their day. If a day is wrong, tap it, remove it and log it again</p><ul class="a3-rows a3-rclist">${ahead.map(aheadLi).join('')}</ul></div>` : '';
  host.innerHTML = `<h2>What you logged</h2>
    <div class="a3-field"><label for="rcSearch">Search</label><input class="a3-in a3-text" type="search" id="rcSearch" autocomplete="off" value="${esc3(RC3.search)}" placeholder="A note, a line, an amount"></div>
    ${aheadHtml}${head}${items.length ? `<ul class="a3-rows a3-rclist">${li}</ul>${rows.length ? '<p class="a3-sub" data-hint="rc-tap">Tap a spend to change it</p>' : ''}` : `<p class="a3-sub">${q ? (ahead.length ? '' : 'Nothing matches') : 'Nothing logged in this stretch'}</p>`}`;
  const s = $('#rcSearch');
  s.addEventListener('input', () => { RC3.search = s.value; rcList3(); const n = $('#rcSearch'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); });
  if ($('#rcOlder')) $('#rcOlder').addEventListener('click', () => { RC3.at = per.older; rcList3(); });
  if ($('#rcNewer')) $('#rcNewer').addEventListener('click', () => { RC3.at = per.newer === 'now' ? null : per.newer; rcList3(); });
  for (const r of host.querySelectorAll('[data-rc] button')) r.addEventListener('click', () => rcOpen3(r.parentNode.dataset.rc));
  for (const r of host.querySelectorAll('[data-rcahead] button')) r.addEventListener('click', () => rcOpen3(r.parentNode.dataset.rcahead));
  if (!$('#rcTickSure')) host.insertAdjacentHTML('afterbegin', '<div id="rcTickSure"></div>');
  tickWire3(host, $('#rcTickSure'), () => renderRc3());
}

/* [NS-FIX 3] Home's "Log a spend": Receipts' own log form, in spend mode, with the amount box ready (no second form) */
function rcLogFromHome3() {
  RC3.from = null; RC3.edit = null; RC3.mode = 'spend';
  showTab3('receipts'); renderRc3();
  const f = $('#rcForm'); if (f) f.scrollIntoView({ block: 'start' });
  const a = $('#rcAmt'); if (a) a.focus();
}
/* every saved write and Undo draws Home and Receipts again */
if (ACT3) ACT3.onChange((step, opts) => {
  if (opts && opts.isUndo) RC3.last = null;   // "was" figures belong to the step just taken back
  if (RC3.edit && !rcRows3().concat(rcAhead3()).some(e => e.id === RC3.edit.id)) { RC3.from = null; RC3.edit = null; RC3.mode = 'spend'; }
  try { renderHome3(); } catch (e) { /* Home draws itself next time */ }
  renderRc3();
});
