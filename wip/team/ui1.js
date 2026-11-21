
/* ---------- what is on the page ---------- */
const IN_ROWS = [
  { id: 'a', name: 'Salary', key: 'a', note: 'Your monthly take-home pay after tax, and if you get paid twice a month add both' },
  { id: 'b', name: 'Second pay', key: 'b', note: 'Only if you have one, like a partner’s share or a second job that pays every month' },
  { id: 'side', name: 'Side pay', key: 'side', note: 'Only if you have it. This is freelance, gig or cash work that changes month to month, so put in the lowest month you expect and the plan still works in a slow one' },
];
const JARCLS = { nec: 'g-nec', lts: 'g-lts', play: 'g-play', edu: 'g-edu', ffa: 'g-ffa', give: 'g-give' };
const JARVAR = { nec: 'var(--c1)', lts: 'var(--cl)', play: 'var(--cp)', edu: 'var(--c2)', ffa: 'var(--c3)', give: 'var(--cg)' };
const JARNAME = {}; JARS.forEach(j => { JARNAME[j.id] = j.name; });
const JARROWS = [
  { id: 'nec', jar: 'nec', name: 'Monthly bills', cap: 'Rent, food, utilities and every other monthly bill' },
  { id: 'items', jar: 'nec', name: 'One-time costs', kind: 'items' },
  { id: 'debts', jar: 'nec', name: 'Cards and loans', kind: 'debts', cap: 'The minimum payments plus anything extra you pay' },
  { id: 'lts', jar: 'lts', name: 'Goal burrows', kind: 'goals', cap: 'Burrows with a goal, like a trip, something big to buy or your Emergency fund' },
  { id: 'play', jar: 'play', name: 'Free to spend', cap: 'Eating out, hobbies and fun stuff: groceries go under Bills and basics' },
  { id: 'edu', jar: 'edu', name: 'Education', cap: 'Courses, books and anything else you learn from' },
  { id: 'ffa', jar: 'ffa', name: 'Investing', cap: 'Money you put away and don\'t spend, like an index fund or a retirement plan' },
  { id: 'give', jar: 'give', name: 'Giving', cap: 'Gifts and donations' },
];
const LINE_SL = { nec: null, play: { frac: 0.2 }, edu: { frac: 0.2 }, ffa: { frac: 0.25 }, give: { frac: 0.15 } };

/* every editable number, in one list. Rebuilt whenever lines or goals change. */
function computeFields() {
  FIELDS = [];
  IN_ROWS.forEach(r => FIELDS.push({ fid: r.id, row: r.id, key: r.key, label: r.name, note: r.note, kind: 'in' }));
  JARROWS.forEach(r => {
    if (r.kind === 'items') return;
    if (r.kind === 'debts') { debtsOf(S).forEach(d => FIELDS.push({ fid: 'd-' + d.id, row: r.id, key: 'debt:' + d.id, label: 'Extra on ' + d.name, did: d.id, kind: 'debt', color: JARVAR.nec })); return; }
    if (r.kind === 'goals') S.plan.goals.forEach(g => FIELDS.push({ fid: 'g-' + g.id, row: r.id, key: 'goal:' + g.id, label: g.name, gid: g.id, kind: 'goal', sl: { frac: 0.1 }, color: 'var(--c' + g.slot + ')', dotc: 'var(--c' + g.slot + ')' }));
    else {
      const ls = S.plan.lines.filter(l => l.jar === r.jar);
      ls.forEach((l, i) => FIELDS.push({ fid: 'l-' + l.id, row: r.id, key: l.key, label: l.name, lid: l.id, kind: 'line', note: l.note, ends: l.ends, sl: l.key === 'card' ? { frac: 0.3 } : (r.jar === 'play' && i === 0 ? { frac: 0.2, mark: 'ceiling' } : LINE_SL[r.jar]), color: JARVAR[r.jar] }));
    }
  });
}

const monthOptions = selected => '<option value="">No end</option>' + MONTHS.map(m => `<option value="${m}"${m === selected ? ' selected' : ''}>${monthLabel(m)}</option>`).join('');

function fieldHTML(f, multi, editing) {
  const l = f.kind === 'line' ? lineById(S, f.lid) : null, dot = f.dotc ? `<i class="dot" style="--c:${f.dotc}"></i>` : '';
  const head = editing && l
    ? `<input class="txt nm-in" type="text" value="${esc(l.name)}" maxlength="60" data-lname="${esc(l.id)}" aria-label="Name of this line">`
    : `<label for="i-${f.fid}">${multi ? dot + esc(f.label) : 'This month'}</label>`;
  const edit = editing && l ? `<div class="ed-edit"><label class="mini"><span>Last payment</span><select data-lends="${esc(l.id)}">${monthOptions(l.ends)}</select></label>
    ${l.ends && emergencyGoal(S) ? `<label class="check"><input type="checkbox" data-lredir="${esc(l.id)}"${l.redirect ? ' checked' : ''}><span>Then move its money to the emergency fund</span></label>` : ''}
    <button type="button" class="btn small warnbtn" data-ldel="${esc(l.id)}" data-armkey="ldel-${esc(l.id)}">Remove</button></div>` : '';
  return `<div class="ed" id="e-${f.fid}"><div class="ed-top">${head}
    <div class="inp sm"><span class="yen cs"></span><input id="i-${f.fid}" data-k="${esc(f.key)}" type="number" inputmode="decimal" min="0" step="any" aria-label="${esc(f.label)}, this month"></div></div>
    ${f.sl ? `<div class="rng" style="--c:${f.color}"><input type="range" id="r-${f.fid}" data-k="${esc(f.key)}" min="0" max="100" step="1" aria-label="${esc(f.label)} slider">${f.sl.mark ? `<span class="mark" id="m-${f.fid}" title="Your Free to spend cap"></span>` : ''}</div>` : ''}
    <p class="nt" id="n-${f.fid}"></p>
    <p class="keep" id="k-${f.fid}" hidden><span id="kt-${f.fid}"></span><button type="button" class="link" data-keep="${esc(f.key)}">Keep for later months</button><button type="button" class="link" data-undo="${esc(f.key)}">Undo</button></p>${edit}</div>`;
}
function rowHTML(r, inRow) {
  const fs = FIELDS.filter(f => f.row === r.id), editing = editRow === r.id;
  let body;
  if (r.kind === 'items') body = `<p class="cap" id="itemsSub"></p><div class="items" id="items"></div>
    <form class="addrow" id="addItem" autocomplete="off"><input class="txt" id="addLabel" type="text" placeholder="What is it for?" aria-label="One-time cost name" maxlength="60">
    <div class="inp sm"><span class="yen cs"></span><input id="addAmt" type="number" inputmode="decimal" min="0" step="any" placeholder="0" aria-label="One-time cost amount"></div>
    <button class="btn small solid" type="submit">Add cost</button></form>`;
  else {
    const multi = r.kind === 'goals' || r.kind === 'debts' || fs.length !== 1;
    body = (inRow ? '' : `<p class="cap jcap" id="jcap-${r.id}"></p>`) + fs.map(f => fieldHTML(f, multi, editing)).join('');
    if (!inRow && !fs.length) body += '<p class="cap">No lines.</p>';
    if (r.kind === 'goals') body += '<p class="cap"><button type="button" class="link" data-tab-go="goals">Edit burrows</button></p>';
    else if (r.kind === 'debts') body += '<p class="cap"><button type="button" class="link" data-tab-go="goals">Edit cards and loans</button></p>';
    else if (!inRow) body += editing
      ? `<form class="addrow" data-addline="${r.jar}" autocomplete="off"><input class="txt" type="text" placeholder="New line, like Pet food" maxlength="60" aria-label="Name of the new line">
        <div class="inp sm"><span class="yen cs"></span><input type="number" inputmode="decimal" min="0" step="any" placeholder="Monthly amount" aria-label="Monthly amount of the new line"></div>
        <button class="btn small solid" type="submit">Add line</button></form>
        <div class="row-btns"><button type="button" class="btn small" data-edit="${r.id}">Done</button></div>`
      : `<p class="cap"><button type="button" class="link" data-edit="${r.id}">Rename, remove or add lines</button></p>`;
  }
  const pills = `<span class="pill chg" id="rc-${r.id}" hidden>edited</span>`;
  const single = (inRow || (r.kind !== 'goals' && r.kind !== 'items' && r.kind !== 'debts' && fs.length === 1)) ? fs[0] : null;
  const amt = single ? `<input class="amt-in" id="h-${r.id}" data-k="${esc(single.key)}" type="text" inputmode="decimal" autocomplete="off" aria-label="${esc(r.name)}, this month">` : `<span class="amt" id="ra-${r.id}"></span>`;
  return `<div class="row" data-id="${r.id}"><div class="row-h" id="rh-${r.id}"><button type="button" class="row-t" id="rt-${r.id}" aria-expanded="false" aria-controls="rb-${r.id}">${inRow ? '' : `<i class="dot g-${r.jar}"></i>`}<span class="nm">${esc(r.name)}${pills}</span></button>${amt}${IC.chev}</div>
    <div class="row-b${fs.length > 1 || r.kind === 'goals' ? ' sub' : ''}" id="rb-${r.id}" role="region" aria-labelledby="rt-${r.id}" hidden>${body}</div></div>`;
}

/* ---------- goal cards ---------- */
function goalFormHTML(g) {
  const dbt = typeof kindOfGoal === 'function' && kindOfGoal(S, g) === 'debt';
  const own = hasOwnMonthly(S, g.id), id = esc(g.id), lo = START + '-01', hi = END + '-28';
  return `<div class="gform" data-gid="${id}">
    <div class="field"><label for="ge-${id}-name">Name</label><input class="txt" id="ge-${id}-name" data-g="name" type="text" value="${esc(g.name)}" maxlength="60"></div>
    <div class="field wide"><label for="ge-${id}-why">Why (optional)</label><input class="txt" id="ge-${id}-why" data-g="why" type="text" value="${esc(g.why || '')}" maxlength="80" placeholder="Why it matters, in your words"><p class="cap">This shows next to the goal so you keep seeing why</p></div>
    <div class="field"><label for="ge-${id}-target">${dbt ? 'Total owed' : 'Goal amount'}</label><div class="inp"><span class="yen cs"></span><input id="ge-${id}-target" data-g="target" type="number" inputmode="numeric" min="0" step="100" value="${g.target}"></div></div>
    <div class="field"><label for="ge-${id}-start">${dbt ? 'Already paid off' : 'Already saved'}</label><div class="inp"><span class="yen cs"></span><input id="ge-${id}-start" data-g="start" type="number" inputmode="numeric" min="0" step="100" value="${g.start}"></div></div>
    <div class="field"><label for="ge-${id}-due">${dbt ? 'Paid off by' : 'Needed by'}</label><input type="date" id="ge-${id}-due" data-g="due" min="${lo}" max="${hi}" value="${esc(g.due)}"><p class="cap">With a date the amount left gets spread over the months before it, and without one it's planned over about a year.${g.due ? ' <button type="button" class="link" data-gnodate>Remove date</button>' : ''}</p></div>
    ${dbt ? '' : `<div class="field wide"><label class="check"><input type="checkbox" data-g="emergency"${g.emergency ? ' checked' : ''}><span>Emergency fund</span></label><p class="cap">${g.emergency ? 'This is the one goal you can borrow from when a month comes up short, and when one of your monthly payments ends its money can come here' : 'Tick to make this your emergency fund, the one goal you can borrow from when a month comes up short'}</p></div>`}
    ${g.emergency ? `<div class="field"><label for="ge-${id}-stretch">Long-term goal</label><div class="inp"><span class="yen cs"></span><input id="ge-${id}-stretch" data-g="stretch" type="number" inputmode="numeric" min="0" step="1000" value="${g.stretch || 0}"></div><p class="cap">The usual amount is three to six months of Bills and basics, so the goal amount above is your first stop and this is the bigger one after it.</p></div>` : ''}
    ${own ? `<p class="cap wide">Monthly amount set by you. <button type="button" class="link" data-gauto>Use suggested amount</button></p>` : '<p class="cap wide">The monthly amount is worked out for you. To set your own, tap Change monthly amount.</p>'}
    <div class="row-btns wide"><button type="button" class="btn small solid" data-gdone>Done</button><button type="button" class="btn small warnbtn" data-gdel data-armkey="gdel-${id}">Remove goal</button></div></div>`;
}
function goalCardHTML(g) {
  const id = esc(g.id);
  return `<div class="gcard" id="jc-${id}" data-gid="${id}" style="--c:var(--c${g.slot})">
    <div class="jhead"><span class="jarn"><i class="dot"></i><span id="jn-${id}">${esc(g.name)}</span></span><span class="jarv" id="jv-${id}"></span></div>
    <p class="gwhy" id="jw-${id}">${esc(g.why || '')}</p>
    <div class="gbar" role="img" aria-label="${esc(g.name)} progress"><i class="fill" style="width:0%"></i><span class="gtick" hidden></span></div>
    <div class="jfoot"><span class="jstat plain" id="js-${id}"></span><span class="jart" id="jt-${id}"></span></div>
    <p class="gsave"><span id="gs-${id}"></span> <button type="button" class="link" data-adjust>Change monthly amount</button></p>
    <p class="gedit"><button type="button" class="link" data-gedit="${id}" aria-expanded="${editGoal === g.id}">${editGoal === g.id ? 'Close' : 'Edit goal'}</button></p>
    ${editGoal === g.id ? goalFormHTML(g) : ''}</div>`;
}
function buildGoals() {
  const gs = S.plan.goals;
  $('#goalCards').innerHTML = gs.length ? gs.map(goalCardHTML).join('') : '<p class="cap">No burrows yet: add one below</p>';
  $('#roadLegend').innerHTML = gs.map(g => `<span><i style="--c:var(--c${g.slot})"></i>${esc(g.name)}</span>`).join('');
  $('#addGoalBtn').hidden = gs.length >= MAX_GOALS; $('#goalMsg').textContent = gs.length >= MAX_GOALS ? `You can have ${MAX_GOALS} burrows at most, so remove one to add another` : '';
}
function buildOut() {
  $('#rowsOut').innerHTML = JARROWS.map(r => rowHTML(r, false)).join('');
  setOpen(openId); itemsSig = '';
}

/* ---------- receipt categories ---------- */
const CAT_NEW = '__new';
function buildRcCat() {
  const el = $('#rcCat'), keep = el.value || S.ui.rcCat; let h = '';
  [['play', 'Free to spend'], ['nec', 'Bills and basics'], ['edu', 'Education'], ['ffa', 'Investing'], ['give', 'Giving']].forEach(p => {
    const ls = S.plan.lines.filter(l => l.jar === p[0]); if (!ls.length) return;
    h += `<optgroup label="${p[1]}">` + ls.map(l => `<option value="${esc(l.key)}">${esc(shownLine(l.name))}</option>`).join('') + '</optgroup>';
  });
  el.innerHTML = h + `<option value="other">Other</option><option value="${CAT_NEW}">+ Add category</option>`;
  const opts = Array.from(el.options).map(o => o.value);
  el.value = opts.indexOf(keep) >= 0 ? keep : (opts.indexOf('envelope') >= 0 ? 'envelope' : opts[0]);
  if (el.value !== CAT_NEW) el.dataset.prev = el.value;
  if (typeof syncOtherTitle === 'function') syncOtherTitle('rcCat', 'rcNote');
}
/* the list of categories without the "add" choice, for the pickers on the scan review */
const catOptionsHTML = () => $('#rcCat').innerHTML.replace(new RegExp(`<option value="${CAT_NEW}">[^<]*</option>`), '');
/* a category is a line in your plan, so a new one is a new line with no monthly amount, under the jar it comes out of */
const newCatHTML = p => `<div class="newcat-in">
  <div class="field"><label for="${p}NewName">Category name</label><input class="txt" id="${p}NewName" type="text" maxlength="60" placeholder="Pet food" autocomplete="off"></div>
  <div class="field"><label for="${p}NewJar">Jar</label><div class="selbox"><select id="${p}NewJar">${LINE_JARS.map(j => `<option value="${j}"${j === 'play' ? ' selected' : ''}>${esc(JARNAME[j])}</option>`).join('')}</select></div></div>
  <div class="row-btns"><button type="button" class="btn small solid" data-newcat="${p}">Add category</button><button type="button" class="link" data-newcatx="${p}">Cancel</button><span class="msg" role="status"></span></div></div>`;
function newCatOpen(p, on) {
  const panel = $('#' + p + 'New'), sel = $('#' + p + 'Cat'); if (!panel || !sel) return;
  if (on) { if (!panel.firstChild) panel.innerHTML = newCatHTML(p); panel.hidden = false; $('.msg', panel).textContent = ''; const nm = $('#' + p + 'NewName'); nm.value = ''; nm.focus({ preventScroll: false }); }
  else { panel.hidden = true; if (sel.value === CAT_NEW) { const back = sel.dataset.prev; sel.value = Array.from(sel.options).some(o => o.value === back) ? back : sel.options[0].value; if (typeof syncOtherTitle === 'function') syncOtherTitle(p + 'Cat', p + 'Note'); } }
}
function newCatAdd(p) {
  const panel = $('#' + p + 'New'), nm = $('#' + p + 'NewName'), jar = $('#' + p + 'NewJar').value, msg = $('.msg', panel), name = nm.value.trim();
  if (!name) { msg.textContent = 'Type a name for the category'; nm.focus(); return; }
  if (S.plan.lines.some(l => l.name.trim().toLowerCase() === name.toLowerCase())) { msg.textContent = 'You already have that name, pick it from the list'; nm.focus(); return; }
  const id = addLine(S, jar, name, 0);
  if (!id) { msg.textContent = `You can have ${MAX_LINES} categories at most, so remove one to add another`; return; }
  const key = lineById(S, id).key; S.ui.rcCat = key; persist(); restructure();
  ['h', 'rc'].forEach(q => { const sel = $('#' + q + 'Cat'); sel.value = key; sel.dataset.prev = key; const pn = $('#' + q + 'New'); if (pn) pn.hidden = true; });
  syncOtherTitle('hCat', 'hNote'); syncOtherTitle('rcCat', 'rcNote');
  const m = $('#' + p + 'Msg'); if (m) m.textContent = `Added “${name}” under ${JARNAME[jar]}. It has no monthly amount yet, so set one in Plan to compare.`;
  sfx('pop'); const amt = $('#' + p + 'Amt'); if (amt) amt.focus();
}
/* one handler for both places: picking the "add" choice opens the panel, and any other pick closes it */
function catPicked(p) {
  const sel = $('#' + p + 'Cat');
  if (sel.value === CAT_NEW) { newCatOpen(p, true); return; }
  sel.dataset.prev = sel.value; const pn = $('#' + p + 'New'); if (pn) pn.hidden = true;
}
document.addEventListener('click', e => {
  const add = e.target.closest('[data-newcat]'), x = e.target.closest('[data-newcatx]');
  if (add) newCatAdd(add.dataset.newcat); else if (x) newCatOpen(x.dataset.newcatx, false);
});
document.addEventListener('keydown', e => { if (e.key === 'Enter' && /^(h|rc)NewName$/.test(e.target.id || '')) { e.preventDefault(); newCatAdd(e.target.id.replace('NewName', '')); } });

const CURS = [['₱', '₱ Philippine peso'], ['$', '$ Dollar'], ['€', '€ Euro'], ['£', '£ Pound'], ['¥', '¥ Yen or yuan'], ['₹', '₹ Rupee'], ['₩', '₩ Won'], ['R$', 'R$ Real'], ['A$', 'A$ Australian dollar'], ['C$', 'C$ Canadian dollar'], ['S$', 'S$ Singapore dollar'], ['NZ$', 'NZ$ New Zealand dollar'], ['CHF', 'CHF Swiss franc'], ['kr', 'kr Krona or krone'], ['R', 'R Rand'], ['zł', 'zł Zloty'], ['none', 'No symbol']];
const SETF = [
  { k: 'bankStart', label: 'Money today (bank plus cash)', hint: 'What you have right now, which is where the first month in the plan starts. Update it whenever you check your bank. If you\'re overdrawn type a minus, like -400.' },
  { k: 'minBank', label: 'Minimum balance', hint: 'You get a warning when a month would end below this.' },
  { k: 'ceiling', label: 'Free to spend cap', hint: 'The most you want Free to spend to be in a month, shown as a mark on the Free to spend bar in Plan' },
];
function buildStatic() {
  $('#curSel').innerHTML = CURS.map(c => `<option value="${esc(c[0])}">${esc(c[1])}</option>`).join('');
  const opts = MONTHS.map(ym => `<option value="${ym}">${fullLabel(ym)}</option>`).join('');
  $('#monthSel').innerHTML = opts; $('#rcMonth').innerHTML = opts;
  $('#rcFields').innerHTML = remindFieldsHTML('rc');
  $('#jarList').innerHTML = JARS.map(j => `<div class="j"><i class="${JARCLS[j.id]}"></i><span class="jn">${j.name}<small>${j.about}</small></span><b class="jp">${j.usualPct}%</b></div>`).join('');
  $('#sets').innerHTML = '<h3 class="grp">Balance</h3>' + SETF.map(f => `<div class="field"><label for="st-${f.k}">${f.label}</label><div class="inp"><span class="yen cs"></span><input id="st-${f.k}" type="number" inputmode="${f.k === 'bankStart' ? 'text' : 'decimal'}"${f.k === 'bankStart' ? ' data-neg="ok"' : ' min="0"'} step="any"></div><p class="cap">${f.hint}</p></div>`).join('');
  $('#rowsIn').innerHTML = '';
  restructure(true);
}
/* run after any change to lines, goals or names */
function restructure(first) {
  computeFields();
  $('#rowsIn').innerHTML = IN_ROWS.map(r => rowHTML(r, true)).join('')
    + `<div class="row static" id="rowDraw" hidden><div class="row-h"><span class="nm">Borrowed from emergency fund</span><span class="amt" id="ra-draw"></span><span></span></div></div>`;
  buildOut(); buildGoals(); buildRcCat();
  if (!first) render();
}
