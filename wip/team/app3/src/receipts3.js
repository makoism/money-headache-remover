/* ---------- Receipts (the receipts lane; old app: ui4.js and the Log spend card, rebuilt on the new engine) ----------
   Log a spend fast (amount, what it was for, the account or card, the day (today unless changed), a note), a refund,
   or money moved between two of your own accounts. The list goes by period (the engine's res.period, named by its
   dates) with Earlier and Later, and a search across everything. A tap on a row opens it to change or remove; every
   write goes through ACT3 (src/act3.js), which gives the Undo bar. Free to spend left and safe to spend are the
   engine's, before and after: for a draft the engine is asked about the book the draft would make (ACT3.dry). This
   file chooses, writes and places; it never adds, takes away or rounds (tests: no_maths.js, e3_receipts.js). */
const RC3 = { mode: 'spend', edit: null, at: null, search: '', last: null };
const RC_KIND3 = { spend: 'logSpend', refund: 'refund', moved: 'moveMoney' };
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
    && (e.k === 'spend' || e.k === 'transfer' || (e.k === 'in' && e.sub === 'refund')));
}
function rcWhat3(e) {
  if (e.k === 'transfer') return `Moved to ${E3.nameOf(e.acct2)}`;
  if (e.k === 'in') return e.line ? `Refund, back to ${rcForName3(e)}` : 'Refund';
  return rcForName3(e);
}

/* ---- the engine's figures for a book, for the day ---- */
function rcFigs3(book) {
  try {
    const r = book === E3.book ? E3.view(E3.today()) : BurrowEngine.lookahead.lookahead(book, E3.today());
    return { free: r.period && r.period.free ? r.period.free.left : null, safe: r.safeToSpend.headline, period: r.period };
  } catch (e) { return null; }
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
  const fromList = acctOpts(m === 'moved' ? RC_OWN3 : RC_SPEND_FROM3);
  const mainId = main && main.acct;
  const fromSel = pick(e ? e.acct : null, fromList, mainId);
  let fields = '';
  if (m === 'moved') {
    const toList = fromList.filter(o => o.v !== fromSel);
    fields = `<div class="a3-field"><label for="rcFrom">From</label><select class="a3-in a3-sel" id="rcFrom">${rcOptions3(fromList, fromSel)}</select></div>
      <div class="a3-field"><label for="rcTo">To</label><select class="a3-in a3-sel" id="rcTo">${rcOptions3(toList, pick(e ? e.acct2 : null, toList, null))}</select></div>`;
  } else {
    const fors = m === 'refund' ? [{ v: '', name: 'Nothing, it only comes back to the account' }].concat(rcFors3()) : rcFors3();
    const forSel = e ? (e.place ? 'place:' + e.place : e.line ? 'line:' + e.line : m === 'refund' ? '' : 'line:free') : m === 'refund' ? '' : 'line:free';
    fields = `<div class="a3-field"><label for="rcFor">${m === 'refund' ? 'Give it back to' : 'What it was for'}</label><select class="a3-in a3-sel" id="rcFor">${rcOptions3(fors, forSel)}</select></div>
      <div class="a3-field"><label for="rcAcct">${m === 'refund' ? 'Came back to' : 'Paid from'}</label><select class="a3-in a3-sel" id="rcAcct">${rcOptions3(fromList, fromSel)}</select></div>`;
  }
  const amt = e ? SM.toInput(e.a, E3.curOf(e.acct)) : '';
  const word = { spend: 'Log spend', refund: 'Log refund', moved: 'Log money moved' }[m];
  const modes = [['spend', 'Spend'], ['refund', 'Refund'], ['moved', 'Moved']].map(([k, n]) => `<button type="button" class="a3-seg" data-mode="${k}" aria-pressed="${k === m}"${e ? ' disabled' : ''}>${n}</button>`).join('');
  return `<h2>${e ? 'Change this' : { spend: 'Log a spend', refund: 'Log a refund', moved: 'Log money moved between your accounts' }[m]}</h2>
    <div class="a3-segs" role="group" aria-label="What happened">${modes}</div>
    <div class="a3-field"><label for="rcAmt">Amount</label><input class="a3-in" type="text" inputmode="decimal" autocomplete="off" id="rcAmt" value="${esc3(amt)}" placeholder="${esc3(SM.symbol(E3.home()).trim())}"></div>
    ${fields}
    <div class="a3-field"><label for="rcDate">Day</label><input class="a3-in a3-date" type="date" id="rcDate" value="${esc3(e ? e.date : today)}" max="${esc3(today)}"></div>
    <div class="a3-field"><label for="rcNote">Note</label><input class="a3-in a3-text" type="text" id="rcNote" autocomplete="off" value="${esc3(e && e.note ? e.note : '')}" placeholder="Optional"></div>
    <p class="a3-sub" id="rcAfter" aria-live="polite"></p>
    <p class="a3-err" id="rcErr" role="alert"></p>
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
  const f = $('#rcFor').value;
  if (f.startsWith('place:')) x.place = f.slice(6); else if (f.startsWith('line:')) x.line = f.slice(5);
  return x;
}
/* the edit's fields from a draft: a moved record names its accounts acct and acct2 */
function rcFields3(x) {
  const f = { date: x.date, a: x.a, note: x.note };
  if (RC3.mode === 'moved') return Object.assign(f, { acct: x.from, acct2: x.to });
  f.acct = x.acct;
  if (x.place) f.place = x.place; else if (x.line) f.line = x.line; else { f.line = null; f.place = null; }
  return f;
}
function rcPreview3() {
  const out = $('#rcAfter'); if (!out) return;
  const x = rcDraft3();
  if (x.bad || !x.a) { out.textContent = ''; return; }
  let b;
  try { b = RC3.edit ? ACT3.dry('edit', RC3.edit.id, rcFields3(x)) : ACT3.dry(RC_KIND3[RC3.mode], x); } catch (e) { out.textContent = ''; return; }
  const f = rcFigs3(b), cur = E3.home();
  if (!f) { out.textContent = ''; return; }
  out.innerHTML = `After this: ${f.free != null ? `${esc3(label3('freeToSpendLeft'))} <b data-fig="rc-free-after">${fig3('period.free.left', f.free, cur)}</b>, ` : ''}${esc3(label3('safeToSpend').toLowerCase())} <b data-fig="rc-safe-after">${fig3('safeToSpend.headline', f.safe, cur)}</b>`;
}
function rcWire3() {
  const amt = $('#rcAmt');
  BurrowScreens.inputs.bind(amt, { kind: 'amount', code: E3.home(), optional: true });
  for (const el of document.querySelectorAll('#rcForm input, #rcForm select')) { el.addEventListener('input', rcPreview3); el.addEventListener('change', rcPreview3); }
  const from = $('#rcFrom');
  if (from) from.addEventListener('change', () => { const keep = rcKeep3(); $('#rcForm').innerHTML = rcFormHtml3(); rcPut3(keep); rcWire3(); });
  for (const b of document.querySelectorAll('[data-mode]')) b.addEventListener('click', () => { const keep = rcKeep3(); RC3.mode = b.dataset.mode; $('#rcForm').innerHTML = rcFormHtml3(); rcPut3(keep); rcWire3(); $('#rcAmt').focus(); });
  $('#rcSave').addEventListener('click', rcSave3);
  amt.addEventListener('keydown', e => { if (e.key === 'Enter') rcSave3(); });
  if ($('#rcRemove')) $('#rcRemove').addEventListener('click', rcRemove3);
  if ($('#rcCancel')) $('#rcCancel').addEventListener('click', () => { RC3.edit = null; RC3.mode = 'spend'; renderRc3(); });
  rcPreview3();
}
/* what was typed survives a change of mode or account */
function rcKeep3() { const v = id => ($(id) ? $(id).value : null); return { amt: v('#rcAmt'), date: v('#rcDate'), note: v('#rcNote'), from: v('#rcFrom') }; }
function rcPut3(k) { if (k.amt != null) $('#rcAmt').value = k.amt; if (k.date) $('#rcDate').value = k.date; if (k.note != null) $('#rcNote').value = k.note; if (k.from && $('#rcFrom') && [...$('#rcFrom').options].some(o => o.value === k.from)) { $('#rcFrom').value = k.from; } }

function rcWords3(x, r) {
  const cur = E3.curOf(x.acct || x.from), amt = money3(x.a, cur);
  if (RC3.edit) return 'Changed';
  if (RC3.mode === 'moved') return `Moved ${amt} to ${E3.nameOf(x.to)}`;
  if (RC3.mode === 'refund') return `Refund of ${amt} logged`;
  return `Logged ${amt} on ${rcForName3(x)}`;
}
async function rcSave3() {
  const err = $('#rcErr'), x = rcDraft3();
  if (x.bad) { err.textContent = x.bad; $('#rcAmt').focus(); return; }
  const before = rcFigs3(E3.book);
  const r = RC3.edit ? await ACT3.edit(RC3.edit.id, rcFields3(x), { undo: rcWords3(x) }) : await ACT3[RC_KIND3[RC3.mode]](x, { undo: rcWords3(x) });
  if (!r.ok) { $('#rcErr').textContent = r.text; return; }   // the form may have been drawn again meanwhile (another tab)
  RC3.last = before;
  if (RC3.edit) { RC3.edit = null; RC3.mode = 'spend'; }
  renderRc3();
  const a = $('#rcAmt'); if (a) a.focus();
}
async function rcRemove3() {
  const e = RC3.edit; if (!e) return;
  const before = rcFigs3(E3.book);
  const r = await ACT3.remove(e.id, { undo: `Removed ${money3(e.a, E3.curOf(e.acct))}, ${rcWhat3(e)}` });
  if (!r.ok) { $('#rcErr').textContent = r.text; return; }
  RC3.last = before; RC3.edit = null; RC3.mode = 'spend';
  renderRc3();
}
function rcOpen3(id) {
  const e = rcRows3().find(x => x.id === id); if (!e) return;
  RC3.edit = JSON.parse(JSON.stringify(e)); RC3.mode = e.k === 'transfer' ? 'moved' : e.k === 'in' ? 'refund' : 'spend';
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
function rcList3() {
  const host = $('#rcList'); if (!host) return;
  const held = rcHeld3();
  const q = RC3.search.trim().toLowerCase(), yr = E3.today().slice(0, 4);
  const per = q ? null : rcPeriod3();
  const text = e => [rcWhat3(e), E3.nameOf(e.acct), rcNote3(e), money3(e.a, E3.curOf(e.acct)), String(e.a), day3(e.date, 'any')].join(' ').toLowerCase();
  const rows = rcRows3().filter(e => (q ? text(e).includes(q) : !per || (e.date >= per.start && e.date <= per.end)))
    .sort((x, y) => (x.date !== y.date ? (x.date < y.date ? 1 : -1) : String(x.told) < String(y.told) ? 1 : -1));
  const head = q ? `<p class="a3-sub" data-fig="rc-period" data-search="1">Searching everything</p>`
    : per ? `<div class="a3-pernav"><button type="button" class="a3-btn" id="rcOlder"${per.older ? '' : ' disabled'}>Earlier</button><p class="a3-mid a3-per" data-fig="rc-period" data-start="${esc3(per.start)}" data-end="${esc3(per.end)}">${esc3(period3(per))}</p><button type="button" class="a3-btn" id="rcNewer"${per.newer ? '' : ' disabled'}>Later</button></div>${rcSpent3(per)}`
    : `<p class="a3-sub" data-fig="rc-period">Everything</p>`;
  const li = rows.map(e => `<li data-rc="${esc3(e.id)}" data-k="${esc3(e.k)}"><button type="button" class="a3-rcrow" aria-label="Change ${esc3(rcWhat3(e))}, ${esc3(money3(e.a, E3.curOf(e.acct)))}"><span>${esc3(rcWhat3(e))}<br><span class="when">${esc3(day3(e.date, yr))}, ${esc3(E3.nameOf(e.acct))}${rcNote3(e) ? ', ' + esc3(rcNote3(e)) : ''}${held[e.id] ? `<br><span data-fig="rc-held">already in your bank figure of ${esc3(day3(held[e.id], yr))}</span>` : ''}</span></span><span class="amt${e.k === 'in' ? ' a3-in-amt' : ''}">${e.k === 'in' ? 'back ' : ''}${money3(e.a, E3.curOf(e.acct))}</span></button></li>`).join('');
  host.innerHTML = `<h2>What you logged</h2>
    <div class="a3-field"><label for="rcSearch">Search</label><input class="a3-in a3-text" type="search" id="rcSearch" autocomplete="off" value="${esc3(RC3.search)}" placeholder="A note, a line, an amount"></div>
    ${head}${rows.length ? `<ul class="a3-rows a3-rclist">${li}</ul><p class="a3-sub" data-hint="rc-tap">Tap a spend to change it</p>` : `<p class="a3-sub">${q ? 'Nothing matches' : 'Nothing logged in this stretch'}</p>`}`;
  const s = $('#rcSearch');
  s.addEventListener('input', () => { RC3.search = s.value; rcList3(); const n = $('#rcSearch'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); });
  if ($('#rcOlder')) $('#rcOlder').addEventListener('click', () => { RC3.at = per.older; rcList3(); });
  if ($('#rcNewer')) $('#rcNewer').addEventListener('click', () => { RC3.at = per.newer === 'now' ? null : per.newer; rcList3(); });
  for (const r of host.querySelectorAll('[data-rc] button')) r.addEventListener('click', () => rcOpen3(r.parentNode.dataset.rc));
}

/* every saved write and Undo draws Home and Receipts again */
if (ACT3) ACT3.onChange((step, opts) => {
  if (opts && opts.isUndo) RC3.last = null;   // "was" figures belong to the step just taken back
  if (RC3.edit && !rcRows3().some(e => e.id === RC3.edit.id)) { RC3.edit = null; RC3.mode = 'spend'; }
  try { renderHome3(); } catch (e) { /* Home draws itself next time */ }
  renderRc3();
});
