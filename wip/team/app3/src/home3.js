/* ---------- Home, the new top (WIRING_PLAN 1.1 item 2, step 7) ----------
   The one status (screens/status.js), bank today and its age, safe to spend until next pay with the sum behind it, the
   period by its dates (res.period), the one next pay (res.period.nextPay), what is due before next pay by account,
   each card and when it comes out beside the pay, not seen yet and later on. Every figure is one the engine returned for the day,
   every label comes from screens/names.js, every figure carries its typed-or-sample mark (screens/provenance.js).
   This file chooses, writes and places; it never adds, takes away or rounds (tests: no_maths.js, e3_home.js). */
function ageWords3(days) {
  if (days === 0) return 'checked today';
  if (days === 1) return 'checked yesterday';
  return 'checked ' + days + ' days ago';
}
/* [QC F4] the line under bank today: its age while it is the check itself; once something is logged after the check,
   both parts from the engine (the check and its day, what was logged out and in since), so a figure that moved never
   says "checked today". One way of writing cents for the sentence (money.js formatter). */
function bankParts3(a, yr) {
  if (!a.loggedIn && !a.loggedOut) return `${ageWords3(a.ageDays)}, on ${esc3(day3(a.asOf, yr))}`;
  const f = SM.formatter(a.currency, [a.checked, a.loggedOut, a.loggedIn]);
  const moved = [a.loggedOut ? `${f(a.loggedOut)} out` : '', a.loggedIn ? `${f(a.loggedIn)} in` : ''].filter(Boolean).join(' and ');
  return `${f(a.checked)} checked ${esc3(day3(a.asOf, yr))}, ${moved} logged since`;
}
function dueWords3(n) {
  if (n === 0) return 'today';
  if (n === 1) return 'tomorrow';
  return 'in ' + n + ' days';
}
function rowsHtml3(items, cur, yr, path) {
  return items.map(o => `<li><span>${esc3(E3.occName(o.item))}<br><span class="when">${esc3(day3(o.lands, yr))}</span></span><span class="amt">${fig3(path, o.amount, o.currency || cur)}</span></li>`).join('');
}
/* the day the next pay lands, when the engine still counts it (res.period.nextPay is the one next pay on Home) */
function payLands3(r) {
  const n = nextPay3(r);
  return n && n.state !== 'notSeen' && n.days !== null ? n.day : null;
}
/* where a card payment falls beside the pay: the same day, the day before, or earlier (dates compared, no money) */
function besidePay3(day, land, yr) {
  if (!land) return '';
  if (day === land) return ', the day your pay lands';
  if (day < land) return E3.dayBefore(day, land) ? ', the day before your pay lands' : `, before your pay lands on ${esc3(day3(land, yr))}`;
  return '';
}
/* the engine's sum, from its parts, written by screens/money.js: one minus sign, no "- 0 (minimum)" (numbers review S4) */
function whyWords3(a) { return SM.sumLine(a.whyParts, a.headroom, a.currency); }
/* the one next pay on Home is res.period.nextPay, named by the day it lands after the weekend rule [BI4b]: the engine
   gives that day for the item in its lists (next pay, may still go through, not seen yet, the check-in list) */
function nextPay3(r) {
  const p = r.period, np = r.daysToNextPay || {};
  if (!p || !p.nextPay) return null;
  const counted = np.item === p.nextPay.occ, occ = p.nextPay.occ;
  const listed = [].concat(r.mayStillPost || [], (r.notSeenYet || {}).items || [], (r.checkIn || {}).toConfirm || []).find(o => o.item === occ);
  return { state: p.nextPay.state, day: counted ? np.next_pay : listed ? listed.lands : p.nextPay.due, days: counted ? np.days : null };
}
/* money coming in (a pay) or going out, by the schedule an item belongs to (a lookup) */
const isIncome3 = item => (E3.book.schedules || []).some(s => s.kind === 'income' && s.id === BurrowEngine.ids.scheduleOf(item));
/* the safe to spend heading, by that pay's state: a late or not seen pay is not counted until it is ticked [BH1, BH3] */
function safeUntil3(r, yr) {
  const n = nextPay3(r);
  if (!n) return ' for now';
  const d = esc3(day3(n.day, yr));
  if (n.state === 'notSeen') return `, not counting the ${d} pay (not seen yet)`;
  if (n.state === 'late') return `, not counting the ${d} pay yet (late)`;
  return ` until next pay on ${d}`;
}
function nextPayWords3(r, yr) {
  const n = nextPay3(r);
  if (!n) return `<p class="a3-sub">No pay day set</p>`;
  const d = esc3(day3(n.day, yr));
  if (n.state === 'notSeen') return `<p class="a3-warn" data-fig="nextpay" data-state="notSeen">Pay due ${d} has not been seen yet. Check your bank when it lands</p>`;
  if (n.state === 'late') return `<p class="a3-warn" data-fig="nextpay" data-state="late">Pay due ${d} is late. Check your bank when it lands</p>`;
  return `<p class="a3-sub" data-fig="nextpay" data-state="coming">${esc3(label3('nextPay'))} ${d}, ${dueWords3(n.days)}</p>`;
}
function renderHome3() {
  const host = $('#a3Home');
  if (!E3.book) {
    host.removeAttribute('data-origin');
    host.innerHTML = `<section class="a3-card" data-card="first"><h2>Welcome to the burrow</h2><p class="a3-sub">Put in what your bank shows today, your pay, your cards and your bills. Or look around first with made-up numbers shaped like a real month</p>
      <div class="a3-actions"><button type="button" class="a3-btn solid" id="a3SetupGo">Set up with your own numbers</button><button type="button" class="a3-btn" id="a3TryGo">See it with made-up numbers first</button><button type="button" class="a3-btn" id="a3OtherGo">I already use the burrow on another device</button></div></section>`;
    $('#a3SetupGo').addEventListener('click', openSetup3);
    $('#a3TryGo').addEventListener('click', () => { E3.useTry('mako'); tryBand3(); renderHome3(); });
    $('#a3OtherGo').addEventListener('click', fromOther3);
    return;
  }
  const day = E3.today(), yr = day.slice(0, 4);
  let r;
  try { r = E3.view(day); } catch (e) {
    host.innerHTML = `<section class="a3-card"><h2>The numbers could not be worked out</h2><p class="a3-warn a3-bad">${esc3(e.message)}</p></section>`;
    return;
  }
  const home = E3.home(), origin = E3.mode === 'try' ? 'sample' : 'typed';
  const ids = Object.keys(r.accounts);
  const out = [];
  /* the one status; on a sample screen the yellow band already says these are made-up numbers, so no second card */
  const names = {}; for (const id of ids.concat(Object.keys(r.cards), Object.keys(r.owed || {}))) names[id] = E3.nameOf(id);
  const st = BurrowScreens.status.statusOf(r, { currency: home, origin, names });
  if (origin !== 'sample') out.push(`<section class="a3-card a3-status" data-card="status" data-level="${esc3(st.level)}"><h2>${esc3(st.text.state)}</h2><p class="a3-sub">${esc3(st.text.reason)}</p></section>`);
  /* bank today, one figure per account, with its age */
  for (const id of ids) {
    const a = r.accounts[id];
    out.push(`<section class="a3-card" data-card="bank" data-acct="${esc3(id)}"><h2>${esc3(label3('bankToday'))}: ${esc3(E3.nameOf(id))}</h2>
      <p class="a3-big" data-fig="bank">${fig3('accounts.*.bank', a.bank, a.currency)}</p>
      <p class="a3-sub" data-fig="age">${bankParts3(a, yr)}</p></section>`);
  }
  /* safe to spend until next pay, with the sum behind it */
  const until = safeUntil3(r, yr);
  /* [BJ5] when Free to spend caps the headline, the engine's sum ends with the cap, so the two figures agree */
  const capLine = r.safeToSpend.whyParts ? `<p class="a3-sum" data-fig="cap">${esc3(SM.sumLine(r.safeToSpend.whyParts, r.safeToSpend.headline, home))}</p>` : '';
  const sums = `${ids.filter(id => r.accounts[id].spendFrom).map(id => `<p class="a3-sum" data-fig="why">${esc3(whyWords3(r.accounts[id]))}</p>`).join('')}${capLine}`;
  const short = r.safeToSpend.shortfall ? `<p class="a3-warn a3-bad">${esc3(label3('shortBy'))} ${fig3('safeToSpend.shortfall', r.safeToSpend.shortfall, home)} before then</p>` : '';
  /* the engine's warnings are data (account, amount, day, minimum or none): worded by screens/status.js, never its text */
  const wctx = { currency: home, names, accounts: r.accounts };
  const warns = (r.warnings || []).map(w => `<p class="a3-warn" data-warn="${esc3(w.code)}">${esc3(BurrowScreens.status.warningText(w, wctx))}</p>`).join('');
  out.push(`<section class="a3-card" data-card="safe"><h2>${esc3(label3('safeToSpend'))}${until}</h2>
    <p class="a3-big" data-fig="safe">${fig3('safeToSpend.headline', r.safeToSpend.headline, home)}</p>${short}${sums}${warns}</section>`);
  /* the period by its dates, and the next pay */
  const p = r.period;
  const per = p && p.start && p.end ? `<p class="a3-mid" data-fig="period" data-start="${esc3(p.start)}" data-end="${esc3(p.end)}">${esc3(SN.periodLabel(p.start, p.end))}</p>` : '';
  out.push(`<section class="a3-card" data-card="period"><h2>${esc3(label3('period'))}</h2>${per}${nextPayWords3(r, yr)}</section>`);
  /* due before next pay, by account */
  const due = r.dueBeforeNextPay;
  const byAcct = Object.keys(due.byAccount).map(acct => `<p class="a3-acct">From ${esc3(E3.nameOf(acct))}</p><ul class="a3-rows">${rowsHtml3(due.items.filter(o => o.account === acct), E3.curOf(acct), yr, 'dueBeforeNextPay.items')}</ul>`).join('');
  out.push(`<section class="a3-card" data-card="due"><h2>${esc3(label3('dueBeforeNextPay'))}</h2>${due.items.length ? byAcct + `<ul class="a3-rows"><li class="total"><span>Together</span><span class="amt" data-fig="duetotal">${fig3('dueBeforeNextPay.total', due.total, home)}</span></li></ul>` : '<p class="a3-sub">Nothing is due before next pay</p>'}</section>`);
  /* each card, and the bank after the cards are paid */
  const cardIds = Object.keys(r.cards), land = payLands3(r);
  if (cardIds.length) {
    const rows = cardIds.map(id => {
      const k = r.cards[id], cur = E3.curOf(id), nx = k.next;
      const what = nx && nx.amount && nx.amount !== k.owedNow ? `${fig3('cards.*.next.amount', nx.amount, cur)} comes out` : 'Comes out';
      /* [numbers review S2] a payment past its day and not ticked is named here too, never "Nothing to pay yet" */
      const od = (k.overdue || [])[0];
      const when = nx && nx.amount ? `${what} on ${esc3(day3(nx.payment_date, yr))}${besidePay3(nx.payment_date, land, yr)}`
        : od ? `${fig3('cards.*.overdue.*.amount', od.amount, cur)} was due ${esc3(day3(od.payment_date, yr))}, not ticked off yet` : 'Nothing to pay yet';
      return `<li data-cardid="${esc3(id)}"><span>${esc3(E3.nameOf(id))}<br><span class="when">${when}</span></span><span class="amt" data-fig="owed">${fig3('cards.*.owedNow', k.owedNow, cur)}</span></li>`;
    }).join('');
    out.push(`<section class="a3-card" data-card="cards"><h2>${esc3(label3('owed'))} on your cards</h2><ul class="a3-rows">${rows}</ul></section>`);
  }
  /* overdue card and loan payments: past their day and not ticked, never dropped from the page [F4, H8, BF2] (plan lane) */
  const od = [].concat(...[['cards', r.cards], ['owed', r.owed || {}]].map(([k, m]) => Object.keys(m).map(id => (m[id].overdue || []).map(o =>
    `<li data-fig="overdue" data-owed="${esc3(id)}" data-state="${esc3(o.state)}"><span>${esc3(E3.nameOf(id))}<br><span class="when">${overdueWords3(o, E3.curOf(id), yr, k + '.*.overdue.*.amount')}</span></span></li>`))));
  const odItems = [].concat(...[].concat(...od));   // one list of the overdue items (od is per account, then per card)
  if (odItems.length) out.push(`<section class="a3-card" data-card="overdue"><h2>Card and loan payments overdue</h2><ul class="a3-rows">${odItems.join('')}</ul></section>`);
  /* [BI4a] what may still go through: inside its posting window, so safe to spend still takes it off (a pay is not counted) */
  const may = r.mayStillPost || [];
  if (may.length) out.push(`<section class="a3-card" data-card="maystill"><h2>${esc3(label3('mayStillPost'))}</h2><p class="a3-sub">Due and not ticked off yet, but it can still be on its way. Safe to spend counts what goes out, not what comes in</p><ul class="a3-rows">${may.map(o => `<li><span>${esc3(E3.occName(o.item))}<br><span class="when">${esc3(day3(o.lands, yr))}${isIncome3(o.item) ? ', coming in' : ''}</span></span><span class="amt">${fig3('mayStillPost', o.amount, o.currency || home)}</span></li>`).join('')}</ul></section>`);
  /* not seen yet, and later on */
  const late = r.notSeenYet.items;
  if (late.length) out.push(`<section class="a3-card" data-card="notseen"><h2>${esc3(label3('notSeenYet'))}</h2><p class="a3-sub">These were due and are not ticked off. Check your bank to tick them</p><ul class="a3-rows">${rowsHtml3(late, home, yr, 'notSeenYet.items')}</ul></section>`);
  for (const l of r.laterOn) out.push(`<p class="a3-warn" data-warn="later">${esc3(BurrowScreens.status.laterText(l, wctx))}</p>`);
  out.push(`<div class="a3-actions"><button type="button" class="a3-btn solid" id="a3CheckGo">Check your bank</button></div>`);
  out.push('<p class="a3-later">Coming next: burrows and the art</p>');
  host.setAttribute('data-origin', origin);
  host.innerHTML = out.join('');
  /* every figure carries where it came from: a sample screen shows only sample values; the person's bank figure is typed, the rest worked out */
  const P = BurrowScreens.provenance;
  host.querySelectorAll('[data-figure]').forEach(el => P.stamp(el, P.mark(Number(el.dataset.amt), origin === 'sample' ? 'sample' : el.dataset.figure === 'accounts.*.bank' ? 'typed' : 'worked')));
  $('#a3CheckGo').addEventListener('click', openCheck3);
}
