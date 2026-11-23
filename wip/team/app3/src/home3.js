/* ---------- Home, the new top (WIRING_PLAN 1.1 item 2, step 7) ----------
   Bank today and its age, safe to spend until next pay with the sum behind it, the period (TODO lane A: res.period),
   days to next pay, what is due before next pay by account, each card, all the money after the cards are paid,
   warnings, not seen yet and later on. Every figure is one the engine returned for the day: this file chooses, writes
   and places, it never adds, takes away or rounds (tests: app3/tests/no_maths.js, app3/tests/e3_home.js). */
function ageWords3(days) {
  if (days === 0) return 'checked today';
  if (days === 1) return 'checked yesterday';
  return 'checked ' + days + ' days ago';
}
function dueWords3(n) {
  if (n === 0) return 'today';
  if (n === 1) return 'tomorrow';
  return 'in ' + n + ' days';
}
function rowsHtml3(items, cur, yr) {
  return items.map(o => `<li><span>${esc3(E3.occName(o.item))}<br><span class="when">${esc3(day3(o.lands, yr))}</span></span><span class="amt" data-amt="${o.amount}">${money3(o.amount, o.currency || cur)}</span></li>`).join('');
}
function renderHome3() {
  const host = $('#a3Home');
  if (!E3.book) {
    host.innerHTML = `<section class="a3-card"><h2>Nothing here yet</h2><p class="a3-sub">This page is the new money engine. Setup comes next. To look around with made-up numbers shaped like a real month, open <a href="?try=mako">the try book</a>.</p></section>`;
    return;
  }
  const day = E3.today(), yr = day.slice(0, 4);
  let r;
  try { r = E3.view(day); } catch (e) {
    host.innerHTML = `<section class="a3-card"><h2>The numbers could not be worked out</h2><p class="a3-warn a3-bad">${esc3(e.message)}</p></section>`;
    return;
  }
  const home = E3.home();
  const ids = Object.keys(r.accounts);
  const out = [];
  /* bank today, one figure per account, with its age */
  for (const id of ids) {
    const a = r.accounts[id];
    out.push(`<section class="a3-card" data-card="bank" data-acct="${esc3(id)}"><h2>${esc3(E3.nameOf(id))} today</h2>
      <p class="a3-big" data-fig="bank" data-amt="${a.bank}">${money3(a.bank, a.currency)}</p>
      <p class="a3-sub" data-fig="age">${ageWords3(a.ageDays)}, on ${esc3(day3(a.asOf, yr))}</p></section>`);
  }
  /* safe to spend until next pay, with the sum behind it */
  const np = r.daysToNextPay || {};
  const until = np.next_pay ? `until next pay on ${esc3(day3(np.next_pay, yr))}` : 'for now';
  const sums = ids.filter(id => r.accounts[id].spendFrom).map(id => `<p class="a3-sum" data-fig="why">${esc3(r.accounts[id].why)}</p>`).join('');
  const short = r.safeToSpend.shortfall ? `<p class="a3-warn a3-bad" data-fig="shortfall" data-amt="${r.safeToSpend.shortfall}">Short by ${money3(r.safeToSpend.shortfall, home)} before then.</p>` : '';
  const warns = (r.warnings || []).map(w => `<p class="a3-warn" data-warn="${esc3(w.code)}">${esc3(w.text)}</p>`).join('');
  out.push(`<section class="a3-card" data-card="safe"><h2>Safe to spend ${until}</h2>
    <p class="a3-big" data-fig="safe" data-amt="${r.safeToSpend.headline}">${money3(r.safeToSpend.headline, home)}</p>${short}${sums}${warns}</section>`);
  /* the period and the next pay */
  const per = r.period && r.period.start ? `<p class="a3-mid" data-fig="period">${esc3(day3(r.period.start, yr))} to ${esc3(day3(r.period.end, yr))}</p>` : '';
  const nextLine = np.next_pay ? `<p class="a3-sub" data-fig="nextpay">Next pay ${esc3(day3(np.next_pay, yr))}, ${np.late ? 'late' : dueWords3(np.days)}</p>` : '<p class="a3-sub">No pay day set.</p>';
  out.push(`<section class="a3-card" data-card="period"><h2>This pay period</h2>${per}${nextLine}</section>`);
  /* due before next pay, by account */
  const due = r.dueBeforeNextPay;
  const byAcct = Object.keys(due.byAccount).map(acct => `<p class="a3-acct">From ${esc3(E3.nameOf(acct))}</p><ul class="a3-rows">${rowsHtml3(due.items.filter(o => o.account === acct), E3.curOf(acct), yr)}</ul>`).join('');
  out.push(`<section class="a3-card" data-card="due"><h2>Due before next pay</h2>${due.items.length ? byAcct + `<ul class="a3-rows"><li class="total"><span>Together</span><span class="amt" data-fig="duetotal" data-amt="${due.total}">${money3(due.total, home)}</span></li></ul>` : '<p class="a3-sub">Nothing is due before next pay.</p>'}</section>`);
  /* each card */
  const cardIds = Object.keys(r.cards);
  if (cardIds.length) {
    const rows = cardIds.map(id => {
      const k = r.cards[id], cur = E3.curOf(id), nx = k.next;
      const when = nx && nx.amount ? `${money3(nx.amount, cur)} leaves your bank on ${esc3(day3(nx.payment_date, yr))}` : 'Nothing to pay yet';
      return `<li data-cardid="${esc3(id)}"><span>${esc3(E3.nameOf(id))}<br><span class="when">${when}</span></span><span class="amt" data-fig="owed" data-amt="${k.owedNow}">${money3(k.owedNow, cur)}</span></li>`;
    }).join('');
    out.push(`<section class="a3-card" data-card="cards"><h2>On your cards now</h2><ul class="a3-rows">${rows}</ul>
      <p class="a3-sub">All your money after the cards are paid: <b data-fig="aftercards" data-amt="${r.total.afterCards}">${money3(r.total.afterCards, home)}</b></p></section>`);
  }
  /* not seen yet, and later on */
  const late = r.notSeenYet.items;
  if (late.length) out.push(`<section class="a3-card" data-card="notseen"><h2>Not seen yet</h2><p class="a3-sub">These were due and are not ticked off. Checking your bank comes next.</p><ul class="a3-rows">${rowsHtml3(late, home, yr)}</ul></section>`);
  for (const l of r.laterOn) out.push(`<p class="a3-warn" data-warn="later">${esc3(l.text)}</p>`);
  out.push('<p class="a3-later">Coming next: your plan, receipts and burrows.</p>');
  host.innerHTML = out.join('');
}
