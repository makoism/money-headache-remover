/* ---------- Checks: change or remove a bank check later (CHECKFIX_PLAN slice 10; M13, M14, M6, M36, M37, M47, M61) ----------
   Home, tap an account's figure (or its Checks link): the checks of that account, newest first, each with its day, its
   figure and where it came from. One opens on its own: the figure box (a minus is fine for a bank, M47; an empty box
   says what to type and Back loses nothing), Save, where its gap went with Change, and on the newest only "Remove this
   check" (asked first, M6). Every write is one act3 step through PLAN3W.changeCheck or removeCheck, with its Undo bar and
   its row in Recent changes after a reload (M14). A check another device brought back (the engine's revive) is listed as
   the engine reads the book. No money is worked out here: every figure is the engine's or the record's own. */
let checks3 = null;
const CHECKS3_NONE = 'Type the figure your bank showed';
function checks3Book() { return BurrowEngine.ledger.revive(E3.book).book; }
function checks3List(acct) {
  const b = checks3Book(), opens = new Set((b.events || []).filter(e => e && !e.gone && e.k === 'open' && e.acct === acct).map(e => `${e.date}|${e.grp}`));
  const told = e => (opens.has(`${e.date}|${e.grp}`) ? '' : String(e.told || e.date));   // an opening comes first on its day
  return (b.events || []).filter(e => e && !e.gone && e.k === 'check' && e.acct === acct)
    .sort((x, y) => (x.date !== y.date ? (x.date < y.date ? 1 : -1) : told(x) !== told(y) ? (told(x) < told(y) ? 1 : -1) : (x.id < y.id ? 1 : -1)));
}
const checks3Stmt = c => !!c.stmt || /^(stmt|imp):/.test(String(c.grp || '')) || /^imp:/.test(String(c.id || ''));
function checks3From(c) {
  if (checks3Stmt(c)) return 'from a statement';
  const b = checks3Book();
  if ((b.checkins || []).some(k => k && k.id === c.grp)) return 'typed at Check your bank';
  return (b.events || []).some(e => e && !e.gone && e.k === 'open' && e.acct === c.acct && e.grp === c.grp) ? 'where it started in the app' : 'typed';
}
function openChecks3(acct, checkId) {
  checks3 = { acct, open: checkId || null, ver: ACT3.ver() };
  $('#a3Home').hidden = true;
  /* one sheet box for the whole visit (its own Undo bars show on it, back3.js K37); each view is drawn inside it */
  $('#a3Checks').innerHTML = '<div class="a3-sheet-in" id="a3ChecksIn"></div>';
  drawChecks3();
}
function closeChecks3() {
  const host = $('#a3Checks'); host.hidden = true; host.innerHTML = '';
  const acct = checks3 && checks3.acct; checks3 = null;
  $('#a3Home').hidden = false; renderHome3();
  const b = acct && document.querySelector(`[data-checks="${CSS.escape(acct)}"]`); if (b) b.focus();
}
function drawChecks3() {
  const host = $('#a3ChecksIn'), acct = checks3.acct, name = E3.nameOf(acct), cur = E3.curOf(acct), yr = E3.today().slice(0, 4);
  const list = checks3List(acct), latest = list[0];
  $('#a3Checks').hidden = false; scrollTo(0, 0);
  checks3.ver = ACT3.ver();   // [STALE_SHEET_PLAN] the book as this view shows it
  if (!checks3.open) {
    const rows = list.map(c => `<li><button type="button" class="a3-rcrow" data-checkopen="${esc3(c.id)}"><span>${esc3(day3(c.date, yr))}<br><span class="when">${esc3(checks3From(c))}</span></span><span class="amt">${money3(c.a, cur)}</span></button></li>`).join('');
    host.innerHTML = `<h1 id="a3ChecksT">Checks of ${esc3(name)}</h1>
      <section class="a3-card"><p class="a3-sub">Each figure you typed for ${esc3(name)}, newest first. Tap one to change it</p><ul class="a3-rows" data-checklist>${rows || '<li>No checks yet</li>'}</ul></section>
      <div class="a3-actions"><button type="button" class="a3-btn" id="a3ChecksX">Back</button></div>`;
    host.querySelectorAll('[data-checkopen]').forEach(el => el.addEventListener('click', () => { checks3.open = el.dataset.checkopen; drawChecks3(); }));
    $('#a3ChecksX').addEventListener('click', closeChecks3);
    const f = host.querySelector('[data-checkopen]') || $('#a3ChecksX'); f.focus();
    return;
  }
  const c = list.find(x => x.id === checks3.open);
  if (!c) { checks3.open = null; drawChecks3(); return; }
  const own = !!{ bank: 1, cash: 1, ewallet: 1, wallet: 1 }[((E3.book.accounts || []).find(a => a.id === acct) || {}).type];
  const stmt = checks3Stmt(c), b = checks3Book(), ci = (b.checkins || []).find(k => k && k.id === c.grp);
  /* where its gap went: the check-in's own place, or an older check-in's gap spend's line */
  const gap = ci && (b.events || []).find(e => e && !e.gone && e.k === 'spend' && e.grp === ci.id && e.acct === acct && e.dayInside);
  const placeNow = gap ? (gap.place ? 'place:' + gap.place : 'line:' + (gap.line || 'free')) : ci && ci.fillerPlace && ci.fillerPlace[acct] ? `${(E3.book.places || []).some(g => g.id === ci.fillerPlace[acct]) ? 'place' : 'line'}:${ci.fillerPlace[acct]}` : 'line:free';
  const placeName = rcForName3(placeNow.startsWith('place:') ? { place: placeNow.slice(6) } : { line: placeNow.slice(5) });
  const opts = rcFors3().map(o => (o.v === 'line:free' ? Object.assign({}, o, { name: 'Nothing, back to Free to spend' }) : o));
  const gapHtml = ci && own && !stmt ? `<div class="a3-field" data-gapwent><p class="a3-sub">The gap went to: <b data-gapname>${esc3(placeName)}</b> <button type="button" class="a3-link" id="a3GapChange">Change</button></p>
      <div data-gappick hidden><label for="a3GapSel">Where the gap at this check goes</label><select class="a3-in a3-sel" id="a3GapSel">${rcOptions3(opts, placeNow)}</select>
      <div class="a3-actions"><button type="button" class="a3-btn" id="a3GapSave">Save where it goes</button></div></div></div>` : '';
  /* a large gain held at this check: Yes keeps the figure, No opens the box (Was that figure right?) */
  const r = E3.view(E3.today()), held = (r.warnings || []).some(w => w.code === 'gain_to_ask' && w.account === acct && w.day === c.date) && c.id === latest.id;
  const gainHtml = held ? `<div class="a3-field" data-gainask><p class="a3-warn">Was that figure right?</p><div class="a3-actions"><button type="button" class="a3-btn" id="a3GainYes">Yes</button><button type="button" class="a3-btn" id="a3GainNo">No, fix it</button></div></div>` : '';
  const removable = c.id === latest.id && !stmt && !!ci;
  const box = stmt ? `<p class="a3-sub" data-stmtnote>This figure came from your statement of ${esc3(day3(c.stmtDate || c.date, yr))}. Change it there</p>`
    : `<div class="a3-field"><label for="a3CheckFig">What did ${esc3(name)} show${c.date === E3.today() ? ' today' : ' on ' + esc3(day3(c.date, yr))}?</label>
      <input class="a3-in" data-amount type="text" inputmode="decimal" autocomplete="off" id="a3CheckFig" value="${SM.toInput(c.a, cur)}"></div>`;
  host.innerHTML = `<h1 id="a3ChecksT">${esc3(name)}, ${esc3(day3(c.date, yr))}</h1>
    <section class="a3-card"><p class="a3-sub">${esc3(checks3From(c))}</p>${box}${gainHtml}${gapHtml}<p class="a3-err" id="a3ChecksErr"></p><div id="a3ChecksSure"></div></section>
    <div class="a3-actions">${stmt ? '' : '<button type="button" class="a3-btn solid" id="a3ChecksSave">Save</button>'}<button type="button" class="a3-btn" id="a3ChecksBack">Back</button></div>
    ${removable ? '<div class="a3-actions"><button type="button" class="a3-btn" id="a3ChecksRemove">Remove this check</button></div>' : ''}`;
  const fig = $('#a3CheckFig');
  if (fig) { BurrowScreens.inputs.bind(fig, { kind: 'amount', code: cur, optional: true, allowMinus: own }); fig.focus(); }
  $('#a3ChecksBack').addEventListener('click', () => { checks3.open = null; drawChecks3(); });
  if ($('#a3ChecksSave')) $('#a3ChecksSave').addEventListener('click', () => saveCheckFig3(c, own));
  if ($('#a3ChecksRemove')) $('#a3ChecksRemove').addEventListener('click', () => {
    let words; try { words = PLAN3W.removeCheckWords({ book: E3.book, today: E3.today() }, acct); } catch (e) { $('#a3ChecksErr').textContent = e.message; return; }
    sure3($('#a3ChecksSure'), words, 'Yes, remove it', async () => {
      const r1 = await ACT3.run('Remove a bank check', w => PLAN3W.removeCheck(w, acct), { undo: `Check of ${name} removed`, ver: checks3.ver });
      checks3Done3(r1);
    });
  });
  if ($('#a3GapChange')) $('#a3GapChange').addEventListener('click', () => { host.querySelector('[data-gappick]').hidden = false; $('#a3GapSel').focus(); });
  if ($('#a3GapSave')) $('#a3GapSave').addEventListener('click', async () => {
    const v = $('#a3GapSel').value, place = v === 'line:free' ? null : v.replace(/^(line|place):/, '');
    const r1 = await ACT3.run('Where a gap went', w => PLAN3W.changeCheck(w, c.id, { place }), { undo: `The gap of ${day3(c.date, yr)} now goes to ${rcForName3(v.startsWith('place:') ? { place } : { line: place || 'free' })}`, ver: checks3.ver });
    checks3Done3(r1, c.id);
  });
  if ($('#a3GainYes')) $('#a3GainYes').addEventListener('click', async () => {
    const r1 = await ACT3.run('That figure was right', w => PLAN3W.changeCheck(w, c.id, { right: true }), { undo: `${name}'s figure of ${day3(c.date, yr)} kept as right`, ver: checks3.ver });
    checks3Done3(r1, c.id);
  });
  if ($('#a3GainNo')) $('#a3GainNo').addEventListener('click', () => { const f = $('#a3CheckFig'); f.focus(); f.select(); $('#a3ChecksErr').textContent = 'Type the figure it really showed, then Save'; });
}
/* after a step: back to the list (the Undo bar names it), or, refused because the book changed elsewhere, drawn again */
function checks3Done3(r1, keepOpen) {
  if (!r1.ok) {
    if (r1.why === 'other') { checks3.ver = ACT3.ver(); drawChecks3(); }
    $('#a3ChecksErr').textContent = r1.text; return;
  }
  checks3.farOk = null; checks3.ver = ACT3.ver(); checks3.open = keepOpen && checks3List(checks3.acct).some(x => x.id === keepOpen) ? keepOpen : null;
  drawChecks3();
}
async function saveCheckFig3(c, own) {
  const el = $('#a3CheckFig'), err = $('#a3ChecksErr'), cur = E3.curOf(c.acct), yr = E3.today().slice(0, 4);
  if (!el.value.trim()) { err.textContent = CHECKS3_NONE; el.focus(); return; }   // an empty box never traps: Back is right there
  const v = own ? typedBank3(el.value, cur) : typed3(el.value, cur);
  if (v === null) { err.textContent = own ? CHECKS3_NONE : 'Type what was on it, zero or more'; el.focus(); return; }
  const fn = w => PLAN3W.changeCheck(w, c.id, { amount: v });
  /* [coordinator, slice 10] far from what the app expected at that check (engine/checkin.js farFigure): asked once */
  const CKE = BurrowEngine.checkin, exp = CKE.expectedAt(E3.view(c.date), c.acct, c.date, c.a), far = !own || exp == null ? null : CKE.farFigure(exp, v, CKE.usualPay(E3.book, c.date));
  if (far && checks3.farOk !== v) {
    const host = $('#a3ChecksSure');
    host.innerHTML = `<div class="a3-sure" data-far><p class="a3-warn">${esc3(BurrowScreens.status.farText(far, v, x => money3(x, cur)))}</p><div class="a3-actions"><button type="button" class="a3-btn solid" data-faryes>Yes</button><button type="button" class="a3-btn" data-farfix>Fix it</button></div></div>`;
    host.querySelector('[data-faryes]').addEventListener('click', () => { host.innerHTML = ''; checks3.farOk = v; saveCheckFig3(c, own); });
    host.querySelector('[data-farfix]').addEventListener('click', () => { host.innerHTML = ''; el.focus(); });
    host.querySelector('[data-farfix]').focus();
    return;
  }
  /* [M6] a change that takes more off safe to spend than it holds asks first (the engine's figures before and after) */
  if (!checks3.sure) {
    let b1 = null; try { b1 = ACT3.dryRun('Change a bank check', fn); } catch (e) { err.textContent = e.message; return; }
    const r0 = E3.view(E3.today()), r1 = BurrowEngine.lookahead.lookahead(b1, E3.today()), s0 = r0.safeToSpend.headline, s1 = r1.safeToSpend.headline;
    if (s0 > 0 && (s1 === 0 || (r1.safeToSpend.short && !r0.safeToSpend.short))) {
      sure3($('#a3ChecksSure'), `This takes ${label3('safeToSpend').toLowerCase()} from ${money3(s0, E3.home())} to ${money3(s1, E3.home())}${r1.safeToSpend.short ? `, short by ${money3(r1.safeToSpend.short.amount, E3.home())}` : ''}. Save it anyway?`, 'Yes, save it', () => { checks3.sure = true; saveCheckFig3(c, own); });
      return;
    }
  }
  checks3.sure = false;
  const r1 = await ACT3.run('Change a bank check', fn, { undo: `${E3.nameOf(c.acct)}, ${day3(c.date, yr)}: ${money3(c.a, cur)} to ${money3(v, cur)}`, ver: checks3.ver });
  checks3Done3(r1);
}
/* an Undo from the bar, or a change from elsewhere, while the sheet is open: drawn again from the book as it is now */
if (typeof ACT3 === 'object' && ACT3) ACT3.onChange(() => { if (checks3 && !$('#a3Checks').hidden) drawChecks3(); });
