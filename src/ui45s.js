
/* ---------- the guided setup: one question at a time, written straight into the plan ----------
   Every screen saves as you type, so closing the tour half way loses nothing.
   Nothing here invents a number: a field you leave empty stays empty. */
const PART = { welcome: 'Welcome', money: 'Money', bills: 'Bills', jars: 'Jars', goals: 'Goals', spend: 'Play money' };

const inum = id => { const el = document.getElementById(id); return el ? num0(el.value) : 0; };
const moneyField = (id, label, v, hint) => `<div class="field"><label for="${id}">${label}</label><div class="inp"><span class="yen cs"></span><input id="${id}" type="number" inputmode="numeric" min="0" step="any" aria-describedby="tourTitle" placeholder="${hint || 'Amount'}" value="${v > 0 ? v : ''}"></div></div>`;
const textField = (id, label, v, max) => `<div class="field"><label for="${id}">${label}</label><div class="inp"><input id="${id}" type="text" maxlength="${max || 60}" spellcheck="false" value="${esc(v)}"></div></div>`;
const payNow = () => val(S, 'a', START) + val(S, 'b', START) + val(S, 'side', START);
const havePay = () => !!(S.ui.done && S.ui.done.pay) && payNow() > 0;
const necLines = () => S.plan.lines.filter(l => l.jar === 'nec');
const necTotal = () => necLines().reduce((a, l) => a + val(S, l.key, START), 0);
const toUnit = x => { const u = roundUnit(S); return Math.round(x / u) * u; };
/* set when the person types or taps anything on the current screen, so an empty box that was cleared on purpose still saves as zero */
let tourTouched = false;

/* split a total into whole numbers in proportion to the weights, with no rounding left over */
function lr(w, total) {
  const sw = w.reduce((a, b) => a + b, 0), raw = w.map(x => (sw > 0 ? x / sw * total : total / (w.length || 1))), fl = raw.map(Math.floor);
  const left = total - fl.reduce((a, b) => a + b, 0);
  raw.map((x, i) => [x - fl[i], i]).sort((a, b) => b[0] - a[0] || a[1] - b[1]).slice(0, Math.max(0, left)).forEach(p => { fl[p[1]]++; });
  return fl;
}
/* move one share to p. Only that share changes: it can take what is still unassigned and no more, and whatever it gives up
   becomes unassigned. The other shares never move on their own. Returns the new list and whether the move was cut short. */
function moveShare(vals, i, p, total) {
  const out = vals.slice(), others = vals.reduce((a, v, j) => a + (j === i ? 0 : v), 0), room = Math.max(0, total - others), want = Math.round(p);
  out[i] = Math.max(0, Math.min(room, want));
  return { out, hit: want > room };
}
const sumOf = a => a.reduce((x, y) => x + y, 0);
/* share the unassigned part among the shares: by the current shares, or evenly when all are zero */
const spreadFree = (vals, total) => { const free = total - sumOf(vals); if (free <= 0) return vals.slice(); const got = lr(vals.some(v => v > 0) ? vals : vals.map(() => 1), free); return vals.map((v, k) => v + got[k]); };

/* ----- the typed numbers: pay, other income and the balance on one screen. Skipped once statements gave the pay. ----- */
const STEP_MONEY = { id: 'money', part: PART.money, setup: true, focus: '#tourPay', title: 'Your money', skipIf: () => importApplied() && havePay(),
  body: () => {
    const pay = S.ui.done && S.ui.done.pay ? val(S, 'a', START) : '';
    return `<p>Take-home pay after tax, each month. Paid twice a month: add both. Other income is a second job, a partner&rsquo;s share, benefits. Balance is bank accounts plus cash; rough is fine.</p>
    <div class="tour-fields">${moneyField('tourPay', 'Monthly take-home pay', pay)}${moneyField('tourExtra', 'Other income each month <span class="opt">(optional)</span>', val(S, 'b', START), 'None')}${moneyField('tourBank', 'Balance now', S.cfg.bankStart !== undefined ? S.cfg.bankStart : '', 'Rough is fine')}</div>
    <p class="cap">Not sure of a number? Leave it blank; the Plan tab takes it later.</p>`;
  },
  leave: () => {
    const pay = $('#tourPay'), extra = $('#tourExtra'), bank = $('#tourBank'); if (!pay) return;
    if (pay.value !== '' || tourTouched) { const v = num0(pay.value); setVal(S, 'a', START, v, 'after'); if (v > 0) markDone('pay'); }
    if (extra && (extra.value !== '' || tourTouched || S.steps.b)) setVal(S, 'b', START, num0(extra.value), 'after');
    if (bank && bank.value !== '' && +bank.value >= 0) S.cfg.bankStart = num0(bank.value);
    if (S.cfg.minBank === undefined && payNow() > 0) S.cfg.minBank = toUnit(payNow() * 0.1); /* the safety line: a tenth of pay unless Settings says otherwise */
    persist();
  } };

/* ----- bills: tick the ones you pay, then one screen for each ----- */
const BILLS_ON = ['rent', 'util', 'food', 'net', 'phone', 'gas'];
const BILL_Q = { rent: 'Rent or mortgage', util: 'Utilities', food: 'Food and groceries', net: 'Internet', phone: 'Phone', ins: 'Insurance', subs: 'Subscriptions', gas: 'Transport', loan: 'Loan or debt payment', card: 'Credit card' };
const BILL_NOTE = {
  rent: () => 'Full amount. If someone else pays part, add their share as other income.',
  util: () => 'Electricity, gas and water.',
  food: () => 'Groceries and everyday meals. Eating out for fun comes out of play money.',
  net: () => 'Home internet, or the data plan if that is how you connect.',
  phone: () => 'Your monthly plan, or what you usually spend on top-ups.',
  ins: () => 'Health, life, car or home. Use the monthly amount.' + (S.ui.cur === '₱' ? ' Self-employed? Include your own SSS, PhilHealth and Pag-IBIG.' : ''),
  gas: () => 'Commute, ' + (S.ui.cur === '₱' ? 'Grab' : 'taxis') + ', fuel, parking, tolls.',
};
/* a line that was added with "add another" belongs to the kind it was copied from */
const baseOf = id => moreKind(id) || id;
function chosenBills() {
  const all = necLines(), ids = all.map(l => l.id), sb = Array.isArray(S.ui.sb) ? S.ui.sb.filter(id => ids.indexOf(id) >= 0 && !moreKind(id)) : null;
  const base = sb || BILLS_ON.filter(id => ids.indexOf(id) >= 0), out = [];
  base.forEach(id => { out.push(id); all.forEach(l => { if (moreKind(l.id) === id) out.push(l.id); }); });
  return out;
}
const STEP_BILLS = { id: 'bills-pick', part: PART.bills, setup: true, pick: true, skipIf: () => importApplied(), title: 'Monthly bills',
  body: () => {
    const on = chosenBills();
    return `<p>Tick what applies. Rough numbers are fine.</p>
    <div class="tour-chips two" role="group" aria-label="Your monthly bills">${necLines().filter(l => !moreKind(l.id)).map(l => `<label class="chip multi${on.indexOf(l.id) >= 0 ? ' on' : ''}"><input type="checkbox" name="tourBill" value="${esc(l.id)}"${on.indexOf(l.id) >= 0 ? ' checked' : ''}><span>${esc(l.name)}</span></label>`).join('')}</div>
    <p class="cap">Missing one? Add lines later.</p>`;
  },
  leave: d => {
    if (d <= 0) return;
    const ids = $$('#tourBody input[name=tourBill]:checked').map(i => i.value).filter(id => lineById(S, id));
    S.ui.sb = ids;
    const keep = necLines().filter(l => ids.indexOf(baseOf(l.id)) >= 0).map(l => l.id);
    /* the sample amounts are not yours: every line starts empty, and what you type replaces it */
    necLines().forEach(l => { if (keep.indexOf(l.id) < 0 || !S.steps[l.key]) setVal(S, l.key, START, 0, 'after'); });
    markDone('bills'); persist();
  } };
const billStep = id => ({ id: 'bill-' + id, part: PART.bills, setup: true, focus: baseOf(id) === 'subs' ? '' : '#tourAmt',
  title: () => { const l = lineById(S, id); if (!l) return ''; const mk = moreKind(id); return mk ? MORE_KINDS[mk].title : (BILL_Q[id] || `${esc(l.name)}`); },
  body: () => {
    const l = lineById(S, id); if (!l) return '';
    const b = baseOf(id), mk = moreKind(id), named = mk || b === 'loan', note = BILL_NOTE[b];
    if (b === 'loan') return loanBody(l, mk) + moreBtn('loan');
    if (b === 'subs') {
      const m = subsModel(val(S, l.key, START));
      return `<p>Tick each one, then enter the monthly cost. The grey line is a typical price, as a check only.</p>
      ${subsRows(m)}
      <p class="subs-h"><b>Something else</b></p>
      <p class="cap">Not in the list: add a name and amount.</p>
      <div id="subsOthers">${m.O.map(subOtherRow).join('')}</div>
      <div class="row-btns"><button type="button" class="btn small more" id="subsAddO"${m.O.length >= SUB_MAX_O ? ' hidden' : ''}>${m.O.length ? 'Add another' : 'Add something else'}</button></div>
      <div class="tour-fields subs-total">${moneyField('tourAmt', 'Total each month', subsSum(m)).replace('<input ', '<input readonly tabindex="-1" ')}</div>
      <p class="cap">Typical prices, Nov 2026. Each grey line names its country. Plan and billing change them: use your own bill.</p>`;
    }
    if (b === 'card') {
      /* one plain question; the statement arithmetic is there for those who only know the statement total */
      const saved = val(S, l.key, START), c = cardModel(saved), calc = c.b > 0;
      return `<p>What goes on the card each month apart from the bills you already listed: shopping, eating out, online orders, rides. A rough number is fine.</p>
      <div class="tour-fields">${moneyField('tourAmt', 'Card spending, each month', saved)}</div>
      <details class="src-how"${calc ? ' open' : ''}><summary>I only know the statement total</summary><div class="src-how-in">
        <p class="cap">Enter the statement total, then the part of it that is bills you already listed (rent, food, subscriptions). The rest is card spending.</p>
        <div class="tour-fields">${moneyField('tourCardT', 'Statement total, each month', calc ? c.t : '')}${moneyField('tourCardB', 'Of that, bills already listed', calc ? c.b : '', 'Optional')}</div>
        <div class="row-btns"><span class="cap" id="cardCap" aria-live="polite"></span><button type="button" class="btn small solid" id="cardUse" hidden>Use this amount</button></div>
      </div></details>
      <p class="cap">No credit card: go back and untick it. Paying off an old balance: use loan or debt.</p>`;
    }
    return `${note ? `<p>${esc(note())}</p>` : ''}
    <div class="tour-fields">${named ? textField('tourLName', 'Name', l.name) : ''}${moneyField('tourAmt', 'Each month', val(S, l.key, START))}</div>${b === 'ins' ? moreBtn('ins') : ''}`;
  },
  leave: d => {
    const l = lineById(S, id); if (!l) return;
    if (baseOf(id) === 'loan') { loanLeave(l); persist(); return; }
    if (baseOf(id) === 'card') cardLeave(d); /* before the amount is read: a filled calculator with an empty amount box counts when the person moves on */
    setVal(S, l.key, START, inum('tourAmt'), 'after');
    const nm = $('#tourLName'); if (nm && nm.value.trim()) updateLine(S, id, { name: nm.value });
    if (baseOf(id) === 'subs') subsLeave();
    persist();
  } });
const moreBtn = kind => `<div class="row-btns"><button type="button" class="btn small more" data-more="${kind}">${MORE_KINDS[kind].add}</button></div>`;

/* ----- where the rest of the pay goes: the five other jars share what the bills leave ----- */
const JAR5 = ['lts', 'play', 'edu', 'ffa', 'give'];
const JAR_LABEL = { lts: 'Long-Term Savings for Spending', play: 'Play', edu: 'Education', ffa: 'Financial Freedom', give: 'Give' };
const JAR_SHORT = { lts: 'Savings', play: 'Play', edu: 'Education', ffa: 'Freedom', give: 'Give' };
let jarVals = null, jarRest = 0, jarNec = 0;
/* the share of the pay the bills leave for the other five jars, in whole percents; 0 when the bills use all of it */
const restPct = () => { const pay = payNow(); return pay > 0 && necTotal() < pay ? Math.max(0, 100 - Math.min(100, Math.round(necTotal() / pay * 100))) : 0; };
function jarInit() {
  const pay = payNow(), nec = necTotal(), a = aimsOf(S);
  jarNec = pay > 0 ? 100 - restPct() : 0; jarRest = 100 - jarNec;
  const mine = JAR5.map(j => Math.round(a[j] * 100));
  /* an earlier setup that did not fit left the usual shares in place, so they are the starting point again */
  jarVals = mine.reduce((x, y) => x + y, 0) === jarRest && S.cfg.aims ? mine : lr(JAR5.map(j => a[j]), jarRest);
  SPF.jar.last = -1; SPF.jar.hit = false;
}
/* Share a sum of money in whole steps (the same step the page rounds to elsewhere) by weights, with nothing left over.
   Coins that do not fill a step go to the weight at "pref" if it has any, or to the biggest one. */
function shareMoney(total, weights, pref) {
  const u = roundUnit(S), tot = Math.max(0, round2(total));
  if (!(tot > 0) || !weights.some(w => w > 0)) return weights.map(() => 0);
  const units = Math.floor(tot / u + 1e-9), out = lr(weights, units).map(n => n * u), dust = round2(tot - units * u);
  if (dust > 0) { const k = pref !== undefined && weights[pref] > 0 ? pref : weights.indexOf(Math.max(...weights)); out[k] = round2(out[k] + dust); }
  return out;
}
/* what the bills leave, shared by the five jars by their shares; the part not given out stays unassigned (it shows as left over) */
const jarMoneyList = weights => shareMoney(jarRest > 0 ? round2((payNow() - necTotal()) * sumOf(weights) / jarRest) : 0, weights, 1);
const jarMoneyOf = pct => (jarRest > 0 ? round2((payNow() - necTotal()) * pct / jarRest) : 0);
const jarMoney = i => jarMoneyList(jarVals)[i];
const potHTML = (id, cols, vals, total) => `<div class="pot" id="${id}" aria-hidden="true">${cols.map((c, i) => `<i style="background:${c};flex-grow:${Math.max(vals[i], 0.0001)}"></i>`).join('')}<i class="free" style="flex-grow:${Math.max(total - sumOf(vals), 0.0001)}"></i></div>`;
/* the line under the pot: how much is unassigned, with Spread it and Give it to */
const poolHTML = (kind, names) => `<div class="pool" id="${kind}Pool" aria-live="polite"><span class="pool-t"></span><span class="pool-acts"><button type="button" class="link" data-spread="${kind}">Spread it</button><label class="pool-give">Give it to <select class="inp sm" data-give="${kind}" aria-label="Give the unassigned part to one"><option value="">…</option>${names.map((n, i) => `<option value="${i}">${esc(n)}</option>`).join('')}</select></label></span></div>`;
function jarRows() {
  return JAR5.map((j, i) => `<div class="split-row" data-jrow="${i}"><div class="split-h"><i class="dot" style="--c:${JARVAR[j]}"></i><b>${JAR_LABEL[j]}</b><span class="dlt"></span>${pctPill('jpct', i, JAR_LABEL[j], jarRest)}</div><p class="split-m"></p>
    <div class="rng" style="--c:${JARVAR[j]}"><input type="range" min="0" max="${jarRest}" step="1" value="${jarVals[i]}" data-jar="${i}" aria-label="${JAR_LABEL[j]}, share of your pay"></div></div>`).join('');
}
function paintJars() { if (!jarVals || jarRest <= 0 || !$('#jarSplit')) return; spPaint('jar', SPLIT_SPEC.jar()); }
const setLine0 = l => setVal(S, l.key, START, 0, 'after');
/* the bills use all of the pay, so the other jars and the goals get nothing yet. The shares stay as the usual aims, and only the money is zero. */
function noRoom() {
  ['play', 'edu', 'ffa', 'give'].forEach(j => S.plan.lines.filter(l => l.jar === j).forEach(setLine0));
  S.plan.goals.forEach(g => setVal(S, 'goal:' + g.id, START, 0, 'after'));
  S.cfg.ceiling = 0;
}
function commitJars() {
  if (!(payNow() > 0)) return;
  if (restPct() <= 0) { noRoom(); persist(); return; }
  if (!jarVals || jarRest <= 0) return;
  const a = { nec: jarNec / 100 };
  JAR5.forEach((j, i) => { a[j] = jarVals[i] / 100; });
  S.cfg.aims = a;
  const mon = jarMoneyList(jarVals);
  ['play', 'edu', 'ffa', 'give'].forEach(j => {
    const ls = S.plan.lines.filter(l => l.jar === j); if (!ls.length) return;
    const others = ls.slice(1).reduce((x, l) => x + val(S, l.key, START), 0);
    setVal(S, ls[0].key, START, Math.max(0, round2(mon[JAR5.indexOf(j)] - others)), 'after');
  });
  /* a jar set to nothing means no goal money either, or the old sample amounts would stay */
  if (!(jarVals[0] > 0)) S.plan.goals.forEach(g => setVal(S, 'goal:' + g.id, START, 0, 'after'));
  S.cfg.ceiling = toUnit(mon[1] * 1.5);
  persist();
}
/* goals added after the bills use all of the pay, or after the savings jar was set to nothing, start at zero and not at their usual sample amount */
function settleGoals() { if (havePay() && !(ltsBudget() > 0)) S.plan.goals.forEach(g => setVal(S, 'goal:' + g.id, START, 0, 'after')); }
const STEP_JARS = { id: 'jars', part: PART.jars, setup: true, when: havePay,
  title: 'Split the rest',
  body: () => {
    jarInit(); const pay = payNow(), nec = necTotal();
    if (nec <= 0) return `<p>No bills listed, so the other five jars would share all of your pay. If that is wrong, go back and add bills.</p>
    <p class="cap">If you truly have none, continue and split below.</p>${jarSplitHTML()}`;
    if (jarRest <= 0) return `<p>Bills <b>${fmt(nec)}</b>, pay <b>${fmt(pay)}</b>. ${nec > pay ? `Bills exceed pay by <b>${fmt(nec - pay)}</b>, so` : 'Bills take all of it, so'} nothing is left for the other five jars: no play money and nothing for goals, for now.</p>
    <p>You can still add goals next. They start filling once bills drop below pay. To lower a bill, go back. Otherwise continue and adjust under Plan later.</p>`;
    return `<p>Bills <b>${fmt(nec)}</b> = <b>${jarNec}%</b> of pay: the Necessities jar. The other <b>${jarRest}%</b> (${fmt(pay - nec)}) is yours to split between the five jars below, starting at the usual proportions. Each slider moves on its own: what you take away waits as unassigned, and a slider can only take what is unassigned.</p>
    ${jarsFold()}${jarSplitHTML()}`;
  },
  after: () => { if (jarRest > 0) paintJars(); },
  leave: () => commitJars() };
/* the six jars in short, folded: pay is split into jars and each jar has one purpose */
const jarsFold = () => `<details class="src-how"><summary>The six jars, in short</summary><div class="src-how-in">
    <p>Every month, pay is split into six jars. Each jar has one purpose, and play money is the jar you spend on fun without guilt. Usual shares of take-home pay:</p>
    <ul class="jar-lines">${JARS.map(j => `<li><i class="dot" style="--c:${JARVAR[j.id]}"></i><span><b>${esc(j.name)}</b> ${Math.round(j.usual * 100)}%. ${esc(JAR_LINES[j.id])}</span></li>`).join('')}</ul>
    <p class="cap">From T. Harv Eker&rsquo;s jar system (Secrets of the Millionaire Mind). Shares are a guide, not a rule.</p></div></details>`;
const jarSplitHTML = () => `${potHTML('jarPot', JAR5.map(j => JARVAR[j]), jarVals, jarRest)}${poolHTML('jar', JAR5.map(j => JAR_SHORT[j]))}
    <div class="split" id="jarSplit">${jarRows()}</div>
    <p class="why" id="jarWhy" aria-live="polite"></p>
    <div class="row-btns"><button type="button" class="link" id="jarReset">Use the usual amounts</button></div>`;

/* ----- goals: tick what you are saving for, then one screen for each ----- */
const GOAL_KINDS = [
  { k: 'rainy', id: 'rainy', name: 'Emergency fund', slot: 7, em: true, pick: 'Emergency fund', hint: 'Cushion for surprises', title: 'Emergency fund' },
  { k: 'travel', id: 'travel', name: 'Trip', slot: 5, pick: 'A trip', hint: 'Flights, stay, food', title: 'Trip', cost: 'Flights, stay, food.' },
  { k: 'moving', id: 'moving', name: 'Home or move', slot: 4, pick: 'A home or a move', hint: 'Deposit, movers, furniture', title: 'Home or move', cost: 'Deposit, movers, furniture.' },
  { k: 'buy', id: 'buy', name: 'Big purchase', slot: 1, pick: 'A big purchase', hint: 'Laptop, car, wedding', title: 'Big purchase', cost: 'The price, or your best guess.' },
  { k: 'car', id: 'car', name: 'Yearly cost', slot: 6, pick: 'A yearly cost', hint: 'Insurance, taxes, holidays', title: 'Yearly cost', cost: 'Full amount for the year, not per month.' },
  { k: 'other', id: 'other', name: 'Something else', slot: 2, pick: 'Something else', hint: 'Anything with a price', title: 'Goal', cost: '' },
];
const STEP_TOOLPICK = { id: 'goals-pick', part: PART.goals, setup: true, pick: true, title: 'Goals', art: 'sprout',
  body: () => `<p>The Long-Term Savings for Spending jar holds money saved now and spent later: a cushion, a trip, a big purchase. Tick what you are saving for. Add more later.</p>
    <div class="tour-chips two" role="group" aria-label="Goals">${GOAL_KINDS.map(k => { const on = S.ui.gset ? !!goalById(S, k.id) : k.k === 'rainy'; return `<label class="chip multi${on ? ' on' : ''}"><input type="checkbox" name="tourGoalPick" value="${k.k}"${on ? ' checked' : ''}><b>${k.pick}</b><span>${k.hint}</span></label>`; }).join('')}</div>
    <p class="cap">Unsure? Keep the emergency fund.</p>`,
  leave: d => {
    if (d <= 0) return;
    const picked = $$('#tourBody input[name=tourGoalPick]:checked').map(i => i.value), first = !S.ui.gset, old = S.plan.goals, next = [], gk = S.ui.gk || {};
    GOAL_KINDS.forEach(k => {
      if (picked.indexOf(k.k) < 0) return;
      const ex = first ? null : goalById(S, k.id);
      if (ex) next.push(ex); else { const g = { id: k.id, name: k.name, target: 0, start: 0, due: '', slot: k.slot }; if (k.em) { g.emergency = true; g.stretch = 0; } next.push(g); }
      if (!first) old.forEach(g => { if (gk[g.id] === k.k && next.indexOf(g) < 0) next.push(g); });
    });
    if (!first) old.forEach(g => { if (!GOAL_KINDS.some(k => k.id === g.id) && !gk[g.id] && next.indexOf(g) < 0) next.push(g); });
    old.forEach(g => { if (next.indexOf(g) < 0) forgetKey(S, 'goal:' + g.id); });
    S.plan.goals = next.slice(0, MAX_GOALS); S.ui.gset = true; settleGoals(); markDone('goals'); persist();
  } };
const EM_MONTHS = [[1, 'month'], [3, 'months'], [6, 'months']];
const emMonths = g => { const n = necTotal(); if (n <= 0 || !(g.target > 0)) return 3; const m = g.target / n; return EM_MONTHS.reduce((best, x) => Math.abs(x[0] - m) < Math.abs(best - m) ? x[0] : best, 3); };
const emCap = m => `${m} month${m === 1 ? '' : 's'} of your bills is <b>${fmt(m * necTotal())}</b>.`;
const goalStep = id => ({ id: 'goal-' + id, part: PART.goals, setup: true,
  focus: '#tourGCost, #tourGSaved',
  title: () => { const g = goalById(S, id), k = goalKindOf(id); return g ? (k ? (S.ui.gk && S.ui.gk[id] ? `Your next ${GOAL_NOUN[k.k] || 'goal'}` : k.title) : 'Your goal') : ''; },
  body: () => {
    const g = goalById(S, id); if (!g) return '';
    const k = goalKindOf(id) || {}, em = !!g.emergency && necTotal() > 0, lo = START + '-01', hi = END + '-28';
    if (em) {
      const m = emMonths(g);
      return `<p>A cushion for surprises. You can borrow from it in a short month. Usual advice: three to six months of bills.</p>
      <div class="field tour-q1"><span class="l" id="tourEmL">Months of bills to cover</span>
      <div class="tour-chips" role="radiogroup" aria-labelledby="tourEmL">${EM_MONTHS.map(x => chip('tourEm', String(x[0]), String(x[0]), x[1], x[0] === m)).join('')}</div></div>
      <p class="cap" id="tourEmCap">${emCap(m)}</p>
      <div class="tour-fields">${moneyField('tourGSaved', 'Already saved', g.start)}</div>`;
    }
    return `<p>Name, cost, and a date if there is one.</p>
    <div class="tour-fields">
      ${g.emergency ? '' : textField('tourGName', 'Name', g.name)}
      <div class="field">${moneyField('tourGCost', 'Cost', g.target).replace(/^<div class="field">|<\/div>$/g, '')}${k.cost ? `<p class="cap">${k.cost}</p>` : ''}</div>
      ${moneyField('tourGSaved', 'Already saved', g.start)}
      ${g.emergency ? '' : `<div class="field"><label for="tourGDue">Needed by</label><input type="date" id="tourGDue" min="${lo}" max="${hi}" value="${esc(g.due)}"><p class="cap">With a date, the monthly amount is worked out for you.</p></div>`}
    </div>
    ${k.k && !k.em && S.plan.goals.length < MAX_GOALS ? `<div class="row-btns"><button type="button" class="btn small more" data-moreg="${esc(id)}">Add another ${GOAL_NOUN[k.k] || 'goal'}</button></div>` : ''}`;
  },
  leave: () => {
    const g = goalById(S, id); if (!g) return;
    if ($('input[name=tourEm]')) {
      const m = +($('input[name=tourEm]:checked') || { value: 3 }).value, n = necTotal();
      updateGoal(S, id, { start: inum('tourGSaved'), target: m * n, stretch: (m >= 6 ? 12 : 6) * n });
    } else {
      const nm = $('#tourGName'), du = $('#tourGDue');
      updateGoal(S, id, { name: nm && nm.value.trim() ? nm.value : g.name, target: inum('tourGCost'), start: inum('tourGSaved'), due: du ? du.value : g.due });
    }
    settleGoals(); persist();
  } });

/* ----- dividing the goal money: dated goals get what they need first, the rest is shared ----- */
let gsIds = [], gsPct = [], gsBudget = 0, splitC2 = null;
const ltsBudget = () => (restPct() > 0 ? jarMoneyList(JAR5.map(j => aimsOf(S)[j]))[0] : 0);
/* A goal can only take what it still needs, so a goal that is nearly full does not get more than that and the others pick up the rest. */
const goalRoom = g => Math.max(0, capOf(g) - g.start);
function capWeights(w, caps, B) {
  const a = w.map(() => 0), free = w.map((x, i) => x > 0 && caps[i] > 0); let rest = B;
  for (let n = 0; n <= w.length && rest > 1e-9; n++) {
    const sw = w.reduce((s, x, i) => s + (free[i] ? x : 0), 0); if (!(sw > 0)) break;
    const over = w.map((x, i) => free[i] && a[i] + rest * x / sw > caps[i] + 1e-9);
    if (!over.some(Boolean)) { w.forEach((x, i) => { if (free[i]) a[i] += rest * x / sw; }); rest = 0; break; }
    let used = 0; over.forEach((o, i) => { if (o) { used += caps[i] - a[i]; a[i] = caps[i]; free[i] = false; } });
    rest -= used;
  }
  return a;
}
function splitInit() {
  const gs = S.plan.goals; gsIds = gs.map(g => g.id); gsBudget = ltsBudget();
  SPF.goal.last = -1; SPF.goal.hit = false;
  const amts = gs.map(g => val(S, 'goal:' + g.id, START)), sa = amts.reduce((a, b) => a + b, 0);
  if (gs.length && gs.every(g => hasOwnMonthly(S, g.id)) && sa > 0) { gsPct = lr(amts, 100); return; }
  const B = gsBudget, needs = gs.map(g => (g.due && g.target > g.start ? goalDefault(S, g, SAVE_FROM) : 0)), open = gs.map(g => g.target > g.start), tn = needs.reduce((a, b) => a + b, 0);
  let w;
  if (B > 0 && tn >= B) {
    /* more is wanted than there is: the dated goals share it by what they need, but a quarter always goes to the emergency fund */
    const em = gs.findIndex((g, i) => g.emergency && open[i] && needs[i] === 0);
    w = em >= 0 ? needs.map((n, i) => (i === em ? B * 0.25 : n / tn * B * 0.75)) : needs.slice();
  }
  else {
    const wt = gs.map((g, i) => (needs[i] > 0 ? 0 : open[i] ? (g.emergency ? 2 : 1) : 0)), sw = wt.reduce((a, b) => a + b, 0);
    w = sw > 0 ? gs.map((g, i) => needs[i] + (B - tn) * wt[i] / sw) : gs.map((g, i) => (needs[i] > 0 ? needs[i] : open[i] ? 1 : 0));
  }
  if (!w.some(x => x > 0)) w = gs.map(() => 1);
  { const caps = gs.map(goalRoom), a = capWeights(w, caps, B); if (a.some(x => x > 0)) w = a; }
  gsPct = lr(w, 100);
  /* whole percents can land a hair under what a dated goal needs, which would leave it a few coins short each month, so top it up from the goals with no date */
  if (B > 0 && tn < B) for (let n = 0; n < 100; n++) {
    const i = gs.findIndex((g, k) => needs[k] > 0 && splitMoney(k) < needs[k]); if (i < 0) break;
    let j = -1; gsPct.forEach((pc, k) => { if (k !== i && pc > 0 && !(needs[k] > 0) && (j < 0 || pc > gsPct[j])) j = k; });
    if (j < 0) break;
    gsPct[i]++; gsPct[j]--;
  }
}
const gsMoneyOf = pct => round2(gsBudget * pct / 100);
const splitMoney = i => { const g = S.plan.goals[i]; return Math.min(shareMoney(gsMoneyOf(sumOf(gsPct)), gsPct)[i], g ? goalRoom(g) : Infinity); };
function applySplit() { gsIds.forEach((id, k) => { if (goalById(S, id)) setVal(S, 'goal:' + id, START, splitMoney(k), 'after'); }); }
/* the line under each goal: how much more it needs, and when it will be full */
function splitLine(g, C2) {
  if (!(g.target > 0)) return 'No cost set.';
  const togo = Math.max(0, g.target - g.start), tg = `${fmt(togo)} to go. `, k = S.plan.goals.indexOf(g);
  if (togo <= 0) return 'Already full.';
  if (!(splitMoney(k) > 0)) return tg + 'Nothing goes into this one.';
  const gi = goalInfo(S, C2, g.id, START);
  if (gi.state === 'full') return 'Already full.';
  if (gi.state === 'paid' || gi.state === 'short') return tg + 'Date is this month or passed.';
  if (gi.state === 'ontrack') return `${tg}Full ${monthLabel(gi.reached)}, ahead of ${dateLabel(g.due)}.`;
  if (gi.state === 'behind') return gi.need != null ? `${tg}Needs about ${fmt(gi.need)} a month for ${dateLabel(g.due)}.` : tg + 'Not ready in time.';
  if (gi.state === 'eta') return `${tg}Full ${monthLabel(gi.reached)}.`;
  if (gi.state === 'noeta') return `${tg}Not full within ${SPAN} at this pace.`;
  return tg;
}
const splitNoteFor = i => { const g = S.plan.goals[i]; return g && splitC2 ? splitLine(g, splitC2) : ''; };
function splitRows() {
  const one = S.plan.goals.length === 1;
  return S.plan.goals.map((g, i) => `<div class="split-row" data-grow="${i}"><div class="split-h"><i class="dot" style="--c:var(--c${g.slot})"></i><b>${esc(g.name)}</b>${one ? '' : `<span class="dlt"></span>${pctPill('gpct', i, g.name, 100)}`}</div><p class="split-m"></p>
    ${one ? '' : `<div class="rng" style="--c:var(--c${g.slot})"><input type="range" min="0" max="100" step="1" value="${gsPct[i]}" data-split="${i}" aria-label="${esc(g.name)}, share of your goal money"></div>`}<p class="cap split-s"></p></div>`).join('');
}
/* the part of the goal money that no goal can take right now */
const unusedOf = () => Math.max(0, round2(gsBudget - S.plan.goals.reduce((a, g, i) => a + splitMoney(i), 0)));
function paintSplit() {
  if (!$('#goalSplit')) return;
  applySplit(); splitC2 = calcAll(S);
  { const u = unusedOf(), el = $('#splitUnused'); if (el) el.textContent = u > 0 ? `${fmt(u)} of this jar is unassigned: goals cannot take more now. Add a goal or raise a cost.` : ''; }
  if (S.plan.goals.length === 1) { const row = $('[data-grow="0"]'); if (row) { $('.split-m', row).textContent = fmt(splitMoney(0)) + ' a month'; $('.split-s', row).textContent = splitNoteFor(0); } return; }
  spPaint('goal', SPLIT_SPEC.goal());
}
const STEP_SPLIT = { id: 'goalsplit', part: PART.goals, setup: true, when: () => havePay() && S.plan.goals.length > 1 && ltsBudget() > 0,
  title: () => (S.plan.goals.length > 1 ? 'Split goal money' : 'Goal money'),
  body: () => {
    splitInit(); const pct = Math.round(aimsOf(S).lts * 100), many = S.plan.goals.length > 1;
    return `<p>${many ? `The Long-Term Savings for Spending jar is <b>${pct}%</b> of pay, <b>${fmt(gsBudget)}</b> a month, shared between your goals. A goal with a date gets what it needs first. Each slider moves on its own; what you take away waits as unassigned.`
      : `The Long-Term Savings for Spending jar is <b>${pct}%</b> of pay, <b>${fmt(gsBudget)}</b> a month. ${unusedOf() > 0 ? 'This goal is filled first.' : 'All of it goes to this goal.'}`}</p>
    ${many ? potHTML('goalPot', S.plan.goals.map(g => `var(--c${g.slot})`), gsPct, 100) + poolHTML('goal', S.plan.goals.map(g => g.name)) : ''}
    <div class="split" id="goalSplit">${splitRows()}</div>
    <p class="cap" id="splitUnused" aria-live="polite"></p>
    ${many ? '<p class="why" id="splitWhy" aria-live="polite"></p><div class="row-btns"><button type="button" class="link" id="splitReset">Reset to suggested split</button></div>' : ''}`;
  },
  after: () => paintSplit(),
  leave: () => { if (!gsIds.length || !$('#goalSplit')) return; applySplit(); markDone('goals'); persist(); } };

/* ----- the payoff: your play money ----- */
/* what the plan adds up to right now, in plain terms. Everything the reveal and the last screen say comes from here. */
function planFacts() {
  const C = calcAll(S), m = C.byYm[sel], J = jarsOf(S, m), inc = J.inn, L = m.pool.left, play = m.jar.play;
  const tol = roundUnit(S), bills = m.jar.nec, goals = m.goalsTotal, other = m.jar.edu + m.jar.ffa + m.jar.give;
  const st = !havePay() ? 'nopay' : L < 0 ? 'over' : L >= tol ? 'spare' : 'even';
  return { C, m, J, inc, L, play, tol, bills, goals, other, st, billPct: inc > 0 ? bills / inc : 0 };
}
const ledgerRow = (k, v, cls) => `<div${cls ? ` class="${cls}"` : ''}><dt>${k}</dt><dd>${v}</dd></div>`;
function ledgerHTML(f) {
  const rows = [ledgerRow('Pay in', fmt(f.inc)), ledgerRow('Bills (Necessities)', fmt(f.bills))];
  if (f.goals > 0) rows.push(ledgerRow('Goals (Long-Term Savings for Spending)', fmt(f.goals)));
  if (f.other > 0) rows.push(ledgerRow('Education, Financial Freedom and Give', fmt(f.other)));
  rows.push(ledgerRow('Play money', fmt(f.play), 'play'));
  if (f.st === 'over') rows.push(ledgerRow('Short by', fmt(-f.L), 'neg')); else if (f.st === 'spare') rows.push(ledgerRow('Left, unassigned', fmt(f.L)));
  return `<dl class="tour-ledger">${rows.join('')}</dl>`;
}
const behindGoals = () => (tourMode === 'full' && havePay() ? S.plan.goals.filter(g => goalInfo(S, calcAll(S), g.id, START).state === 'behind') : []);
const behindText = () => {
  const b = behindGoals(); if (!b.length) return '';
  const names = b.map(g => `<b>${esc(g.name)}</b>`).join(' and ');
  return `${names} ${b.length === 1 ? 'misses its date' : 'miss their dates'} at this pace. Under Plan, Goals: move the date, lower the amount or give it more pay.`;
};
const STEP_REVEAL = { id: 'reveal', part: PART.spend, art: 'branch',
  title: () => { const f = planFacts(); return f.st === 'over' ? 'Plan exceeds pay' : f.play > 0 ? 'Play money' : 'Play money'; },
  show: () => { if (tourMode === 'full' && S.ui.done && S.ui.done.pay && S.ui.done.bills && S.ui.done.goals) { S.ui.setup = true; persist(); } },
  body: () => {
    const f = planFacts(), play = f.play, wk = roundTo(play / 4.35), seg = (cls, v) => (v > 0 ? `<div class="seg-b ${cls}" style="flex-grow:${v}"></div>` : '');
    if (f.st === 'nopay') return `<div class="tour-reveal"><b>${fmt(play)}</b><span>a month, sample</span></div>
      <p>No pay entered, so every number here is a sample. Play money is the fun jar, worked out after bills and goals. Add pay under Salary.</p>`;
    if (f.st === 'over') return `<div class="tour-reveal neg"><b>${fmt(-f.L)}</b><span>short a month</span></div>
      <p>Plan spends <b>${fmt(f.J.out)}</b>; pay is <b>${fmt(f.inc)}</b>.${play > 0 ? '' : ' Nothing left, so no play money yet.'}</p>
      ${ledgerHTML(f)}
      <p>Under Plan: lower a bill or add income.${play > 0 ? '' : ' Play money appears as soon as there is room.'}</p>`;
    const rest = f.J.rest;
    const bar = `<div class="tour-fig"><div class="bar tour-bar" role="img" aria-label="Pay by jar">${f.J.list.map(j => seg(JARCLS[j.id], j.v)).join('')}${seg('rest', rest)}</div>
      <div class="legend">${f.J.list.map(j => (j.v > 0 ? `<span><i class="${JARCLS[j.id]}"></i>${j.name} ${j.pct}%</span>` : '')).join('')}${rest > 0 ? `<span><i class="rest"></i>Left ${f.J.restPct}%</span>` : ''}</div></div>`;
    const big = `<div class="tour-reveal"><b>${fmt(play)}</b><span>a month${play > 0 ? `, about ${fmt(wk)} a week` : ''}</span></div>`;
    if (play <= 0) {
      const all = f.billPct >= 0.95;
      return `${big}<p>${all ? `Bills take <b>${f.J.list[0].pct}%</b> of pay, so almost nothing is left for play money.` : 'Nothing is set aside for play money.'} Eker&rsquo;s system keeps about 10% of pay for it, to spend on fun every month.</p>
      ${bar}<p>${behindText() || 'To add some, raise the Play line under Plan or lower a bill.'}</p>`;
    }
    const msg = behindText() || (f.st === 'spare' ? `<b>${fmt(f.L)}</b> of pay is unassigned. Raise a goal or add to play money.` : f.billPct >= 0.9 ? 'Bills take most of pay, so the month is tight. Lowering a bill is the easiest fix.' : 'All pay is assigned.');
    return `${big}<p>Bills are paid and every other jar has its share: this is yours to spend on fun, no guilt. Split of ${fmt(f.inc)} pay:</p>
    ${bar}<p>${msg}</p>`;
  } };
