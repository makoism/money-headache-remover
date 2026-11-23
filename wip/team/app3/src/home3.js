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
  const p = r.period, np = r.daysToNextPay || {};
  return p && p.nextPay && p.nextPay.state !== 'notSeen' && np.item === p.nextPay.occ ? np.next_pay : null;
}
/* where a card payment falls beside the pay: the same day, the day before, or earlier (dates compared, no money) */
function besidePay3(day, land, yr) {
  if (!land) return '';
  if (day === land) return ', the day your pay lands';
  if (day < land) return E3.dayBefore(day, land) ? ', the day before your pay lands' : `, before your pay lands on ${esc3(day3(land, yr))}`;
  return '';
}
function nextPayWords3(r, yr) {
  const np = r.daysToNextPay || {}, p = r.period, st = p && p.nextPay ? p.nextPay.state : null;
  if (!np.next_pay) return `<p class="a3-sub">No pay day set</p>`;
  const d = esc3(day3(np.next_pay, yr));
  if (st === 'notSeen') return `<p class="a3-warn" data-fig="nextpay" data-state="notSeen">Pay due ${esc3(day3(p.nextPay.due, yr))} has not been seen yet. Check your bank when it lands</p>`;
  if (st === 'late' || np.late) return `<p class="a3-warn" data-fig="nextpay" data-state="late">Pay due ${d} is late</p>`;
  return `<p class="a3-sub" data-fig="nextpay" data-state="coming">${esc3(label3('nextPay'))} ${d}, ${dueWords3(np.days)}</p>`;
}
function renderHome3() {
  const host = $('#a3Home');
  if (!E3.book) {
    host.removeAttribute('data-origin');
    host.innerHTML = `<section class="a3-card"><h2>Nothing here yet</h2><p class="a3-sub">This page is the new money engine. Setup comes next. To look around with made-up numbers shaped like a real month, open <a href="?try=mako">the try book</a></p></section>`;
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
  /* the one status */
  const names = {}; for (const id of ids.concat(Object.keys(r.cards))) names[id] = E3.nameOf(id);
  const st = BurrowScreens.status.statusOf(r, { currency: home, origin, names });
  out.push(`<section class="a3-card a3-status" data-card="status" data-level="${esc3(st.level)}"><h2>${esc3(st.text.state)}</h2><p class="a3-sub">${esc3(st.text.reason)}</p></section>`);
  /* bank today, one figure per account, with its age */
  for (const id of ids) {
    const a = r.accounts[id];
    out.push(`<section class="a3-card" data-card="bank" data-acct="${esc3(id)}"><h2>${esc3(label3('bankToday'))}: ${esc3(E3.nameOf(id))}</h2>
      <p class="a3-big" data-fig="bank">${fig3('accounts.*.bank', a.bank, a.currency)}</p>
      <p class="a3-sub" data-fig="age">${ageWords3(a.ageDays)}, on ${esc3(day3(a.asOf, yr))}</p></section>`);
  }
  /* safe to spend until next pay, with the sum behind it */
  const np = r.daysToNextPay || {};
  const until = np.next_pay ? `until next pay on ${esc3(day3(np.next_pay, yr))}` : 'for now';
  const sums = ids.filter(id => r.accounts[id].spendFrom).map(id => `<p class="a3-sum" data-fig="why">${esc3(r.accounts[id].why)}</p>`).join('');
  const short = r.safeToSpend.shortfall ? `<p class="a3-warn a3-bad">${esc3(label3('shortBy'))} ${fig3('safeToSpend.shortfall', r.safeToSpend.shortfall, home)} before then</p>` : '';
  const warns = (r.warnings || []).map(w => `<p class="a3-warn" data-warn="${esc3(w.code)}">${esc3(w.text)}</p>`).join('');
  out.push(`<section class="a3-card" data-card="safe"><h2>${esc3(label3('safeToSpend'))} ${until}</h2>
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
      const when = nx && nx.amount ? `${what} on ${esc3(day3(nx.payment_date, yr))}${besidePay3(nx.payment_date, land, yr)}` : 'Nothing to pay yet';
      return `<li data-cardid="${esc3(id)}"><span>${esc3(E3.nameOf(id))}<br><span class="when">${when}</span></span><span class="amt" data-fig="owed">${fig3('cards.*.owedNow', k.owedNow, cur)}</span></li>`;
    }).join('');
    out.push(`<section class="a3-card" data-card="cards"><h2>${esc3(label3('owed'))} on your cards</h2><ul class="a3-rows">${rows}</ul></section>`);
  }
  /* not seen yet, and later on */
  const late = r.notSeenYet.items;
  if (late.length) out.push(`<section class="a3-card" data-card="notseen"><h2>${esc3(label3('notSeenYet'))}</h2><p class="a3-sub">These were due and are not ticked off. Check your bank to tick them</p><ul class="a3-rows">${rowsHtml3(late, home, yr, 'notSeenYet.items')}</ul></section>`);
  for (const l of r.laterOn) out.push(`<p class="a3-warn" data-warn="later">${esc3(l.text)}</p>`);
  out.push(`<div class="a3-actions"><button type="button" class="a3-btn solid" id="a3CheckGo">Check your bank</button></div>`);
  out.push('<p class="a3-later">Coming next: your plan, receipts and burrows</p>');
  host.setAttribute('data-origin', origin);
  host.innerHTML = out.join('');
  /* every figure carries where it came from: a sample screen shows only sample values; the person's bank figure is typed, the rest worked out */
  const P = BurrowScreens.provenance;
  host.querySelectorAll('[data-figure]').forEach(el => P.stamp(el, P.mark(Number(el.dataset.amt), origin === 'sample' ? 'sample' : el.dataset.figure === 'accounts.*.bank' ? 'typed' : 'worked')));
  $('#a3CheckGo').addEventListener('click', openCheck3);
}
