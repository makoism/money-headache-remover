
/* ---------- the guided setup: one question at a time, written straight into the plan ----------
   Every screen saves as you type, so closing the tour half way loses nothing.
   Nothing here invents a number: a field you leave empty stays empty. */
const PART = { welcome: 'Welcome', money: 'Money', bills: 'Bills', jars: 'Split', goals: 'Burrows', spend: 'Free to spend' };

const inum = id => { const el = document.getElementById(id); return el ? num0(el.value) : 0; };
const moneyField = (id, label, v, hint) => `<div class="field"><label for="${id}">${label}</label><div class="inp"><span class="yen cs"></span><input id="${id}" type="number" inputmode="decimal" min="0" step="any" aria-describedby="tourTitle" placeholder="${hint || 'Amount'}" value="${v !== '' && v != null && +v !== 0 && isFinite(+v) ? (Number.isInteger(+v) ? +v : (+v).toFixed(2)) : ''}"></div></div>`;   /* shows what was kept, as typed: a minus balance and the cents (QC round 4 money accuracy, data safety) */
const textField = (id, label, v, max, ph) => `<div class="field"><label for="${id}">${label}</label><div class="inp"><input id="${id}" type="text" maxlength="${max || 60}" spellcheck="false" value="${esc(v)}"${ph ? ` placeholder="${esc(ph)}"` : ''}></div></div>`;
const payNow = () => setupCells(S).pay;   /* model.js setupCells: the tour's figures are worked out there */
const havePay = () => !!(S.ui.done && S.ui.done.pay) && payNow() > 0;
const necLines = () => S.plan.lines.filter(l => l.jar === 'nec');
const necTotal = () => setupCells(S).nec;
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
/* move one share to p. Only that share changes: it can take what is still not placed yet and no more, and whatever it gives up
   becomes not placed yet. The other shares never move on their own. Returns the new list and whether the move was cut short. */
function moveShare(vals, i, p, total) {
  const out = vals.slice(), others = vals.reduce((a, v, j) => a + (j === i ? 0 : v), 0), room = Math.max(0, total - others), want = Math.round(p);
  out[i] = Math.max(0, Math.min(room, want));
  return { out, hit: want > room };
}
const sumOf = a => a.reduce((x, y) => x + y, 0);
/* share the part not placed yet among the shares: by the current shares, or evenly when all are zero */
const spreadFree = (vals, total) => { const free = total - sumOf(vals); if (free <= 0) return vals.slice(); const got = lr(vals.some(v => v > 0) ? vals : vals.map(() => 1), free); return vals.map((v, k) => v + got[k]); };

/* ----- the typed numbers: pay, other income and the balance on one screen. Skipped once statements gave the pay. ----- */
const STEP_MONEY = { id: 'money', part: PART.money, setup: true, focus: '#tourPay', title: 'Your money', skipIf: () => importApplied() && havePay(),
  body: () => {
    const pay = S.ui.done && S.ui.done.pay ? val(S, 'a', START) : '';
    return `<p>Your take-home pay is what you get each month after tax, and if you're paid twice a month add both. Other pay is a second job, a partner&rsquo;s share or benefits. Balance is your bank accounts plus cash and a rough number is fine.</p>
    <div class="tour-fields">${moneyField('tourPay', 'Monthly take-home pay', pay, 'All paychecks')}${moneyField('tourExtra', 'Other pay each month <span class="opt">(optional)</span>', val(S, 'b', START), 'None')}${moneyField('tourBank', 'Balance now', S.cfg.bankStart !== undefined ? S.cfg.bankStart : '', 'Rough is fine. Overdrawn? Type a minus').replace('<input ', '<input data-neg="ok" ').replace(' inputmode="decimal" min="0"', ' inputmode="text"')}</div>
    <p class="cap">If you're not sure leave it blank and add it later on Plan</p>`;
  },
  leave: () => {
    const pay = $('#tourPay'), extra = $('#tourExtra'), bank = $('#tourBank'); if (!pay) return;
    if (pay.value !== '' || tourTouched) { const v = num0(pay.value); setVal(S, 'a', START, v, 'after'); if (v > 0) markDone('pay'); }
    if (extra && (extra.value !== '' || tourTouched || S.steps.b)) setVal(S, 'b', START, num0(extra.value), 'after');
    if (bank && bank.value !== '' && isFinite(+bank.value)) { const nb = clampBank(bank.value, S); if (nb !== S.cfg.bankStart || !S.cfg.bankAt) setBankBalance(S, nb); }   /* the date moves only when the balance is typed, not when setup is walked again */
    if (S.cfg.planFrom === undefined && nowYm() > START) S.cfg.planFrom = nowYm();   /* the plan starts in the month of setup (QC round 4 money accuracy B1) */
    if (S.cfg.minBank === undefined && payNow() > 0) { S.cfg.minBank = toUnit(payNow() * 0.1); S.ui.minAuto = S.cfg.minBank; } /* the safety line: a tenth of pay unless Settings says otherwise */
    persist();
  } };

/* ----- bills: tick the ones you pay, then one screen for each ----- */
const BILLS_ON = ['rent', 'util', 'food', 'net', 'phone', 'gas'];
/* The first setup is short: pay, rent and food, one goal. Everything else is asked for later, one card at a time (Next on Home). A longer setup is one tap away on the Currency screen. */
const quickSetup = () => !(S.ui && S.ui.full === true);
const BILLS_QUICK = ['rent', 'food'];
const BILL_Q = { rent: 'Rent or mortgage', util: 'Utilities', food: 'Food and groceries', net: 'Internet', phone: 'Phone', ins: 'Insurance', subs: 'Subscriptions', gas: 'Transport', loan: 'Loan or debt payment', card: 'Credit card' };
const BILL_NOTE = {
  rent: () => 'Put the full amount even if someone shares it. Their share counts as pay, so tap Back and add it to Other pay each month on the Your money step',
  util: () => 'Electricity, gas and water',
  food: () => 'Groceries and everyday meals. Eating out for fun isn\'t a bill: it comes out of Free to spend, your money for fun',
  net: () => 'Home internet, or your data plan if that\'s how you get online',
  phone: () => 'Your monthly plan, or what you usually spend on top-ups',
  ins: () => 'Health, life, car or home. Put in what it costs a month.' + (S.ui.cur === '₱' ? ' If you\'re self-employed include your own SSS, PhilHealth and Pag-IBIG too.' : ''),
  gas: () => 'Commute, ' + (S.ui.cur === '₱' ? 'Grab' : 'taxis') + ', fuel, parking, tolls.',
};
/* a line that was added with "add another" belongs to the kind it was copied from */
const baseOf = id => moreKind(id) || id;
function chosenBills() {
  const all = necLines(), ids = all.map(l => l.id), sb = Array.isArray(S.ui.sb) ? S.ui.sb.filter(id => ids.indexOf(id) >= 0 && !moreKind(id)) : null;
  const base = sb || (quickSetup() ? BILLS_QUICK : BILLS_ON).filter(id => ids.indexOf(id) >= 0), out = [];
  base.forEach(id => { out.push(id); all.forEach(l => { if (moreKind(l.id) === id) out.push(l.id); }); });
  return out;
}
const STEP_BILLS = { id: 'bills-pick', part: PART.bills, setup: true, pick: true, skipIf: () => importApplied(), title: 'Monthly bills',
  body: () => {
    const on = chosenBills();
    return `<p>A few are ticked to get you started. Tick the ones you pay and untick the ones you don't. You type a rough amount for each one next.</p>
    <div class="tour-chips two" role="group" aria-label="Your monthly bills">${necLines().filter(l => !moreKind(l.id)).map(l => `<label class="chip multi${on.indexOf(l.id) >= 0 ? ' on' : ''}"><input type="checkbox" name="tourBill" value="${esc(l.id)}"${on.indexOf(l.id) >= 0 ? ' checked' : ''}><span>${esc(l.name)}</span></label>`).join('')}</div>
    <p class="cap">If one's missing you can add lines later</p>`;
  },
  leave: d => {
    if (d <= 0) return;
    const ids = $$('#tourBody input[name=tourBill]:checked').map(i => i.value).filter(id => lineById(S, id));
    S.ui.sb = ids;
    if (quickSetup() && !S.ui.gset) applyGoalPick(['rainy'], false); /* the short setup keeps the emergency fund only; more goals come later */
    const keep = necLines().filter(l => ids.indexOf(baseOf(l.id)) >= 0).map(l => l.id);
    /* the sample amounts are not yours: every line starts empty, and what you type replaces it */
    necLines().forEach(l => { if (keep.indexOf(l.id) < 0 || !S.steps[l.key]) setVal(S, l.key, START, 0, 'after'); });
    /* ticking is not entering: the bills count as done once an amount is typed, or every bill screen has been passed (no bills ticked counts too) */
    if (!ids.length) markDone('bills');
    persist();
  } };
const billStep = id => ({ id: 'bill-' + id, part: PART.bills, setup: true, focus: baseOf(id) === 'subs' ? '' : '#tourAmt',
  title: () => { const l = lineById(S, id); if (!l) return ''; const mk = moreKind(id); return mk ? MORE_KINDS[mk].title : (BILL_Q[id] || `${esc(l.name)}`); },
  body: () => {
    const l = lineById(S, id); if (!l) return '';
    const b = baseOf(id), mk = moreKind(id), named = mk || b === 'loan', note = BILL_NOTE[b];
    if (b === 'loan') return loanBody(l, mk) + moreBtn('loan');
    if (b === 'subs') {
      const m = subsModel(val(S, l.key, START));
      return `<p>Tick each one and put in what it costs a month. The grey line is a typical price so you can check yours against it.</p>
      ${subsRows(m)}
      <p class="subs-h"><b>Something else</b></p>
      <p class="cap">If it's not in the list add a name and amount</p>
      <div id="subsOthers">${m.O.map(subOtherRow).join('')}</div>
      <div class="row-btns"><button type="button" class="btn small more" id="subsAddO"${m.O.length >= SUB_MAX_O ? ' hidden' : ''}>${m.O.length ? 'Add another' : 'Add something else'}</button></div>
      <div class="tour-fields subs-total">${moneyField('tourAmt', 'Total each month', subsSum(m)).replace('<input ', '<input readonly tabindex="-1" ')}</div>
      <p class="cap">Typical prices from Nov 2026 and each grey line names its country. Yours depends on your plan and billing, so go by your own bill.</p>`;
    }
    if (b === 'card') {
      /* one plain question; the statement arithmetic is there for those who only know the statement total */
      const saved = val(S, l.key, START), c = cardModel(saved), calc = c.b > 0;
      return `<p>What you put on the card each month apart from the bills you already listed, like shopping, eating out or online orders. A rough number is fine.</p>
      <p class="cap" data-card-full>Pay the card off in full every month? You can leave this at 0 and tap Next. What's on the card right now goes on Home once setup is done: tap Add a card you pay in full there and Home shows your bank after the cards are paid.</p>
      <div class="tour-fields">${moneyField('tourAmt', 'Card spending, each month', saved)}</div>
      <details class="src-how"${calc ? ' open' : ''}><summary>I only know the statement total</summary><div class="src-how-in">
        <p class="cap">Enter the statement total, then the part of it that is bills you already listed, like rent, food or subscriptions. The rest is card spending.</p>
        <div class="tour-fields">${moneyField('tourCardT', 'Statement total, each month', calc ? c.t : '')}${moneyField('tourCardB', 'Of that, bills already listed', calc ? c.b : '', 'Optional')}</div>
        <div class="row-btns"><span class="cap" id="cardCap" aria-live="polite"></span><button type="button" class="btn small solid" id="cardUse" hidden>Use this amount</button></div>
      </div></details>
      <p class="cap">A card is paid a month late, so this month you pay last month's bill. You can add that bill as a one-time cost for this month once setup is done. The amount above is what you expect to put on the card from now on.</p>
      <p class="cap">If you have no credit card go back and untick it. If you carry a balance from month to month, add it under Cards and loans once setup is done.</p>
      <p class="cap" data-card-later>You do both of those after setup, so there's nothing more to type here. One-time costs is on the Plan tab under Month: it's for things you pay once. Cards and loans is on the Plan tab under Burrows: it's for a balance you carry from month to month.</p>`;
    }
    return `${note ? `<p>${esc(note())}</p>` : ''}
    <div class="tour-fields">${named ? textField('tourLName', 'Name', l.name) : ''}${moneyField('tourAmt', 'Each month', val(S, l.key, START))}</div>${b === 'ins' ? moreBtn('ins') : ''}`;
  },
  leave: d => {
    const l = lineById(S, id); if (!l) return;
    if (baseOf(id) === 'loan') { loanLeave(l); persist(); return; }
    if (baseOf(id) === 'card') cardLeave(d); /* before the amount is read: a filled calculator with an empty amount box counts when the person moves on */
    setVal(S, l.key, START, inum('tourAmt'), 'after'); if (inum('tourAmt') > 0) markDone('bills');
    const nm = $('#tourLName'); if (nm && nm.value.trim()) updateLine(S, id, { name: nm.value });
    if (baseOf(id) === 'subs') subsLeave();
    persist();
  } });
const moreBtn = kind => `<div class="row-btns"><button type="button" class="btn small more" data-more="${kind}">${MORE_KINDS[kind].add}</button></div>`;

/* ----- where the rest of the pay goes: the five other jars share what the bills leave ----- */
const JAR5 = ['lts', 'play', 'edu', 'ffa', 'give'];
const JAR_LABEL = { lts: 'Goal burrows', play: 'Free to spend', edu: 'Education', ffa: 'Investing', give: 'Giving' };
/* one plain line under each of the five on the split step, so no name is met unexplained (H1 walk, finding 3) */
const JAR_WHAT = { lts: 'Saving for your goals, like the emergency fund or a trip', play: 'Yours for fun, spend it on whatever you want', edu: 'Books, courses, anything that teaches you a skill', ffa: 'Money you invest and leave to grow', give: 'Gifts and donations' };
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
/* what the bills leave, shared by the five jars by their shares; the part not given out stays not placed yet (it shows as left over) */
const jarMoneyList = weights => shareMoney(jarRest > 0 ? round2((payNow() - necTotal()) * sumOf(weights) / jarRest) : 0, weights, 1);
const jarMoneyOf = pct => (jarRest > 0 ? round2((payNow() - necTotal()) * pct / jarRest) : 0);
const jarMoney = i => jarMoneyList(jarVals)[i];
const potHTML = (id, cols, vals, total) => `<div class="pot" id="${id}" aria-hidden="true">${cols.map((c, i) => `<i style="background:${c};flex-grow:${Math.max(vals[i], 0.0001)}"></i>`).join('')}<i class="free" style="flex-grow:${Math.max(total - sumOf(vals), 0.0001)}"></i></div>`;
/* the line under the pot: how much is not placed yet, with Spread it and Give it to */
const poolHTML = (kind, names) => `<div class="pool" id="${kind}Pool" aria-live="polite"><span class="pool-t"></span><span class="pool-acts"><button type="button" class="link" data-spread="${kind}">Spread it</button><label class="pool-give">Give it to <select class="inp sm" data-give="${kind}" aria-label="Give what's not placed yet to one of these"><option value="">…</option>${names.map((n, i) => `<option value="${i}">${esc(n)}</option>`).join('')}</select></label></span></div>`;
function jarRows() {
  return JAR5.map((j, i) => `<div class="split-row" data-jrow="${i}"><div class="split-h"><i class="dot" style="--c:${JARVAR[j]}"></i><b>${JAR_LABEL[j]}</b><span class="dlt"></span>${pctPill('jpct', i, JAR_LABEL[j], jarRest)}</div><p class="cap split-d">${JAR_WHAT[j]}</p><p class="split-m"></p>
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
  if (!(payNow() > 0)) { noRoom(); persist(); return; }   /* no pay: no made-up amounts in Free to spend, Education, Investing, Giving or the goals (QC round 4 money accuracy B2) */
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
/* after the goals are picked or sized: with no goal money in the split, every goal saves nothing for now. With exactly one goal the whole
   Long-Term Savings jar goes to it (the split screen opens only for two or more), capped by what it still needs, so the setup's own
   defaults never plan more than the pay allows. */
function settleGoals() {
  /* no pay at all (not even a sample): nothing can go to a goal, or the plan would save money that is not there (38.31 money accuracy round 3) */
  if (!havePay()) { if (!(payNow() > 0)) S.plan.goals.forEach(g => setVal(S, 'goal:' + g.id, START, 0, 'after')); return; }
  const B = ltsBudget();
  if (!(B > 0)) { S.plan.goals.forEach(g => setVal(S, 'goal:' + g.id, START, 0, 'after')); return; }
  if (S.plan.goals.length === 1) { const g = S.plan.goals[0]; setVal(S, 'goal:' + g.id, START, Math.min(B, goalRoom(g)), 'after'); }
}
const STEP_JARS = { id: 'jars', part: PART.jars, setup: true, when: havePay,
  title: 'Split the rest',
  body: () => {
    jarInit(); const pay = payNow(), nec = necTotal();
    if (nec <= 0) return `<p>You haven't listed any bills, so the other five places would share all of your pay. If that's not right go back and add your bills.</p>
    <p class="cap">If you really have none, carry on and split it below</p>${jarSplitHTML()}`;
    if (jarRest <= 0) return `<p>Bills <b>${fmt2(nec)}</b>, pay <b>${fmt2(pay)}</b>. ${nec > pay ? `Bills are <b>${fmt2(setupCells(S).billsOverPay)}</b> more than your pay, so` : 'Bills take all of it, so'} nothing is left for the other five places, so no Free to spend and nothing for burrows for now.</p>
    <p>You can still add burrows next and they start filling once your bills are lower than your pay. Go back if you want to lower a bill now, or carry on and change it under Plan later.</p>`;
    return `<p>Bills and basics take <b>${fmt2(nec)}</b>, <b>${jarNec}%</b> of pay. The other <b>${jarRest}%</b> (${fmt2(setupCells(S).payOverBills)}) is yours to split between the five places below, and it starts at the usual shares.</p>
    ${jarsFold()}${jarSplitHTML()}`;
  },
  after: () => { if (jarRest > 0) paintJars(); },
  leave: () => { commitJars(); markDone('bills'); } }; /* past the bills: whatever was typed for them is the person's own */
/* the six jars in short, folded: pay is split into jars and each jar has one purpose */
const jarsFold = () => `<details class="src-how"><summary>Where your pay goes, in short</summary><div class="src-how-in">
    <p>Every month your pay gets split into six places and each one has one job. Bills and basics and Free to spend are for this month. Your goals, Education, Giving and Investing fill <b>burrows</b> that pile up over months. Free to spend is yours to spend on whatever you want. Usual shares of take-home pay:</p>
    <ul class="jar-lines">${JARS.map(j => `<li><i class="dot" style="--c:${JARVAR[j.id]}"></i><span><b>${esc(j.name)}</b> ${j.usualPct}%. ${esc(JAR_LINES[j.id])}</span></li>`).join('')}</ul>
    <p class="cap">These shares are a starting point, change them to fit you</p></div></details>`;
const jarSplitHTML = () => `<p class="cap" id="jarCan" data-split-can>These shares are only a start. Drag a slider or tap a percent to change it, and you can change them again later under Plan.</p>
    ${potHTML('jarPot', JAR5.map(j => JARVAR[j]), jarVals, jarRest)}${poolHTML('jar', JAR5.map(j => JAR_LABEL[j]))}
    <div class="split" id="jarSplit">${jarRows()}</div>
    <p class="why" id="jarWhy" aria-live="polite"></p>
    <div class="row-btns"><button type="button" class="link" id="jarReset">Use the usual amounts</button></div>`;

/* ----- goals: tick what you are saving for, then one screen for each ----- */
const GOAL_KINDS = [
  { k: 'rainy', id: 'rainy', name: 'Emergency fund', slot: 7, em: true, pick: 'Emergency fund', hint: 'Money for surprises', title: 'Emergency fund' },
  { k: 'travel', id: 'travel', name: 'Trip', slot: 5, pick: 'A trip', hint: 'Flights, stay, food', title: 'Trip', cost: 'Flights, stay, food.' },
  { k: 'moving', id: 'moving', name: 'Home or move', slot: 4, pick: 'A home or a move', hint: 'Deposit, movers, furniture', title: 'Home or move', cost: 'Deposit, movers, furniture.' },
  { k: 'buy', id: 'buy', name: 'Big purchase', slot: 1, pick: 'A big purchase', hint: 'Laptop, car, wedding', title: 'Big purchase', cost: 'The price, or your best guess.' },
  { k: 'car', id: 'car', name: 'Yearly cost', slot: 6, pick: 'A yearly cost', hint: 'Insurance, taxes, holidays', title: 'Yearly cost', cost: 'Full amount for the year, not per month.' },
  { k: 'debt', id: 'debt', name: 'Pay off debt', slot: 3, debt: true, pick: 'Pay off a debt', hint: 'A balance with no interest', title: 'Pay off debt', cost: 'What you still owe in total. For a card or loan with interest, use Add card or loan under Cards and loans on Plan, Burrows instead.' },
  { k: 'other', id: 'other', name: 'Something else', slot: 2, pick: 'Something else', hint: 'Anything with a price', title: 'Goal', cost: '' },
];
const STEP_TOOLPICK = { id: 'goals-pick', part: PART.goals, setup: true, pick: true, skipIf: () => quickSetup(), title: 'Burrows', art: 'sprout',
  body: () => `<p>Burrows hold money you build up for something, like a trip or paying off a debt. Tick the ones you're working on, you can add more later.</p>
    <div class="tour-chips two" role="group" aria-label="Burrows">${GOAL_KINDS.map(k => { const on = S.ui.gset ? !!goalById(S, k.id) : k.k === 'rainy'; return `<label class="chip multi${on ? ' on' : ''}"><input type="checkbox" name="tourGoalPick" value="${k.k}"${on ? ' checked' : ''}><b>${k.pick}</b><span>${k.hint}</span></label>`; }).join('')}</div>
    <p class="cap">If you're not sure, keep the emergency fund. If you owe on a card or loan, add it after setup under Cards and loans in Plan under Burrows and it works out the interest and the payoff date.</p>`,
  leave: d => { if (d <= 0) return; applyGoalPick($$('#tourBody input[name=tourGoalPick]:checked').map(i => i.value), true); } };
function applyGoalPick(picked, mark) {
  {
    const first = !S.ui.gset, old = S.plan.goals, next = [], gk = S.ui.gk || {};
    GOAL_KINDS.forEach(k => {
      if (picked.indexOf(k.k) < 0) return;
      const ex = first ? null : goalById(S, k.id);
      if (ex) next.push(ex); else { const g = { id: k.id, name: k.name, target: 0, start: 0, due: '', slot: k.slot }; if (k.em) { g.emergency = true; g.stretch = 0; } next.push(g); }
      if (!first) old.forEach(g => { if (gk[g.id] === k.k && next.indexOf(g) < 0) next.push(g); });
    });
    if (!first) old.forEach(g => { if (!GOAL_KINDS.some(k => k.id === g.id) && !gk[g.id] && next.indexOf(g) < 0) next.push(g); });
    old.forEach(g => { if (next.indexOf(g) < 0) forgetKey(S, 'goal:' + g.id); });
    S.plan.goals = next.slice(0, MAX_GOALS); S.ui.gset = true; settleGoals(); if (mark) markDone('goals'); persist();
  }
}
const EM_MONTHS = [[1, 'month'], [3, 'months'], [6, 'months']];
const emMonths = g => { const n = necTotal(); if (n <= 0 || !(g.target > 0)) return 3; const m = g.target / n; return EM_MONTHS.reduce((best, x) => Math.abs(x[0] - m) < Math.abs(best - m) ? x[0] : best, 3); };
const emCap = m => `${m} month${m === 1 ? '' : 's'} of your bills is <b>${fmt2(setupCells(S).billsFor[m])}</b>.`;
const goalStep = id => ({ id: 'goal-' + id, part: PART.goals, setup: true,
  focus: '#tourGCost, #tourGSaved',
  title: () => { const g = goalById(S, id), k = goalKindOf(id); return g ? (k ? (S.ui.gk && S.ui.gk[id] ? `Your next ${GOAL_NOUN[k.k] || 'goal'}` : k.title) : 'Your goal') : ''; },
  body: () => {
    const g = goalById(S, id); if (!g) return '';
    const k = goalKindOf(id) || {}, em = !!g.emergency && necTotal() > 0, lo = START + '-01', hi = END + '-28';
    if (em) {
      const m = emMonths(g);
      return `<p>Money for surprises, and you can borrow from it in a short month. The usual advice is three to six months of bills.</p>
      <div class="field tour-q1"><span class="l" id="tourEmL">Months of bills to cover</span>
      <div class="tour-chips" role="radiogroup" aria-labelledby="tourEmL">${EM_MONTHS.map(x => chip('tourEm', String(x[0]), String(x[0]), x[1], x[0] === m)).join('')}</div></div>
      <p class="cap" id="tourEmCap">${emCap(m)}</p>
      <div class="tour-fields">${moneyField('tourGSaved', 'Already saved', g.start)}</div><p class="cap">If this money is in the same account as the balance you typed before, tap Back to the Your money step and lower that balance by this amount, so the same money isn't counted in two places.</p>`;
    }
    const dbt = !!k.debt;
    return `<p>${g.emergency ? 'Money for surprises, and the usual advice is to hold three to six months of bills. How much do you want to hold?' : dbt ? 'Name the debt and how much you owe in total. The smallest payment you have to make stays in Bills and basics and this burrow is for the extra you pay on top, so the debt goes down faster.' : 'Give it a name, a cost, a date if there is one and why you want it'}</p>
    <div class="tour-fields">
      ${g.emergency ? '' : textField('tourGName', 'Name', k.name && g.name === k.name ? '' : g.name, 60, k.name)}
      ${g.emergency ? '' : `<div class="field"><label for="tourGWhy">Why (optional)</label><div class="inp"><input id="tourGWhy" type="text" maxlength="80" spellcheck="false" value="${esc(g.why || '')}" placeholder="Why you want it"></div><p class="cap">This shows next to the goal so you keep seeing why</p></div>`}
      <div class="field">${moneyField('tourGCost', dbt ? 'Total owed' : g.emergency ? 'How much to hold' : 'Cost', g.target).replace(/^<div class="field">|<\/div>$/g, '')}${k.cost ? `<p class="cap">${k.cost}</p>` : ''}</div>
      ${moneyField('tourGSaved', dbt ? 'Already paid off' : 'Already saved', g.start)}${dbt ? '' : `<p class="cap">If this money is in the same account as the balance you typed before, tap Back to the Your money step and lower that balance by this amount, so the same money isn't counted in two places.</p>`}
      ${g.emergency ? '' : `<div class="field"><label for="tourGDue">${dbt ? 'Paid off by' : 'Needed by'}</label><input type="date" id="tourGDue" min="${lo}" max="${hi}" value="${esc(g.due)}"><p class="cap">Give it a date and the monthly amount gets worked out for you</p></div>`}
    </div>
    ${k.k && !k.em && S.plan.goals.length < MAX_GOALS ? `<div class="row-btns"><button type="button" class="btn small more" data-moreg="${esc(id)}">Add another ${GOAL_NOUN[k.k] || 'goal'}</button></div>` : ''}`;
  },
  leave: () => {
    const g = goalById(S, id); if (!g) return;
    if ($('input[name=tourEm]')) {
      const m = +($('input[name=tourEm]:checked') || { value: 3 }).value, n = necTotal();
      updateGoal(S, id, { start: inum('tourGSaved'), target: m * n, stretch: (m >= 6 ? 12 : 6) * n });
    } else {
      const nm = $('#tourGName'), du = $('#tourGDue'), wy = $('#tourGWhy');
      updateGoal(S, id, { name: nm && nm.value.trim() ? nm.value : g.name, target: inum('tourGCost'), start: inum('tourGSaved'), due: du ? du.value : g.due, why: wy ? wy.value : (g.why || '') });
    }
    settleGoals(); if (quickSetup()) markDone('goals'); persist();
  } });

/* ----- dividing the goal money: dated goals get what they need first, the rest is shared ----- */
let gsIds = [], gsPct = [], gsBudget = 0, splitC2 = null;
/* the Long-Term Savings jar's money a month, by the same arithmetic as the jars screen: whole percents of the pay the bills leave.
   The committed shares are used as they stand (a part may be left not placed yet); before any commit, the usual proportions fill the rest. */
const ltsBudget = () => {
  const rest = restPct(); if (!(rest > 0)) return 0;
  const a = aimsOf(S), mine = JAR5.map(j => Math.round(a[j] * 100));
  const vals = S.cfg.aims && sumOf(mine) > 0 && sumOf(mine) <= rest ? mine : lr(JAR5.map(j => a[j]), rest);
  return shareMoney(round2((payNow() - necTotal()) * sumOf(vals) / rest), vals, 1)[0];
};
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
  const B = gsBudget, needs = gs.map(g => (g.due && g.target > g.start ? goalDefault(S, g, planFromOf(S)) : 0)), open = gs.map(g => g.target > g.start), tn = needs.reduce((a, b) => a + b, 0);
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
function splitLine(g, C2) { return dw(S, g, splitLine0(g, C2)); }
function splitLine0(g, C2) {
  if (!(g.target > 0)) return 'No cost set.';
  const togo = setupCells(S).togo[g.id] || 0, tg = `${fmt2(togo)} to go. `, k = S.plan.goals.indexOf(g);
  if (togo <= 0) return 'Already full.';
  if (!(splitMoney(k) > 0)) return tg + 'Nothing goes into this one.';
  const gi = goalInfo(S, C2, g.id, START);
  if (gi.state === 'full') return 'Already full.';
  if (gi.state === 'paid' || gi.state === 'short') return tg + 'Date is this month or passed.';
  if (gi.state === 'ontrack') return `${tg}Full ${monthLabel(gi.reached)}, ahead of ${dateLabel(g.due)}.`;
  if (gi.state === 'behind') return gi.need != null ? `${tg}Needs about ${fmt2(gi.need)} a month for ${dateLabel(g.due)}.` : tg + 'Not ready in time.';
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
  { const u = unusedOf(), el = $('#splitUnused'); if (el) el.textContent = u > 0 ? `${fmt2(u)} of this is not placed yet because your burrows can't take any more right now. Add a burrow or raise a cost.` : ''; }
  if (S.plan.goals.length === 1) { const row = $('[data-grow="0"]'); if (row) { $('.split-m', row).textContent = fmt2(splitMoney(0)) + ' a month'; $('.split-s', row).textContent = splitNoteFor(0); } return; }
  spPaint('goal', SPLIT_SPEC.goal());
}
const STEP_SPLIT = { id: 'goalsplit', part: PART.goals, setup: true, when: () => havePay() && S.plan.goals.length > 1 && ltsBudget() > 0,
  title: () => (S.plan.goals.length > 1 ? 'Split goal money' : 'Goal money'),
  body: () => {
    splitInit(); const pct = setupCells(S).ltsPct, many = S.plan.goals.length > 1;
    return `<p>${many ? `Burrows get <b>${pct}%</b> of pay, <b>${fmt2(gsBudget)}</b> a month, shared between your goals. A goal with a date gets what it needs first. Each slider moves on its own, and what you take off one waits as not placed yet.`
      : `Burrows get <b>${pct}%</b> of pay, <b>${fmt2(gsBudget)}</b> a month. ${unusedOf() > 0 ? 'This goal is filled first.' : 'All of it goes to this goal.'}`}</p>
    ${many ? potHTML('goalPot', S.plan.goals.map(g => `var(--c${g.slot})`), gsPct, 100) + poolHTML('goal', S.plan.goals.map(g => g.name)) : ''}
    <div class="split" id="goalSplit">${splitRows()}</div>
    <p class="cap" id="splitUnused" aria-live="polite"></p>
    ${many ? '<p class="why" id="splitWhy" aria-live="polite"></p><div class="row-btns"><button type="button" class="link" id="splitReset">Reset to suggested split</button></div>' : ''}`;
  },
  after: () => paintSplit(),
  leave: () => { if (!gsIds.length || !$('#goalSplit')) return; applySplit(); markDone('goals'); persist(); } };

/* ----- the payoff: your free to spend ----- */
/* what the plan adds up to right now, in plain terms. Everything the reveal and the last screen say comes from here. */
function planFacts() { const C = calcAll(S); return Object.assign({ C }, planFactsOf(S, C, sel, havePay())); }   /* model.js planFactsOf */
const ledgerRow = (k, v, cls) => `<div${cls ? ` class="${cls}"` : ''}><dt>${k}</dt><dd>${v}</dd></div>`;
function ledgerHTML(f) {
  const rows = [ledgerRow('Pay in', fmt2(f.inc)), ledgerRow('Bills and basics', fmt2(f.bills))];
  if (f.goals > 0) rows.push(ledgerRow('Goal burrows', fmt2(f.goals)));
  if (f.other > 0) rows.push(ledgerRow('Education, Investing and Giving', fmt2(f.other)));
  rows.push(ledgerRow('Free to spend', fmt2(f.play), 'play'));
  if (f.st === 'over') rows.push(ledgerRow('Short by', fmt2(f.shortBy), 'neg')); else if (f.st === 'spare') rows.push(ledgerRow('Left, not placed yet', fmt2(f.L)));
  return `<dl class="tour-ledger">${rows.join('')}</dl>`;
}
const behindGoals = () => (tourMode === 'full' && havePay() ? S.plan.goals.filter(g => goalInfo(S, calcAll(S), g.id, START).state === 'behind') : []);
const behindText = () => {
  const b = behindGoals(); if (!b.length) return '';
  const names = b.map(g => `<b>${esc(g.name)}</b>`).join(' and ');
  return `${names} ${b.length === 1 ? 'misses its date' : 'miss their dates'} at this pace. Under Plan, Burrows you can move the date, lower the amount or give it more pay.`;
};
/* the same pixel chest used on Home and Plan, as a small picture above the figure (visual first) */
const chestImg = fill => { try { const c = document.createElement('canvas'); c.width = 24; c.height = 18; BUR.LOOKS.room.paint(c.getContext('2d'), fill, 'play', 3); return `<img class="tour-chest" alt="" aria-hidden="true" width="96" height="72" src="${c.toDataURL()}">`; } catch (e) { return ''; } };
const STEP_REVEAL = { id: 'reveal', part: PART.spend, art: 'branch',
  title: () => { const f = planFacts(); return f.st === 'over' ? 'Plan exceeds pay' : f.play > 0 ? 'Free to spend' : 'Free to spend'; },
  show: () => { if (tourMode === 'full' && S.ui.done && S.ui.done.pay && S.ui.done.bills && S.ui.done.goals) { S.ui.setup = true; persist(); } },
  /* no pay: the split step is skipped, so the sample amounts would stay in Free to spend, Education, Investing, Giving and the goals next to
     the person's own bills. Every place but the bills is 0 until pay is added (QC round 4 money accuracy B2) */
  leave: () => { if (!(payNow() > 0)) { noRoom(); persist(); } },
  body: () => {
    const f = planFacts(), play = f.play, wk = weekOf(play), seg = (cls, v) => (v > 0 ? `<div class="seg-b ${cls}" style="flex-grow:${v}"></div>` : '');
    /* no sample money in setup sentences (LAUNCH_CHECKLIST D2): with no pay there is no figure to show yet, only what to do */
    if (f.st === 'nopay') return `${chestImg(0.2)}
      <p>Free to spend is money for fun, it's what's left after bills and burrows. There's no number yet because it needs your pay to work it out.</p>
      <p>Tap Back to type your pay, or add it later under Plan, Month, Details, Money in.</p>`;
    if (f.st === 'over') return `<div class="tour-reveal neg"><b>${fmt2(f.shortBy)}</b><span>short a month</span></div>
      <p>The plan spends <b>${fmt2(f.J.out)}</b> and your pay is <b>${fmt2(f.inc)}</b>.${play > 0 ? '' : ' Nothing is left, so no Free to spend yet.'}</p>
      ${ledgerHTML(f)}
      <p>Under Plan you can lower a bill or add more pay.${play > 0 ? '' : ' Free to spend shows up as soon as there\'s room.'}</p>`;
    const rest = f.J.rest;
    const bar = `${chestImg(play > 0 ? 0.75 : 0.1)}<div class="tour-fig"><div class="bar tour-bar" role="img" aria-label="Where your pay goes">${f.J.list.map(j => seg(JARCLS[j.id], j.v)).join('')}${seg('rest', rest)}</div>
      <div class="legend">${f.J.list.map(j => (j.v > 0 ? `<span><i class="${JARCLS[j.id]}"></i>${j.name} ${pctSay(j.pct, j.v)}</span>` : '')).join('')}${rest > 0 ? `<span><i class="rest"></i>Left ${f.J.restPct}%</span>` : ''}</div></div>`;
    const big = `<div class="tour-reveal"><b>${fmt2(play)}</b><span>a month${play > 0 ? `, about ${fmtAbout(wk)} a week` : ''}</span></div>`;
    if (play <= 0) {
      const all = f.billPct >= 0.95;
      return `${big}<p>${all ? `Bills take <b>${pctSay(f.J.list[0].pct, f.J.list[0].v)}</b> of pay, so almost nothing is left for Free to spend.` : 'Nothing is set aside for Free to spend.'} About 10% of pay is a common amount to keep for it.</p>
      ${bar}<p>${behindText() || 'To add some, raise the Free to spend line under Plan or lower a bill.'}</p>`;
    }
    const msg = behindText() || (f.st === 'spare' ? `<b>${fmt2(f.L)}</b> of pay is not placed yet. Raise a goal or add it to Free to spend.` : f.billPct >= 0.9 ? 'Bills take most of your pay so the month is tight, and lowering a bill is the easiest fix.' : 'All pay is placed.');
    return `${big}<p>Bills are paid and every other place has its share, so this is yours to spend on whatever you want. Split of ${fmt2(f.inc)} pay:</p>
    ${bar}<p>${msg}</p>`;
  } };
