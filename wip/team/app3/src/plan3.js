/* ---------- Plan (the plan lane; old app: ui1.js to ui3.js, ui7.js, rebuilt on the new engine, pay to pay) ----------
   This pay period by its dates with each budget line and Free to spend (what it started with and what is left), bills
   with their days (add, change from a date, end), goals kept in the bank or in their own account (set money aside,
   progress, target date), cards and loans with their payment days (each owns its payment [E6]), and the pay periods
   gone by, built from what happened (engine/periods.js). Every figure is the engine's; every write is one step through
   ACT3 (src/act3.js, its Undo bar) using the steps in src/plan3_write.js. This file chooses, writes and places; it never
   adds, takes away or rounds (tests: no_maths.js, e3_plan.js). */
const PL3 = { form: null, sheet: null };   // sheet: which sheet the next form is, its row in CHAT3C.SCREENS (set by each opener)
const plLive3 = x => x && !x.gone;
const plWords3 = { once: 'This pay period only', now: 'This pay period and after', next: 'From the next pay period' };

function plFig3(path, minor, cur) { return fig3(path, minor, cur || E3.home()); }
function plRow3(attrs, left, right, after) {
  return `<li${after ? ' class="a3-hashelp"' : ''}><button type="button" class="a3-rcrow" ${attrs}><span>${left}</span><span class="amt">${right}</span></button>${after || ''}</li>`;
}
/* an overdue card or loan payment (the engine's `overdue`: past its day and not ticked [F4, H8, BF2]) */
function overdueWords3(o, cur, yr, path) {
  return `${fig3(path, o.amount, cur)} due ${esc3(day3(o.payment_date, yr))} ${o.state === 'late' ? 'is late' : 'has not been seen'}. Tick it at Check your bank when it has gone`;
}
function plAccounts3(kinds) { return ((E3.book && E3.book.accounts) || []).filter(a => plLive3(a) && kinds[a.type] && !a.closed); }

/* [slice 6, B4] no fixed pay: no pay periods. Each line and Free to spend is an amount a month that comes off by the day;
   the amount in force today is the record's own (a lookup, schedules.stepOn) */
function plNoPay3(book, day) {
  const S = BurrowEngine.schedules, n = BurrowEngine.dates.dayNum(day);
  const lines = ((book.plan || {}).budgets || []).filter(l => plLive3(l) && !(l.ends && l.ends <= day)).map(l => ({ l, a: S.stepOn(l, n) })).filter(x => x.a)
    .map(({ l, a }) => plRow3(`data-line="${esc3(l.id)}"`, `${esc3(l.name)}<br><span class="when">Comes off by the day</span>`, `<span data-fig="line-amount">${plFig3('plan.budgets.*.steps', a)}</span> <span class="when">a month</span>`));
  /* [BQ2] the entry in force: by `from`, ties broken by `at` */
  const fr = ((book.plan || {}).shares || []).filter(s => plLive3(s) && s.free != null && (!s.from || s.from <= day))
    .sort((p, q) => ((p.from || '') < (q.from || '') ? -1 : (p.from || '') > (q.from || '') ? 1 : (p.at || '') < (q.at || '') ? -1 : (p.at || '') > (q.at || '') ? 1 : 0)).pop();
  const free = fr && fr.free ? plRow3('data-line="free"', `${esc3(label3('freeToSpendLeft'))}<br><span class="when">Comes off by the day</span>`, `<span data-fig="free-amount">${plFig3('plan.shares.*.free', fr.free)}</span> <span class="when">a month</span>`) : '';
  return `<section class="a3-card" data-card="plan-period"><h2>Your plan, with no fixed pay</h2>
    <p class="a3-sub">With no pay day there are no pay periods. Each line is an amount a month, taken off by the day, and safe to spend leaves room for it</p>
    ${lines.length || free ? `<ul class="a3-rows a3-rclist">${lines.join('')}${free}</ul>` : '<p class="a3-sub">No budget lines yet. A line keeps money for one thing, like food, each month</p>'}
    <div class="a3-actions"><button type="button" class="a3-btn" id="plAddLine">Add a line</button>${fr ? '' : '<button type="button" class="a3-btn" id="plSetFree">Set Free to spend</button>'}</div></section>`;
}
function renderPlan3() { screen3(drawPlan3); }
function drawPlan3() {
  const host = $('#a3Plan');
  if (!host || host.hidden) return;
  if (PL3.form) return;   // a form is open: it draws itself
  if (!E3.book) { host.innerHTML = '<section class="a3-card"><h2>Nothing here yet</h2><p class="a3-sub">Set up first. Your plan shows here after that</p></section>'; return; }
  const day = E3.today(), yr = day.slice(0, 4), home = E3.home(), book = E3.book;
  let r, view, per;
  try { r = E3.view(day); view = BurrowEngine.periods.scheduleView(book, day); per = BurrowEngine.periods.periods(book, day); } catch (e) {
    host.innerHTML = `<section class="a3-card"><h2>The plan could not be worked out</h2><p class="a3-warn a3-bad">${esc3(e.message)}</p></section>`; return;
  }
  const out = [];
  /* this pay period */
  const p = r.period;
  if (!p) out.push(plNoPay3(book, day));
  else {
    const lines = p.lines.filter(l => !(l.amount === 0 && l.left === 0)).map(l => {
      const rec = ((book.plan || {}).budgets || []).find(x => x.id === l.id) || {};
      const ends = rec.ends ? `<br><span class="when">Ends after this pay period</span>` : '';
      /* [QC F5, B2] one amount for the period, the one that counts now; the full amount only in the sentence under it */
      const cur = E3.home(), f = fmt3(cur, [l.amount, l.counts, l.spent, l.over]);
      const part = l.counts !== l.amount ? `<br><span class="when" data-fig="line-part">Only the part for the days left in this pay period counts now: ${f(l.counts)} of ${f(l.amount)}</span>` : '';
      const over = l.over ? `<br><span class="when a3-late" data-fig="line-over">Spent ${f(l.spent)} of ${f(l.counts)}: ${esc3(overWords3(l.name, f(l.over)))}</span>` : '';
      /* [NS-FIX 5] the part-period sentence gets the help piece's "?" (beside the row's button, never inside it) */
      const why = part ? `<div class="a3-helprow"><span class="when">Why only part?</span>${HELP3.button('lineShare')}${HELP3.text('lineShare')}</div>` : '';
      return plRow3(`data-line="${esc3(l.id)}"`, `${esc3(l.name)}${ends}${part}${over}`, `<span data-fig="line-left">${plFig3('period.lines.*.left', l.left)}</span> <span class="when">left of <span data-fig="line-amount">${plFig3('period.lines.*.counts', l.counts)}</span></span>`, why);
    });
    const fp = p.free && p.free.counts !== p.free.amount ? (f => `<br><span class="when" data-fig="free-part">Only the part for the days left in this pay period counts now: ${f(p.free.counts)} of ${f(p.free.amount)}</span>`)(fmt3(E3.home(), [p.free.counts, p.free.amount])) : '';
    const free = p.free ? plRow3('data-line="free"', `${esc3(label3('freeToSpendLeft'))}${fp}`, `<span data-fig="free-left">${plFig3('period.free.left', p.free.left)}</span> <span class="when">of <span data-fig="free-amount">${plFig3('period.free.counts', p.free.counts)}</span></span>`) : '';
    out.push(`<section class="a3-card" data-card="plan-period"><h2>${esc3(label3('period'))}</h2>
      ${p.start && p.end ? `<p class="a3-mid" data-fig="plan-period" data-start="${esc3(p.start)}" data-end="${esc3(p.end)}">${esc3(period3(p))}</p>` : '<p class="a3-sub">The first pay period starts with your next pay</p>'}
      ${lines.length || free ? `<ul class="a3-rows a3-rclist">${lines.join('')}${free}</ul>` : '<p class="a3-sub">No budget lines yet. A line keeps money for one thing, like food, each pay period</p>'}
      <div class="a3-actions"><button type="button" class="a3-btn" id="plAddLine">Add a line</button>${p.free ? '' : '<button type="button" class="a3-btn" id="plSetFree">Set Free to spend</button>'}</div></section>`);
  }
  /* pay and bills */
  const scheds = (book.schedules || []).filter(s => plLive3(s) && view[s.id]);
  /* [BJ5] what has landed and is not ticked off comes first, then the next one */
  const owing = { late: 'late', notSeen: 'not seen yet', unticked: 'not ticked off yet' };
  /* [walk 4] each outstanding one with its own amount, and then the next with its own when they differ in time */
  const owingWords = (v, cur) => (v.outstanding || []).map(o => `due ${esc3(day3(o.land, yr))}, ${owing[o.state]}, ${money3(o.amount, cur || home)}, `).join('');
  const nextWords = (v, cur) => `${owingWords(v, cur)}${v.next ? `next ${esc3(day3(v.next.land, yr))}${(v.outstanding || []).length ? ', ' + money3(v.next.amount, cur || home) : ''}` : v.ends ? `ended ${esc3(day3(v.ends, yr))}` : 'nothing coming'}`;
  /* the row's figure: the first outstanding one's own amount (scheduleView outstanding[].amount), else the next one's */
  const rowAmount = v => ((v.outstanding || []).length ? v.outstanding[0].amount : v.next ? v.next.amount : v.amount);
  const ruleWords = v => rhythmWords3(v.rule, yr);
  /* [slice 6, B4] a pay with no fixed day and no amount: words, no figure */
  const payFig = (s, v) => (rowAmount(v) == null ? '<span class="when">comes when it comes</span>' : plFig3((v.outstanding || []).length ? 'schedules.*.outstanding.0.amount' : 'schedules.*.next.amount', rowAmount(v), s.cur));
  const pays = scheds.filter(s => s.kind === 'income').map(s => plRow3(`data-pay="${esc3(s.id)}"`, `${esc3(s.name)}<br><span class="when">${ruleWords(view[s.id])}${view[s.id].rule && view[s.id].rule.every === 'none' ? '' : ', ' + nextWords(view[s.id], s.cur)}</span>`, payFig(s, view[s.id])));
  /* [slice 6] a cost that does not come every month: a nudge to set money aside ahead, from the engine (periods.aheadFor),
     until a goal of the same name holds it */
  let ahead = [];
  try { ahead = BurrowEngine.periods.aheadFor(book, day); } catch (e) { ahead = []; }
  const goalNames = new Set((book.places || []).filter(g => plLive3(g) && g.kind === 'goal').map(g => String(g.name).toLowerCase()));
  const aheadOf = s => {
    const a = ahead.find(x => x.schedule === s.id);
    if (!a || goalNames.has(String(s.name).toLowerCase())) return '';
    const f = fmt3(s.cur || home, [a.amount].concat(a.perPay == null ? [] : [a.perPay]));
    const words = a.perPay == null ? `Set money aside ahead: ${f(a.amount)} by ${day3(a.due, yr)}` : `Set aside about ${f(a.perPay)} each pay to have ${f(a.amount)} ready by ${day3(a.due, yr)} (${a.pays === 1 ? '1 pay' : a.pays + ' pays'} before it)`;
    return `<div class="a3-helprow" data-fig="ahead" data-sched="${esc3(s.id)}"><span class="when">${esc3(words)}</span><button type="button" class="a3-btn" data-ahead="${esc3(s.id)}">Make a goal for it</button></div>`;
  };
  const bills = scheds.filter(s => s.kind === 'bill').map(s => plRow3(`data-bill="${esc3(s.id)}"`, `${esc3(s.name)}<br><span class="when">${ruleWords(view[s.id])}, ${nextWords(view[s.id], s.cur)}${view[s.id].ends && view[s.id].next ? ', last on ' + esc3(day3(view[s.id].ends, yr)) : ''}</span>`, plFig3((view[s.id].outstanding || []).length ? 'schedules.*.outstanding.0.amount' : 'schedules.*.next.amount', rowAmount(view[s.id]), s.cur), aheadOf(s)));
  out.push(`<section class="a3-card" data-card="plan-bills"><h2>Pay and bills</h2>
    ${pays.length ? `<ul class="a3-rows a3-rclist">${pays.join('')}</ul>` : ''}
    ${bills.length ? `<ul class="a3-rows a3-rclist">${bills.join('')}</ul>` : '<p class="a3-sub">No bills yet</p>'}
    <div class="a3-actions"><button type="button" class="a3-btn" id="plAddBill">Add a bill</button></div></section>`);
  /* goals */
  const goals = (book.places || []).filter(g => plLive3(g) && g.kind === 'goal' && r.places[g.id]).map(g => {
    const kept = r.places[g.id].kept, where = g.keptIn && g.keptIn.mode === 'ownAccount' ? 'in ' + esc3(E3.nameOf(g.keptIn.acct)) : 'kept in your bank';
    const due = g.due ? `, ${esc3(label3('placeDue')).toLowerCase()} ${esc3(day3(g.due, yr))}` : '';
    const pl = r.places[g.id], pace = pl.perPeriod && g.due ? `<br><span class="when" data-fig="goal-pace">about ${plFig3('places.*.perPeriod', pl.perPeriod, g.cur)} each pay to reach it by ${esc3(day3(g.due, yr))}</span>` : '';
    return `<li><button type="button" class="a3-rcrow a3-goal" data-goal="${esc3(g.id)}"><span>${esc3(g.name)}<br><span class="when">${where}${due}</span>
      <meter min="0" max="${esc3(g.target)}" value="${esc3(kept)}" aria-label="${esc3(g.name)}: set aside so far"></meter>${pace}</span>
      <span class="amt"><span data-fig="goal-kept">${plFig3('places.*.kept', kept, g.cur)}</span><br><span class="when">of ${plFig3('places.*.target', g.target, g.cur)}</span></span></button></li>`;
  });
  out.push(`<section class="a3-card" data-card="plan-goals"><h2>Goals</h2>${goals.length ? `<ul class="a3-rows a3-rclist">${goals.join('')}</ul>` : '<p class="a3-sub">No goals yet. A goal is money set aside for something, kept in your bank or in an account of its own</p>'}
    <div class="a3-actions"><button type="button" class="a3-btn" id="plAddGoal">Add a goal</button></div></section>`);
  /* cards and loans */
  const owedRows = plAccounts3({ card: 1, loan: 1 }).map(a => {
    const k = a.type === 'card' ? r.cards[a.id] : r.owed[a.id];
    if (!k) return '';
    const days = a.type === 'card' ? `paid on day ${esc3(a.payDay)} from ${esc3(E3.nameOf(a.payFrom))}, ${a.cutDay == null ? 'close day not sure' : 'closes on day ' + esc3(a.cutDay)}`
      : `paid on day ${esc3(a.payDay)} from ${esc3(E3.nameOf(a.payFrom))}`;
    const nx = k.next && k.next.amount ? `<br><span class="when">${esc3(label3('nextPayment'))} ${plFig3(a.type === 'card' ? 'cards.*.next.amount' : 'owed.*.next.amount', k.next.amount, a.cur)} on ${esc3(day3(k.next.payment_date, yr))}</span>` : '';
    const od = (k.overdue || []).map(o => `<br><span class="a3-late" data-fig="overdue" data-state="${esc3(o.state)}">${overdueWords3(o, a.cur, yr, a.type === 'card' ? 'cards.*.overdue.*.amount' : 'owed.*.overdue.*.amount')}</span>`).join('');
    return plRow3(`data-owed="${esc3(a.id)}"`, `${esc3(a.name)}<br><span class="when">${days}</span>${od}${nx}`, k.credit ? `<span data-fig="credit">${esc3(label3('inCredit')).toLowerCase()} ${plFig3('cards.*.credit', k.credit, a.cur)}</span>`   /* [BL5] never as owed */
      : `<span data-fig="owed-now">${plFig3(a.type === 'card' ? 'cards.*.owedNow' : 'owed.*.owedNow', k.owedNow, a.cur)}</span><br><span class="when">${esc3(label3('owed')).toLowerCase()}</span>`);
  }).filter(Boolean);
  out.push(`<section class="a3-card" data-card="plan-owed"><h2>Cards and loans</h2>${owedRows.length ? `<ul class="a3-rows a3-rclist">${owedRows.join('')}</ul>` : '<p class="a3-sub">No cards or loans</p>'}
    <div class="a3-actions"><button type="button" class="a3-btn" id="plAddCard">Add a card</button><button type="button" class="a3-btn" id="plAddLoan">Add a loan</button></div></section>`);
  /* pay periods gone by */
  const past = per.past.map(q => {
    const ln = q.lines.filter(l => l.amount || l.spent).map(l => `<li><span>${esc3(l.name)}</span><span class="amt">${plFig3('periods.*.lines.*.spent', l.spent)} <span class="when">spent of ${plFig3('periods.*.lines.*.start', l.start)}</span></span></li>`).join('');
    const fr = q.free ? `<li><span>Free to spend</span><span class="amt">${plFig3('periods.*.free.spent', q.free.spent)} <span class="when">spent of ${plFig3('periods.*.free.start', q.free.start)}</span></span></li>` : '';
    const tot = (name, x, path) => `<li><span>${name}</span><span class="amt">${plFig3(path, x.total)}</span></li>`;
    return `<details class="a3-past" data-past="${esc3(q.start)}"><summary>${esc3(SN.periodLabel(q.start, q.end))}</summary><ul class="a3-rows">${ln}${fr}
      ${tot('Money in', q.moneyIn, 'periods.*.moneyIn.total')}${tot('Bills paid', q.billsPaid, 'periods.*.billsPaid.total')}${tot('Card payments', q.cardPayments, 'periods.*.cardPayments.total')}</ul></details>`;
  });
  if (p) out.push(`<section class="a3-card" data-card="plan-past"><h2>Pay periods gone by</h2>${past.length ? past.join('') : '<p class="a3-sub">None yet. When your next pay is ticked off, this pay period shows here with what was spent</p>'}</section>`);
  host.setAttribute('data-origin', E3.mode === 'try' ? 'sample' : 'typed');
  host.innerHTML = out.join('');
  HELP3.bind(host);
  const P = BurrowScreens.provenance, origin = E3.mode === 'try' ? 'sample' : null;
  host.querySelectorAll('[data-figure]').forEach(el => P.stamp(el, P.mark(Number(el.dataset.amt), origin || (/(amount|target|start)$/.test(el.dataset.figure) ? 'typed' : 'worked'))));
  const on = (sel, fn) => { const el = $(sel); if (el) el.addEventListener('click', fn); };
  on('#plAddLine', () => plLineForm3(null));
  on('#plSetFree', () => plLineForm3('free'));
  on('#plAddBill', () => plBillForm3(null));
  on('#plAddGoal', () => plGoalForm3(null));
  on('#plAddCard', () => plCardForm3());
  on('#plAddLoan', () => plLoanForm3());
  host.querySelectorAll('[data-line]').forEach(b => b.addEventListener('click', () => plLineForm3(b.dataset.line)));
  host.querySelectorAll('[data-bill]').forEach(b => b.addEventListener('click', () => plBillForm3(b.dataset.bill)));
  host.querySelectorAll('[data-pay]').forEach(b => b.addEventListener('click', () => plBillForm3(b.dataset.pay)));
  host.querySelectorAll('[data-goal]').forEach(b => b.addEventListener('click', () => plGoalForm3(b.dataset.goal)));
  host.querySelectorAll('[data-ahead]').forEach(b => b.addEventListener('click', () => {
    const a = BurrowEngine.periods.aheadFor(E3.book, E3.today()).find(x => x.schedule === b.dataset.ahead), s = E3.book.schedules.find(x => x.id === b.dataset.ahead);
    plGoalForm3(null, a && s ? { name: s.name, target: a.amount, due: a.due } : null);
  }));
  host.querySelectorAll('[data-owed]').forEach(b => b.addEventListener('click', () => plOwedForm3(b.dataset.owed)));
}

/* ---- one form at a time, in the Plan panel: fields, then buttons, each button one ACT3 step ----
   field: { key, label, kind: 'text'|'amount'|'day'|'date'|'pick', value, options: [{ v, name }], hint, optional }
   button: { label, solid, step: vals => [label, w => ..., undo words] } */
function plForm3(title, fields, buttons, note) {
  const host = $('#a3Plan'), cur = E3.home();
  PL3.form = { title, sheet: PL3.sheet }; PL3.sheet = null;
  /* [STALE_SHEET_PLAN, M61] what this sheet saw when it opened: the door refuses a save on anything that changed since.
     Refused that way (here or by the store for a tab that is behind), the sheet closes to the list as it is now */
  const seen = ACT3.seen();
  const elsewhere = res => { if (res.ok || res.why !== 'other') return false; if (typeof BACK3 === 'object') BACK3.forget(); plClose3(); MSG3.post({ kind: 'notice', key: 'a3', text: res.text }); return true; };
  const input = f => {
    const id = 'pl-' + f.key, v = f.value == null ? '' : f.value;
    if (f.kind === 'pick') return `<select class="a3-in a3-sel" id="${id}">${f.options.map(o => `<option value="${esc3(o.v)}"${o.v === v ? ' selected' : ''}>${esc3(o.name)}</option>`).join('')}</select>`;
    if (f.kind === 'amount') return `<input class="a3-in" data-amount id="${id}" type="text" inputmode="decimal" autocomplete="off" value="${v === '' ? '' : SM.toInput(v, cur)}" placeholder="${esc3(SM.symbol(cur).trim())}">`;
    if (f.kind === 'day') return `<input class="a3-in" id="${id}" type="number" inputmode="numeric" min="1" max="31" value="${esc3(v)}">`;
    if (f.kind === 'date') return `<input class="a3-in a3-date" id="${id}" type="date" value="${esc3(v)}">`;
    return `<input class="a3-in a3-text" id="${id}" type="text" autocomplete="off" maxlength="60" value="${esc3(v)}">`;
  };
  host.innerHTML = `<section class="a3-card" data-card="plan-form"><h2>${esc3(title)}</h2>${note ? `<p class="a3-sub">${note}</p>` : ''}
    ${fields.map(f => `<div class="a3-field"><label for="pl-${f.key}">${esc3(f.label)}</label>${input(f)}${f.hint ? `<p class="a3-sub">${esc3(f.hint)}</p>` : ''}</div>`).join('')}
    <p class="a3-err" id="plErr" role="alert"></p><div id="plSure"></div><div class="a3-actions" id="plAsk" hidden></div>
    <div class="a3-actions">${buttons.map((b, i) => `<button type="button" class="a3-btn${b.solid ? ' solid' : ''}" data-plbtn="${i}">${esc3(b.label)}</button>`).join('')}<button type="button" class="a3-btn" id="plBack">Back</button></div></section>`;
  for (const f of fields) if (f.kind === 'amount') BurrowScreens.inputs.bind($('#pl-' + f.key), { kind: 'amount', code: cur, optional: true });
  const read = () => {
    const vals = {};
    for (const f of fields) {
      const el = $('#pl-' + f.key), t = el.value.trim();
      if (f.kind === 'amount') {
        if (!t) vals[f.key] = f.optional ? null : undefined;
        else { const v = typed3(t, cur); if (v === null) return { bad: `Type ${f.label.toLowerCase()} as an amount`, el }; vals[f.key] = v; }
      } else if (f.kind === 'day') vals[f.key] = t ? Number(t) : null;
      else vals[f.key] = t;
    }
    return { vals };
  };
  host.querySelectorAll('[data-plbtn]').forEach(btn => btn.addEventListener('click', async () => {
    const got = read(), err = $('#plErr');
    if (got.bad) { err.textContent = got.bad; got.el.focus(); return; }
    const b = buttons[Number(btn.dataset.plbtn)];
    /* [M6, M61] a button that removes asks first (sure3): nothing is written until the yes */
    if (b.sure && !btn.dataset.yes) { const [l0, f0] = b.step(got.vals), no = ACT3.refusal(l0, f0); if (no) { err.textContent = no; $('#plSure').innerHTML = ''; return; } }
    if (b.sure && !btn.dataset.yes) { sure3($('#plSure'), b.sure[0], b.sure[1], () => { btn.dataset.yes = '1'; btn.click(); }); return; }
    delete btn.dataset.yes;
    const [label, fn, undo] = b.step(got.vals);
    const res = await ACT3.run(label, fn, { undo, seen });
    if (elsewhere(res)) return;
    const ask = $('#plAsk'); ask.hidden = true; ask.innerHTML = '';
    if (!res.ok) {
      err.textContent = res.text;
      /* [BM2] a step that asks first (why 'ask'): the question, and a button that does it anyway with what is typed then */
      if (res.why === 'ask' && b.anyway) {
        ask.innerHTML = `<button type="button" class="a3-btn solid" id="plAnyway">${esc3(b.anyway.label)}</button>`; ask.hidden = false;
        $('#plAnyway').addEventListener('click', async () => {
          const again = read();
          if (again.bad) { err.textContent = again.bad; again.el.focus(); return; }
          const [l2, f2, u2] = b.anyway.step(again.vals), r2 = await ACT3.run(l2, f2, { undo: u2, seen });
          if (elsewhere(r2)) return;
          if (!r2.ok) { err.textContent = r2.text; ask.hidden = true; ask.innerHTML = ''; return; }
          plClose3();
        });
      }
      return;
    }
    plClose3();
  }));
  $('#plBack').addEventListener('click', plClose3);
  scrollTo(0, 0);
  const first = host.querySelector('input, select'); if (first) first.focus();
}
function plClose3() { PL3.form = null; renderPlan3(); }
function plWhen3(value) {
  return { key: 'when', label: 'When', kind: 'pick', value: value || 'next', options: ['next', 'now', 'once'].map(v => ({ v, name: plWords3[v] })) };
}

/* a budget line, or Free to spend ('free'); id null adds a line */
function plLineForm3(id) {
  PL3.sheet = id === 'free' ? 'free' : id ? 'line' : 'addLine';
  const book = E3.book, p = E3.view(E3.today()).period;
  /* [slice 6, B4] no fixed pay: each month, by the day, from today */
  const each = p ? 'Each pay period' : 'Each month';
  if (id === 'free') {
    const has = !!(p && p.free);
    plForm3('Free to spend', [{ key: 'amount', label: each, kind: 'amount', value: has ? p.free.amount : null }].concat(has ? [plWhen3('next')] : []),
      [{ label: 'Save', solid: true, step: v => ['setFree', w => PLAN3W.setFree(w, { amount: v.amount, when: v.when }), 'Free to spend changed'] }],
      'Free to spend is money for anything, with no line of its own');
    return;
  }
  if (!id) {
    plForm3('Add a line', [{ key: 'name', label: 'Name', kind: 'text', hint: 'Like Food or Transport' }, { key: 'amount', label: each, kind: 'amount' }],
      [{ label: 'Add', solid: true, step: v => ['addLine', w => PLAN3W.addLine(w, { name: v.name, amount: v.amount }), 'Line added'] }],
      p ? 'It starts in this pay period' : 'It starts today and comes off a little each day');
    return;
  }
  const rec = ((book.plan || {}).budgets || []).find(x => x.id === id);
  const l = p ? p.lines.find(x => x.id === id) : { amount: BurrowEngine.schedules.stepOn(rec, BurrowEngine.dates.dayNum(E3.today())) };
  plForm3(rec.name, [{ key: 'name', label: 'Name', kind: 'text', value: rec.name }, { key: 'amount', label: each, kind: 'amount', value: l ? l.amount : null }].concat(p ? [plWhen3('next')] : []),
    [{ label: 'Save', solid: true, step: v => ['changeLine', w => PLAN3W.changeLine(w, id, { name: v.name, amount: l && v.amount === l.amount ? null : v.amount, when: v.when }), 'Line changed'] },
     { label: 'End this line', sure: [`End ${rec.name}?${p ? ' It stays for this pay period and stops after it' : ''}`, 'Yes, end it'], step: () => ['endLine', w => PLAN3W.endLine(w, id), rec.name + ' ends after this pay period'] }],
    'A change never changes a pay period gone by');
}
const PL_EVERY3 = [{ v: 'month', name: 'On a day each month' }, { v: 'days', name: 'On two days each month' }, { v: 'weeks1', name: 'Every week' }, { v: 'weeks2', name: 'Every 2 weeks' },
  { v: 'weeks3', name: 'Every 3 weeks' }, { v: 'weeks4', name: 'Every 4 weeks' }, { v: 'none', name: 'No fixed pay: it comes when it comes' }];
const PL_DAY2_3 = '1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31'.split(' ').map(d => ({ v: d, name: d })).concat([{ v: 'last', name: 'the last day' }]);
/* a bill; id null adds one */
function plBillForm3(id) {
  PL3.sheet = !id ? 'addBill' : (((E3.book.schedules || []).find(x => x.id === id) || {}).kind === 'income' ? 'pay' : 'bill');
  const book = E3.book, accts = plAccounts3({ bank: 1, cash: 1, ewallet: 1, wallet: 1, card: 1 }).map(a => ({ v: a.id, name: a.name }));
  if (!id) {
    plForm3('Add a bill', [{ key: 'name', label: 'Name', kind: 'text', hint: 'Like Rent or Phone' }, { key: 'amount', label: 'Amount', kind: 'amount' },
      { key: 'day', label: 'Day of the month it is due', kind: 'day' }, { key: 'acct', label: 'Paid from', kind: 'pick', options: accts, value: (accts[0] || {}).v }],
    [{ label: 'Add', solid: true, step: v => ['addBill', w => PLAN3W.addBill(w, { name: v.name, amount: v.amount, day: v.day, acct: v.acct }), 'Bill added'] }],
    'It is due from today on. On a weekend or holiday it moves to the next working day');
    return;
  }
  const s = book.schedules.find(x => x.id === id), v0 = BurrowEngine.periods.scheduleView(book, E3.today())[id];
  const day = v0.rule && v0.rule.every === 'month' && v0.rule.days.length === 1 ? v0.rule.days[0] : null;
  const pay = s.kind === 'income';
  /* [slice 6] a pay can change how often it lands; for the pay that starts the period, each line counted each pay is
     asked about, with its amount now filled in. [slice 6b] Two days each month and no fixed pay too, both ways: to no
     fixed pay each line is asked as an amount a month; from it, each line and Free to spend (amounts a month) is asked as
     an amount each pay, when this pay will start the period */
  const r0 = v0.rule || {};
  const everyNow = !pay ? null : r0.every === 'none' ? 'none' : r0.every === 'month' && r0.days.length === 1 ? 'month' : r0.every === 'month' && r0.days.length === 2 ? 'days'
    : r0.every === 'weeks' && [1, 2, 3, 4].includes(r0.n) ? 'weeks' + r0.n : null;
  const dayNow = day != null ? day : everyNow === 'days' && typeof r0.days[0] === 'number' ? r0.days[0] : null;
  const every = everyNow ? [{ key: 'every', label: 'How often it lands', kind: 'pick', value: everyNow, options: PL_EVERY3 },
    { key: 'day2', label: 'And on day', kind: 'pick', value: everyNow === 'days' ? String(r0.days[1]) : 'last', options: PL_DAY2_3 },
    { key: 'start', label: 'The day of one pay, when it lands every few weeks', kind: 'date', value: r0.every === 'weeks' ? r0.from : '' }] : [];
  /* [BZ2] the pay holding the flag today (a dated flag: the engine says which) */
  const holder = BurrowEngine.schedules.periodHolder((book.schedules || []).filter(plLive3), E3.today());
  const starts = (holder && holder.id === s.id) || (everyNow === 'none' && !holder);
  const perPay = every.length && starts ? (everyNow === 'none' ? PLAN3W.linesEachMonth({ book, today: E3.today() }) : PLAN3W.linesEachPay({ book, today: E3.today() })) : [];
  const lines = perPay.map(l => ({ key: 'ln-' + l.key, label: `${l.name} ${everyNow === 'none' ? 'a month' : 'each pay'} from the change`, kind: 'amount', value: l.amount, optional: true, hint: ' ' }));
  plForm3(s.name, [{ key: 'name', label: 'Name', kind: 'text', value: s.name }, { key: 'amount', label: 'Amount', kind: 'amount', value: v0.amount }].concat(every.slice(0, 1),
    [{ key: 'day', label: 'Day of the month it is due', kind: 'day', value: dayNow }], every.slice(1), [{ key: 'from', label: 'Changes from', kind: 'date', value: v0.changeFrom, hint: 'Earlier ones stay as they were' }], lines),
  [{ label: 'Save', solid: true, step: v => ['changeBill', w => PLAN3W.changeBill(w, id, { name: v.name, amount: v.amount, day: v.day, from: v.from,
    ...(every.length ? { every: v.every, day2: v.day2 === 'last' ? 'last' : Number(v.day2), start: v.start, lines: Object.fromEntries(perPay.map(l => [l.key, v['ln-' + l.key] == null ? l.amount : v['ln-' + l.key]])) } : {}) }), pay ? 'Pay changed' : 'Bill changed'] }]
    .concat(pay || !v0.next ? [] : [{ label: 'Change the next one only', step: v => ['changeOnce', w => PLAN3W.changeOnce(w, id, { due: v0.next.due, amount: v.amount }), s.name + ' on ' + day3(v0.next.land, 'any') + ' changed'] },
      { label: 'End this bill', sure: [`End ${s.name}? Nothing is due after the day in "Changes from"`, 'Yes, end it'], step: v => ['endBill', w => PLAN3W.endBill(w, id, { last: v.from }), s.name + ' ends'] }]),
  pay ? 'A change starts from the day in "Changes from". Pay periods before it stay as they were' : `"Change the next one only" changes the amount of the one on ${esc3(day3(v0.next ? v0.next.land : v0.changeFrom, 'any'))}. End this bill: nothing is due after the day in "Changes from"`);
  if (every.length) plPropose3(perPay, r0, everyNow);
}
/* [slice 6, qc-foundation 2] when how often the pay lands changes, each line counted each pay is proposed as the same
   money a year under the new rhythm (the engine's periods.perPayAcross, rounded half up), and says so:
   "$400.00 every 2 weeks is $866.67 a month". Back to the rhythm it has, it is today's amount again.
   [slice 6b, BP3] No fixed pay counts as an amount a month (12 a year): "¥50,000 twice a month is ¥100,000 a month".
   The boxes each rhythm needs show: the day for a day or two days a month, the second day, the day of one pay. */
const PL_EVERY_WORDS3 = { month: 'a month', days: 'twice a month', weeks1: 'a week', weeks2: 'every 2 weeks', weeks3: 'every 3 weeks', weeks4: 'every 4 weeks', none: 'a month' };
function plPropose3(perPay, r0, now) {
  const cur = E3.home();
  const field = k => $('#pl-' + k).closest('.a3-field');
  const ruleOf = v => (v === now && v !== 'none' ? r0 : v === 'month' || v === 'none' ? { every: 'month', days: [Number($('#pl-day').value) || 1] }
    : v === 'days' ? { every: 'month', days: [1, 2] } : { every: 'weeks', n: Number(v.slice(5)) });
  const show = () => {
    const v = $('#pl-every').value, same = v === now;
    field('day').hidden = !(v === 'month' || v === 'days');
    field('day2').hidden = v !== 'days';
    field('start').hidden = !v.startsWith('weeks');
    for (const l of perPay) {
      const box = $('#pl-ln-' + l.key), hint = box.parentElement.querySelector('.a3-sub');
      $(`label[for="pl-ln-${l.key}"]`).textContent = `${l.name} ${v === 'none' ? 'a month' : 'each pay'} from the change`;
      const a = same ? l.amount : BurrowEngine.periods.perPayAcross(l.amount, ruleOf(now), ruleOf(v));
      if (a == null) { hint.textContent = ''; continue; }
      box.value = SM.toInput(a, cur);
      const f = fmt3(cur, [l.amount, a]);
      hint.textContent = same || a === l.amount ? '' : `${f(l.amount)} ${PL_EVERY_WORDS3[now]} is ${f(a)} ${PL_EVERY_WORDS3[v]}, the same money a year. Change it if you like`;
    }
  };
  $('#pl-every').addEventListener('change', show);
  show();
}
/* a goal; id null adds one */
function plGoalForm3(id, fill) {
  PL3.sheet = id ? 'goal' : 'addGoal';
  const book = E3.book;
  if (!id) {
    /* [slice 6] from a yearly cost's nudge: filled in with its name, amount and day */
    const f = fill || {};
    plForm3('Add a goal', [{ key: 'name', label: 'Name', kind: 'text', hint: 'Like Trip or New laptop', value: f.name }, { key: 'target', label: 'Goal amount', kind: 'amount', value: f.target },
      { key: 'due', label: 'Target date', kind: 'date', hint: 'Leave it empty for no date', value: f.due },
      { key: 'mode', label: 'Where the money is kept', kind: 'pick', value: 'inBank', options: [{ v: 'inBank', name: 'In my bank, set aside' }, { v: 'ownAccount', name: 'In an account of its own' }] }],
    [{ label: 'Add', solid: true, step: v => ['addGoal', w => PLAN3W.addGoal(w, { name: v.name, target: v.target, due: v.due || null, mode: v.mode }), 'Goal added'] }]);
    return;
  }
  const g = book.places.find(x => x.id === id);
  plForm3(g.name, [{ key: 'amount', label: 'Set aside now', kind: 'amount', optional: true, hint: g.keptIn && g.keptIn.mode === 'ownAccount' ? 'It moves from your bank into ' + E3.nameOf(g.keptIn.acct) : 'It stays in your bank, kept apart from safe to spend' },
    { key: 'name', label: 'Name', kind: 'text', value: g.name }, { key: 'target', label: 'Goal amount', kind: 'amount', value: g.target }, { key: 'due', label: 'Target date', kind: 'date', value: g.due || '' }],
  [{ label: 'Set aside', solid: true, step: v => ['setAside', w => PLAN3W.setAside(w, id, { amount: v.amount }), 'Set aside for ' + g.name],
     anyway: { label: 'Set aside anyway', step: v => ['setAside', w => PLAN3W.setAside(w, id, { amount: v.amount, anyway: true }), 'Set aside for ' + g.name] } },
   { label: 'Save changes', step: v => ['changeGoal', w => PLAN3W.changeGoal(w, id, { name: v.name, target: v.target, due: v.due }), 'Goal changed'] },
   { label: 'Take out', step: v => ['takeOut', w => PLAN3W.takeOut(w, id, { amount: v.amount }), 'Taken out of ' + g.name] }]);
}
/* a card's or a loan's days and payment */
function plOwedForm3(id) {
  PL3.sheet = ((E3.book.accounts || []).find(x => x.id === id) || {}).type === 'card' ? 'card' : 'loan';
  const a = E3.book.accounts.find(x => x.id === id), card = a.type === 'card';
  const fields = [{ key: 'name', label: 'Name', kind: 'text', value: a.name }, { key: 'payDay', label: 'Day of the month it is paid', kind: 'day', value: a.payDay }];
  if (card) fields.push({ key: 'cutDay', label: 'Day the statement closes', kind: 'day', value: a.cutDay, hint: 'Leave it empty if you are not sure: then all that is owed is due on each payment day' });
  else fields.push({ key: 'amount', label: 'Usual payment', kind: 'amount', value: a.amount });
  plForm3(a.name, fields, [{ label: 'Save', solid: true, step: v => ['changeOwed', w => PLAN3W.changeOwed(w, id, card ? { name: v.name, payDay: v.payDay, cutDay: v.cutDay } : { name: v.name, payDay: v.payDay, amount: v.amount }), a.name + ' changed'] }]
    .concat(card ? [] : [{ label: 'Close this loan', sure: [`Close ${a.name}? It leaves your plan`, 'Yes, close it'], step: () => ['closeLoan', w => PLAN3W.closeLoan(w, id), a.name + ' closed'] }]),
    card ? '' : 'A loan closes once it is paid off');
}
/* a card after setup (QC F1): the same questions setup asks, written through ACT3 */
function plCardForm3() {
  PL3.sheet = 'addCard';
  const closes = [{ v: 'not sure', name: 'Not sure' }, { v: 'last', name: 'The last day' }].concat('1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31'.split(' ').map(d => ({ v: d, name: d })));
  plForm3('Add a card', [{ key: 'name', label: 'Name', kind: 'text', hint: 'Like Visa' }, { key: 'owed', label: 'What is on it now', kind: 'amount', hint: 'Type 0 if nothing is on it' },
    { key: 'payDay', label: 'Day of the month it is paid from your bank', kind: 'day' },
    { key: 'cutDay', label: 'Day its statement closes', kind: 'pick', options: closes, value: 'not sure', hint: 'If you are not sure, all that is on it is due on each payment day' },
    { key: 'shift', label: 'When that day is a weekend or holiday, it comes out', kind: 'pick', options: [{ v: 'after', name: 'the working day after' }, { v: 'before', name: 'the working day before' }], value: 'after' }],
  [{ label: 'Add', solid: true, step: v => ['addCard', w => PLAN3W.addCard(w, { name: v.name, owed: v.owed, payDay: v.payDay, cutDay: v.cutDay === 'not sure' || v.cutDay === 'last' ? v.cutDay : Number(v.cutDay), shift: v.shift }), 'Card added'] }],
  'It is paid in full from your main bank. Its payment counts in what is due before next pay');
}
function plLoanForm3() {
  PL3.sheet = 'addLoan';
  plForm3('Add a loan', [{ key: 'name', label: 'Name', kind: 'text', hint: 'Like Car loan' }, { key: 'owed', label: 'Still owed today', kind: 'amount' },
    { key: 'amount', label: 'Usual payment', kind: 'amount' }, { key: 'payDay', label: 'Day of the month it is paid', kind: 'day' }],
  [{ label: 'Add', solid: true, step: v => ['addLoan', w => PLAN3W.addLoan(w, { name: v.name, owed: v.owed, amount: v.amount, payDay: v.payDay }), 'Loan added'] }],
  'It is paid from your main bank. Its payment counts in what is due before next pay');
}

/* Home's ways into Plan's own forms (one form each, never a second copy): 'free' Set Free to spend, 'card' Add a card,
   'goal' a goal by its id */
function planOpen3(what, id) {
  showTab3('plan'); PL3.form = null;
  if (what === 'free') plLineForm3('free');
  else if (what === 'card') plCardForm3();
  else if (what === 'goal') plGoalForm3(id);
  else renderPlan3();
}
/* the tab, and drawing again after every saved write or Undo */
document.addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) { if (b.dataset.tab !== 'plan') PL3.form = null; else setTimeout(renderPlan3, 0); } });
if (ACT3) ACT3.onChange(() => { if (!PL3.form) renderPlan3(); });
