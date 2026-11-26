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
   the parts from the engine (the check and its day, what was logged out and in since), so a figure that moved never
   says "checked today". [C13, M51] The parts are written as the sum that ends with the big figure above (the engine's
   bank), in the way Home writes its other sums, so it never reads as two figures for the bank. One way of writing
   cents for the line (money.js formatter); the signs are written, nothing is worked out here. */
function bankParts3(a, yr) {
  /* [M36] a figure dated after this device's day (another device a day ahead): its day only, never a negative age */
  if (!a.loggedIn && !a.loggedOut) return a.ageDays < 0 ? `checked on ${esc3(day3(a.asOf, yr))}` : `${ageWords3(a.ageDays)}, on ${esc3(day3(a.asOf, yr))}`;
  const f = fmt3(a.currency, [a.checked, a.loggedOut, a.loggedIn, a.bank]);
  return esc3(`${f(a.checked)} (checked ${day3(a.asOf, yr)})${a.loggedOut ? ` ${SM.MINUS} ${f(a.loggedOut)} (out, logged since)` : ''}${a.loggedIn ? ` + ${f(a.loggedIn)} (in, logged since)` : ''} = ${f(a.bank)}`);
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
/* [slice 6, G4] on a pay day whose pay covers what leaves that day, the sum is only "bank today": the engine's todayParts
   show the pay and what it covers as their own steps, ending at the bank at the end of today (todayEnd) */
function todayWords3(a, id) {
  if (!a.todayParts) return '';
  const parts = [{ label: E3.nameOf(id) + ' today', amount: a.whyParts[0].amount }].concat(a.todayParts);
  return `<p class="a3-sum" data-fig="today">Today: ${esc3(sum3(parts, a.todayEnd, a.currency))} at the end of the day. Safe to spend counts on this pay coming in today</p>`;
}
/* the engine's sum, from its parts, written by screens/money.js: one minus sign, no "- 0 (minimum)" (numbers review S4) */
function whyWords3(a) { return sum3(a.whyParts, a.headroom, a.currency); }
/* the one next pay on Home is res.period.nextPay, named by the day it lands after the weekend rule [BI4b]: the engine
   gives that day for the item in its lists (next pay, may still go through, not seen yet, the check-in list) */
function nextPay3(r) {
  const p = r.period, np = r.daysToNextPay || {};
  if (!p || !p.nextPay) return null;
  const counted = np.item === p.nextPay.occ, occ = p.nextPay.occ;
  const listed = [].concat(r.mayStillPost || [], (r.notSeenYet || {}).items || [], (r.checkIn || {}).toConfirm || []).find(o => o.item === occ);
  return { state: p.nextPay.state, day: counted ? np.next_pay : listed ? listed.lands : p.nextPay.due, days: counted ? np.days : null };
}
/* [NORTH_STAR, BK1, BK3] what each bank holds after its cards are paid: the engine's dated figure (res.bankAfterCards),
   with what is in it (a pay), what is not (a late pay), goals kept in it, close days not sure, and a dip before its day;
   said once, in the cards box, never as safe to spend */
function afterCards3(r, yr, today) {
  const m = r.bankAfterCards || {};
  const days = list => esc3(SN.dayList(list, list.some(d => d.slice(0, 4) !== yr)));
  /* [C10] a card day that is today is written "today": an overdue payment is taken today (BK1), whatever day it was due */
  const paid = list => { const rest = list.filter(d => d !== today); return rest.length === list.length ? `on ${days(list)}` : `today${rest.length ? ` and on ${days(rest)}` : ''}`; };
  return Object.keys(m).map(id => {
    const x = m[id], f = fmt3(x.currency, [x.amount].concat(x.setAside.map(g => g.amount), x.dip ? [x.dip.amount] : []));
    const notIn = [...new Set(x.paysNotCounted.map(p => p.due))];
    const lateCards = x.cardDays.includes(today) && x.cards.some(c => ((r.cards[c] || {}).overdue || []).length);
    const notes = [lateCards ? 'The overdue card payments are counted as going out today' : '', x.pays.length ? `Your pay on ${days(x.pays)} is in it` : '', notIn.length ? `The pay due ${days(notIn)} is not counted, it has not come in` : '',
      /* [LISTFIX B4] whole sentences: what the figure assumes for the cards, and that bills due by then are taken off */
      x.ifAllTaken ? 'It counts everything on the cards now, as their close days are not sure' : '', x.billsTaken ? 'Bills due by then are taken off' : '', ...x.setAside.map(g => `${esc3(f(g.amount))} of it is set aside for ${esc3(g.name)}`),
      'This is the bank, not safe to spend'].filter(Boolean).join('. ');
    const dip = x.dip ? `<br><span class="a3-late" data-fig="aftercards-dip">Before then it goes ${esc3(f(x.dip.amount))} below zero on ${esc3(day3(x.dip.day, yr))}</span>` : '';
    return `<li data-fig="aftercards" data-acct="${esc3(id)}" data-day="${esc3(x.day)}"><span>${esc3(label3('bankAfterCards'))} ${paid(x.cardDays)}: ${esc3(E3.nameOf(id))}<br><span class="when">${notes}</span>${dip}</span><span class="amt">${fig3('bankAfterCards.*.amount', x.amount, x.currency)}</span></li>`;
  }).join('');
}
/* money coming in (a pay) or going out, by the schedule an item belongs to (a lookup) */
const isIncome3 = item => (E3.book.schedules || []).some(s => s.kind === 'income' && s.id === BurrowEngine.ids.scheduleOf(item));
/* the safe to spend heading, by that pay's state: a late or not seen pay is not counted until it is ticked [BH1, BH3] */
function safeUntil3(r, yr, home) {
  /* [slice 6, B4] no fixed pay: no next pay to run to; the walk looks ahead at the bills to come and the plan by the day */
  if (!r.period) return ' with no fixed pay';
  const n = nextPay3(r);
  if (!n) return ' for now';
  const d = esc3(day3(n.day, yr));
  if (n.state === 'notSeen') return `, not counting the ${d} pay (not seen yet)`;
  if (n.state === 'late') return `, not counting the ${d} pay yet (late)`;
  /* [S1] on its day the pay is counted (G4), so safe to spend runs to the pay after it: the engine's safeToSpend.until */
  /* [BV2.13, M37] today's pay counted but not seen in the bank yet (on the check-in list, not ticked): said in plain
     words with the engine's own amount for it */
  const np = r.daysToNextPay || {}, notIn = np.days === 0 && !r.safeToSpend.notCounting && ((r.checkIn || {}).toConfirm || []).find(o => o.item === np.item);
  const notInWords = notIn ? `, includes today's pay of ${esc3(money3(notIn.amount, home))}, not in your bank yet` : '';
  /* [CA8] on the morning of pay day, before the pay is ticked, today is still the old period's last day: the engine says
     the figure runs to today's pay (safeToSpend.untilPay is today's own pay), and the heading says so */
  if (n.days === 0 && r.safeToSpend.untilPay && r.safeToSpend.untilPay === np.item) return ` until today's pay is in`;
  /* [qc-numbers run 1 B5, coordinator 17's ruling (a)] pay-day morning, today's pay not ticked (the period running now
     still ends with it) and Free to spend left caps safe to spend: the figure is the old period's Free to spend left, so
     the heading names the old period until the pay is ticked */
  if (n.days === 0 && r.safeToSpend.cappedByFreeToSpend && r.period.end >= np.next_pay) return ` until today's pay is in`;
  /* [C8, M51] "next pay" on this screen is today's pay (the period card), so this one is named "the pay after today's" */
  if (n.days === 0 && r.safeToSpend.until) return ` until the pay after today's, on ${esc3(day3(r.safeToSpend.until, yr))}${r.safeToSpend.notCounting ? ', not counting today\'s pay (not in at your check today)' : ''}${notInWords}`;
  return ` until next pay on ${d}${notInWords}`;
}
/* [LISTFIX B2, I4, BP2] right after setup, Free to spend counts only its share for the days left in the period, and it
   caps safe to spend: Home says why the figure is small, with the full amount and when it counts (the engine's counts
   and amount, as Plan's "Why only part?") */
function freeShare3(r, home) {
  const f = r.period && r.period.free;
  if (!r.safeToSpend.cappedByFreeToSpend || !f || f.counts == null || !(f.counts < f.amount)) return '';
  const fm = fmt3(home, [f.counts, f.amount]);
  return `<div class="a3-helprow" data-fig="freeshare"><span class="a3-sub">Free to spend counts ${esc3(fm(f.counts))} of ${esc3(fm(f.amount))} this pay period, because you started partway through it. The full ${esc3(fm(f.amount))} counts from your next pay</span>${HELP3.button('lineShare')}${HELP3.text('lineShare')}</div>`;
}
/* [slice 6, B4] with no fixed pay: how long the money lasts at this rate (the engine's lastsAboutWeeks, from bills and the
   plan by the day; it looks a year ahead) */
function lastsWords3(r) {
  const n = r.period ? null : r.lastsAboutWeeks;
  if (n == null) return '';
  const words = n >= 52 ? 'Lasts a year or more at this rate' : n === 0 ? 'Lasts less than a week at this rate' : `${label3('lastsAbout')} ${n} ${n === 1 ? 'week' : 'weeks'} at this rate`;
  return `<p class="a3-sub" data-fig="lasts" data-weeks="${esc3(n)}">${esc3(words)}</p>`;
}
function nextPayWords3(r, yr) {
  const n = nextPay3(r);
  if (!n && !r.period) return `<p class="a3-sub">No fixed pay. Log money as it comes in, on Receipts</p>`;
  if (!n) return `<p class="a3-sub">No pay day set</p>`;
  const d = esc3(day3(n.day, yr));
  if (n.state === 'notSeen') return `<p class="a3-warn" data-fig="nextpay" data-state="notSeen">Pay due ${d} has not been seen yet. Check your bank when it lands</p>`;
  if (n.state === 'late') return `<p class="a3-warn" data-fig="nextpay" data-state="late">Pay due ${d} is late. Check your bank when it lands</p>`;
  /* on pay day the engine counts today's pay, so it gives no day count to the one after: the day alone, never "in null days" */
  return `<p class="a3-sub" data-fig="nextpay" data-state="coming">${esc3(label3('nextPay'))} ${d}${n.days == null ? '' : `, ${dueWords3(n.days)}`}</p>`;
}
function renderHome3() { screen3(drawHome3); }
function drawHome3() {
  const host = $('#a3Home');
  if (!E3.book) {
    host.removeAttribute('data-origin');
    /* [AI first, new foundation 12] before setup the assistant is the whole first screen (chat3.js), with the same ways in */
    if (typeof renderWelcome3 === 'function' && typeof CHAT3C === 'object') renderWelcome3(host);
    else host.innerHTML = `<section class="a3-card" data-card="first"><h2>Welcome to the burrow</h2><p class="a3-sub">Put in what your bank shows today, your pay, your cards and your bills. Or look around first with made-up numbers shaped like a real month</p>
      <div class="a3-actions"><button type="button" class="a3-btn solid" id="a3SetupGo">Set up with your own numbers</button><button type="button" class="a3-btn" id="a3TryGo">See it with made-up numbers first</button><button type="button" class="a3-btn" id="a3OtherGo">I already use the burrow on another device</button></div></section>`;
    /* one door to setup on the screens: with answers given in the chat, the boxes are filled from them (chat3Screens) */
    $('#a3SetupGo').addEventListener('click', () => (typeof chat3Screens === 'function' ? chat3Screens() : openSetup3()));
    $('#a3TryGo').addEventListener('click', () => { E3.useTry('mako'); tryBand3(); renderHome3(); if (typeof renderChat3 === 'function') renderChat3(); });
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
  if (origin !== 'sample') out.push(`<section class="a3-card a3-status" data-card="status" data-level="${esc3(st.level)}">${helpHead3(`<h2>${esc3(st.text.state)}</h2>`, 'status')}<p class="a3-sub">${esc3(st.text.reason)}</p>${st.state === 'plan_over' ? `<p class="a3-next" data-fig="status-next">${esc3(st.text.next)}</p>` : ''}${st.state === 'no_free' ? `<div class="a3-actions"><button type="button" class="a3-btn solid" id="a3FreeGo">${esc3(st.text.next)}</button></div>` : ''}</section>`);
  /* the cloud copy's one status (cloud3_page.js cloudStatus3): one plain line, only when it is not in step */
  const cloudLine = origin !== 'sample' && typeof cloudHome3 === 'function' ? cloudHome3() : '';
  /* [M20; qc-data-safety B3] something was changed on two devices: asked here too, until it is answered in Settings */
  const choose = origin !== 'sample' && typeof cloudChoose3 === 'function' ? cloudChoose3() : 0;
  if (choose) out.push(`<p class="a3-warn" data-cloud="choose">${choose === 1 ? 'Something was changed on two devices. Choose which to keep' : choose + ' things were changed on two devices. Choose which to keep'} <button type="button" class="a3-btn" data-cloudchoose>Choose</button></p>`);
  if (cloudLine) out.push(`<p class="a3-warn" data-cloud="home">${esc3(cloudLine)}</p>`);
  /* bank today, one figure per account, with its age */
  for (const id of ids) {
    const a = r.accounts[id];
    out.push(`<section class="a3-card" data-card="bank" data-acct="${esc3(id)}"><h2>${esc3(label3('bankToday'))}: ${esc3(E3.nameOf(id))}</h2>
      <p class="a3-big" data-fig="bank">${fig3('accounts.*.bank', a.bank, a.currency)}</p>
      <p class="a3-sub" data-fig="age">${bankParts3(a, yr)}</p></section>`);
  }
  /* safe to spend until next pay, with the sum behind it */
  const until = safeUntil3(r, yr, home);
  /* [BJ5] when Free to spend caps the headline, the engine's sum ends with the cap, so the two figures agree */
  /* [S6] Free to spend over: that part says by how much (the engine's `over`), so the sum never hides the overspend */
  /* [BM3] each part names its own amount: a cap that takes everything (the headline is 0) says "all of it" */
  /* the words of each part live in screens/status.js capParts: the assistant is sent the same sum */
  const capParts = BurrowScreens.status.capParts(r, x => money3(x, home));
  const capLine = capParts ? `<p class="a3-sum" data-fig="cap">${esc3(sum3(capParts, r.safeToSpend.headline, home))}</p>${freeShare3(r, home)}` : '';
  /* [C2] when Free to spend left caps the headline, one plain line right under the figure says why it is what it is, with
     the engine's two figures (what the accounts can spare, whyParts[0], and the headline): cause, then the figure, joined as one thought (VOICE B13) */
  const capSay = (() => {
    const s = r.safeToSpend, w = s.whyParts;
    if (!s.cappedByFreeToSpend || !w || !w.length || !(w[0].amount > 0)) return '';   // nothing to spare: the short line says it
    const f = fmt3(home, [w[0].amount, s.headline]);
    const words = s.headline === 0 ? `Your accounts can spare ${f(w[0].amount)}, but your Free to spend is used up this period, so nothing is safe to spend`
      : `Your accounts can spare ${f(w[0].amount)}, but only ${f(s.headline)} of your Free to spend is left this period, so ${f(s.headline)} is safe to spend`;
    return `<p class="a3-next" data-fig="capsay">${esc3(words)}</p>`;
  })();
  /* [C3] when short, the short line's own sum is the one sum for that account: the same sum is never printed twice */
  const shortId = r.safeToSpend.short && r.accounts[r.safeToSpend.short.account] && r.accounts[r.safeToSpend.short.account].real ? r.safeToSpend.short.account : null;
  const sums = `${ids.filter(id => r.accounts[id].spendFrom && id !== shortId).map(id => `<p class="a3-sum" data-fig="why">${esc3(whyWords3(r.accounts[id]))}</p>${todayWords3(r.accounts[id], id)}`).join('')}${capLine}`;
  /* [BL3] short: the sum's own total, before the pay after its lowest point (only when one brings money), and the first
     day the bank goes under beside it */
  const sh = r.safeToSpend.short;
  /* [BM2] the short is the real money's (no goals, no plan lines): its own sum sits under it and ends with the same figure */
  const shA = sh && r.accounts[sh.account] && r.accounts[sh.account].real;
  /* [C3, M47] short is a plain amber line (a3-warn), never red */
  const short = sh ? `<p class="a3-warn" data-fig="short">${esc3(label3('shortBy'))} ${fig3('safeToSpend.short', sh.amount, home)}${sh.beforePay ? ` before the pay on ${esc3(day3(sh.beforePay, yr))}` : ''}, below ${sh.minimum ? 'your minimum' : 'zero'} from ${esc3(day3(sh.day, yr))}</p>`
    + (shA ? `<p class="a3-sum" data-fig="shortwhy">${esc3(sum3(shA.whyParts, shA.headroom, r.accounts[sh.account].currency))}</p>` : '') : '';
  /* the engine's warnings are data (account, amount, day, minimum or none): worded by screens/status.js, never its text;
     a lower point after the first day under is its own "Later on" line with its own day [B1] */
  const wctx = { currency: home, names, accounts: r.accounts };
  const warns = (r.warnings || []).map(w => `<p class="a3-warn" data-warn="${esc3(w.code)}">${esc3(BurrowScreens.status.warningText(w, wctx))}</p>`
    + (w.later ? `<p class="a3-warn" data-warn="later_low">${esc3(BurrowScreens.status.laterLowText(w, wctx))}</p>` : '')
    + (BurrowScreens.status.moveText(w, wctx) ? `<p class="a3-next" data-fig="move-from">${esc3(BurrowScreens.status.moveText(w, wctx))}</p>` : '')).join('');
  out.push(`<section class="a3-card" data-card="safe">${helpHead3(`<h2>${esc3(label3('safeToSpend'))}${until}</h2>`, 'safeToSpend')}
    <p class="a3-big" data-fig="safe">${fig3('safeToSpend.headline', r.safeToSpend.headline, home)}</p>${capSay}${short}${sums}${lastsWords3(r)}${warns}</section>`);
  /* the period by its dates, and the next pay */
  const p = r.period;
  const per = p && p.start && p.end ? `<p class="a3-mid" data-fig="period" data-start="${esc3(p.start)}" data-end="${esc3(p.end)}">${esc3(period3(p))}</p>` : '';
  /* [NS-FIX 5] when the next pay lands on another day than it is due (a weekend or a holiday), the help says so */
  const np3 = nextPay3(r), moved = np3 && p && p.nextPay && np3.day !== p.nextPay.due ? { due: day3(p.nextPay.due, yr), landed: day3(np3.day, yr) } : null;
  out.push(`<section class="a3-card" data-card="period">${helpHead3(`<h2>${esc3(label3('period'))}</h2>`, moved ? ['period', 'periodMoved'] : 'period', moved)}${per}${nextPayWords3(r, yr)}</section>`);
  /* due before next pay, by account */
  const due = r.dueBeforeNextPay;
  const byAcct = Object.keys(due.byAccount).map(acct => `<p class="a3-acct">From ${esc3(E3.nameOf(acct))}</p><ul class="a3-rows">${rowsHtml3(due.items.filter(o => o.account === acct), E3.curOf(acct), yr, 'dueBeforeNextPay.items')}</ul>`).join('');
  /* [F13] with no fixed pay, "due" is the next 30 days */
  const dueName = label3('dueBeforeNextPay', { noFixedPay: !r.period });
  /* the late card and loan payments (the engine's overdue lists): listed once, in the overdue card [C10] */
  const odSeen = new Set([].concat(...[r.cards, r.owed || {}].map(m => [].concat(...Object.keys(m).map(id => (m[id].overdue || []).map(o => o.item))))));
  /* [C11] bills past their day and not ticked: the sum takes them off today (", late"), so they are listed here too, under
     their own heading and after "Together" (the engine's total is of what is still to come). Home never says "nothing is
     due" while the sum takes one off. Late card payments are in the overdue card, so the empty line says "nothing else" */
  const lateOut = [].concat((r.notSeenYet.items || []).filter(o => o.direction === 'out').map(o => [o, 'notSeenYet.items']), (r.mayStillPost || []).filter(o => !isIncome3(o.item)).map(o => [o, 'mayStillPost']))
    .filter(([o]) => !odSeen.has(o.item)).sort((a, b) => (a[0].lands < b[0].lands ? -1 : a[0].lands > b[0].lands ? 1 : 0));
  const lateHtml = lateOut.length ? `<div data-fig="duelate"><p class="a3-acct">Late, not ticked off yet</p><p class="a3-sub">Safe to spend takes these off today</p><ul class="a3-rows">${lateOut.map(([o, path]) => `<li><span>${esc3(E3.occName(o.item))}<br><span class="when">${esc3(day3(o.lands, yr))}, late</span></span><span class="amt">${fig3(path, o.amount, o.currency || home)}</span></li>`).join('')}</ul></div>` : '';
  const dueNone = lateOut.length ? '' : `<p class="a3-sub">${odSeen.size ? 'Nothing else' : 'Nothing'} is due ${r.period ? 'before next pay' : 'in the next 30 days'}</p>`;
  out.push(`<section class="a3-card" data-card="due"><h2>${esc3(dueName)}</h2>${due.items.length ? byAcct + `<ul class="a3-rows"><li class="total"><span>Together</span><span class="amt" data-fig="duetotal">${fig3('dueBeforeNextPay.total', due.total, home)}</span></li></ul>` : dueNone}${lateHtml}</section>`);
  /* overdue card and loan payments: past their day and not ticked, never dropped from the page [F4, H8, BF2] (plan lane).
     [C10] It sits right above the cards box and is the one place a late payment is listed: the same payment is left out of
     "May still go through" and "Not seen yet" (its state, late or not seen, is in its words here) */
  const od = [].concat(...[['cards', r.cards], ['owed', r.owed || {}]].map(([k, m]) => Object.keys(m).map(id => (m[id].overdue || []).map(o =>
    `<li data-fig="overdue" data-owed="${esc3(id)}" data-state="${esc3(o.state)}"><span>${esc3(E3.nameOf(id))}<br><span class="when">${overdueWords3(o, E3.curOf(id), yr, k + '.*.overdue.*.amount')}</span></span></li>`))));
  const odItems = [].concat(...[].concat(...od));   // one list of the overdue items (od is per account, then per card)
  if (odItems.length) out.push(`<section class="a3-card" data-card="overdue"><h2>Card and loan payments overdue</h2><ul class="a3-rows">${odItems.join('')}</ul></section>`);
  /* each card, and the bank after the cards are paid */
  const cardIds = Object.keys(r.cards), land = payLands3(r);
  {
    const rows = cardIds.map(id => {
      const k = r.cards[id], cur = E3.curOf(id), nx = k.next;
      const what = nx && nx.amount && nx.amount !== k.owedNow ? `${fig3('cards.*.next.amount', nx.amount, cur)} comes out` : 'Comes out';
      /* [numbers review S2, C10] a payment past its day and not ticked is never "Nothing to pay yet": the line points to
         the overdue card above, the one place the payment is listed */
      const od = (k.overdue || [])[0];
      const when = nx && nx.amount ? `${what} on ${esc3(day3(nx.payment_date, yr))}${besidePay3(nx.payment_date, land, yr)}`
        : od ? 'A payment is overdue, see above' : 'Nothing to pay yet';
      /* [BL5] paid more than it owed: in credit by the engine's figure, never as owed with a minus */
      const amt = k.credit ? `<span data-fig="credit">${esc3(label3('inCredit').toLowerCase())} ${fig3('cards.*.credit', k.credit, cur)}</span>` : `<span data-fig="owed">${fig3('cards.*.owedNow', k.owedNow, cur)}</span>`;
      /* [NS-FIX 7] the day this card's figure was last typed */
      const ck = E3.lastCheckOf(id, day), seen = ck ? `<br><span class="a3-age" data-fig="cardchecked">checked ${esc3(day3(ck.date, yr))}</span>` : '';
      return `<li data-cardid="${esc3(id)}"><span>${esc3(E3.nameOf(id))}<br><span class="when">${when}</span>${seen}</span><span class="amt">${amt}</span></li>`;
    }).join('');
    /* [north star F3] Add a card opens Plan's own add-card form (planOpen3), never a second form */
    out.push(`<section class="a3-card" data-card="cards"><h2>${esc3(label3('owed'))} on your cards</h2>${cardIds.length ? `<ul class="a3-rows">${rows}${afterCards3(r, yr, day)}</ul>` : '<p class="a3-sub">No cards yet</p>'}<div class="a3-actions"><button type="button" class="a3-btn" id="a3AddCardGo">Add a card</button></div></section>`);
  }
  /* [north star F2] goals: one row each, what is set aside and its target (the engine's places); a tap opens it on Plan */
  const goals = ((E3.book && E3.book.places) || []).filter(g => g && !g.gone && g.kind === 'goal' && r.places && r.places[g.id]);
  if (goals.length) out.push(`<section class="a3-card" data-card="goals"><h2>Goals</h2><ul class="a3-rows">${goals.map(g => `<li><button type="button" class="a3-rcrow" data-homegoal="${esc3(g.id)}"><span>${esc3(g.name)}</span><span class="amt"><span data-fig="goal-kept">${fig3('places.*.kept', r.places[g.id].kept, g.cur || home)}</span> of ${fig3('places.*.target', g.target, g.cur || home)}</span></button></li>`).join('')}</ul></section>`);
  /* [BI4a] what may still go through: inside its posting window, so safe to spend still takes it off (a pay is not counted) */
  const may = (r.mayStillPost || []).filter(o => !odSeen.has(o.item));
  if (may.length) out.push(`<section class="a3-card" data-card="maystill"><h2>${esc3(label3('mayStillPost'))}</h2><p class="a3-sub">Due and not ticked off yet, but it can still be on its way. Safe to spend counts what goes out, not what comes in</p><ul class="a3-rows">${may.map(o => `<li><span>${esc3(E3.occName(o.item))}<br><span class="when">${esc3(day3(o.lands, yr))}${isIncome3(o.item) ? ', coming in' : ''}</span></span><span class="amt">${fig3('mayStillPost', o.amount, o.currency || home)}</span></li>`).join('')}</ul></section>`);
  /* not seen yet, and later on */
  const late = r.notSeenYet.items.filter(o => !odSeen.has(o.item));
  if (late.length) out.push(`<section class="a3-card" data-card="notseen"><h2>${esc3(label3('notSeenYet'))}</h2><p class="a3-sub">These were due and are not ticked off. Check your bank to tick them</p><ul class="a3-rows">${rowsHtml3(late, home, yr, 'notSeenYet.items')}</ul></section>`);
  for (const l of r.laterOn) out.push(`<p class="a3-warn" data-warn="later">${esc3(BurrowScreens.status.laterText(l, wctx))}</p>`);
  out.push(`<div class="a3-actions"><button type="button" class="a3-btn solid" id="a3CheckGo">Check your bank</button><button type="button" class="a3-btn" id="a3LogGo">Log a spend</button></div>`);
  host.setAttribute('data-origin', origin);
  host.innerHTML = out.join('');
  HELP3.bind(host);
  /* every figure carries where it came from: a sample screen shows only sample values; the person's bank figure is typed, the rest worked out */
  const P = BurrowScreens.provenance;
  host.querySelectorAll('[data-figure]').forEach(el => P.stamp(el, P.mark(Number(el.dataset.amt), origin === 'sample' ? 'sample' : el.dataset.figure === 'accounts.*.bank' ? 'typed' : 'worked')));
  /* [north star F1] no Free to spend yet: the prompt opens Plan's own Set Free to spend form */
  host.querySelectorAll('[data-homegoal]').forEach(el => el.addEventListener('click', () => planOpen3('goal', el.dataset.homegoal)));
  host.querySelectorAll('[data-cloudchoose]').forEach(el => el.addEventListener('click', () => { if (typeof openSet3 === 'function') openSet3(); }));
  $('#a3AddCardGo').addEventListener('click', () => planOpen3('card'));
  if ($('#a3FreeGo')) $('#a3FreeGo').addEventListener('click', () => planOpen3('free'));
  $('#a3CheckGo').addEventListener('click', openCheck3);
  $('#a3LogGo').addEventListener('click', rcLogFromHome3);
}
