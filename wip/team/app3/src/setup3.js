/* ---------- Setup, short (WIRING_PLAN 1.1 item 1, step 10; DECISIONS_ROUND2 BE: the only way in for a person's own money) ----------
   One screen: what the bank shows today, the country (chosen, its weekends and holidays), other accounts (a second
   bank, cash, an e-wallet) [slice 6], pay (how often: a day each month, two days, every week or every n weeks, or no
   fixed pay; a second income with its own days and account), the cards (what is on each now, its payment day, its
   close day or "not sure", the bank that pays it), what goes on food and everyday things each pay period (Free to
   spend, blank allowed), the bills (each month or once a year, the account they leave), and the minimum (M1: blank
   means none). Every default is the one-bank, pay-on-a-day shape, so Mako's answers give the same book as before.
   Save turns the answers into a book through engine/build_book.js and keeps it through the store. Nothing is worked out
   here. The words are drafts for Mako's copy pass. */
let setup3 = null;
function dayOptions3(sel, extra) {
  const out = [];
  for (let i = 1; i <= 31; i++) out.push(`<option value="${i}"${String(i) === String(sel) ? ' selected' : ''}>${i}</option>`);
  return out.concat((extra || []).map(([v, t]) => `<option value="${v}"${v === sel ? ' selected' : ''}>${t}</option>`)).join('');
}
const SHIFT3 = {
  pay: [['before', 'the working day before'], ['after', 'the working day after']],
  out: [['after', 'the working day after'], ['before', 'the working day before']],
};
/* [slice 6] the country is chosen, not guessed: its default follows the money until the person picks one */
const COUNTRY3 = [['JP', 'Japan'], ['PH', 'The Philippines'], ['XX', 'Somewhere else (weekends only)']];
const COUNTRY_OF3 = { JPY: 'JP', PHP: 'PH' };
/* [slice 6b] a second income: every rhythm the pay has (after "On the same days as your pay") */
const EVERY2_3 = [['month', 'On a day each month'], ['days', 'On two days each month'], ['weeks1', 'Every week'], ['weeks2', 'Every 2 weeks'],
  ['weeks3', 'Every 3 weeks'], ['weeks4', 'Every 4 weeks'], ['none', 'No fixed day']];
const EVERY3 = [['month', 'On a day each month'], ['days', 'On two days each month'], ['weeks1', 'Every week'], ['weeks2', 'Every 2 weeks'],
  ['weeks3', 'Every 3 weeks'], ['weeks4', 'Every 4 weeks'], ['none', 'No fixed pay: it comes when it comes']];
const KINDS3 = [['bank', 'A bank'], ['cash', 'Cash'], ['ewallet', 'An e-wallet']];
const MONTHS3 = [['01', 'January'], ['02', 'February'], ['03', 'March'], ['04', 'April'], ['05', 'May'], ['06', 'June'], ['07', 'July'], ['08', 'August'], ['09', 'September'], ['10', 'October'], ['11', 'November'], ['12', 'December']];
const KIND_NAME3 = { bank: 'Second bank', cash: 'Cash', ewallet: 'E-wallet' };
const shiftOptions3 = (list, sel) => list.map(([v, t]) => `<option value="${v}"${v === sel ? ' selected' : ''}>${t}</option>`).join('');
function openSetup3() {
  setup3 = { pays: 1, cards: 0, bills: 0, accts: 1, countryPicked: false };
  const cur = 'JPY';
  const host = $('#a3Setup');
  host.innerHTML = `<div class="a3-sheet-in">
    <h1 id="a3SetupT">Set up with your own numbers</h1>
    <section class="a3-card"><h2>Your bank</h2>
      <div class="a3-field"><label for="s3BankName">Its name</label><input class="a3-in a3-txt" id="s3BankName" placeholder="Main bank" autocomplete="off"></div>
      <div class="a3-field"><label for="s3Bank">What does your bank show today?</label><input class="a3-in" id="s3Bank" data-amount data-money></div>
      <div class="a3-field" data-q="payToday" hidden><label for="s3PayToday">Your pay lands today. Has today's pay already landed in that figure?</label><select class="a3-in a3-sel" id="s3PayToday"><option value="">Choose</option><option value="yes">Yes, it is in it</option><option value="no">No, not yet</option></select></div>
      <div class="a3-field"><label for="s3Cur">Money in</label><select class="a3-in a3-sel" id="s3Cur"><option value="JPY" selected>Yen</option><option value="USD">US dollars</option><option value="PHP">Philippine pesos</option><option value="EUR">Euros</option></select></div>
      <div class="a3-field"><label for="s3Country">Where you bank</label><select class="a3-in a3-sel" id="s3Country" aria-describedby="s3CountryH">${COUNTRY3.map(([v, t]) => `<option value="${v}"${v === 'JP' ? ' selected' : ''}>${t}</option>`).join('')}</select>
        <p class="a3-sub" id="s3CountryH" data-hint="country">Its weekends and holidays move pay and bills to a working day</p></div>
      <div id="s3Accts"></div>
      <div class="a3-actions"><button type="button" class="a3-btn" id="s3AddAcct">Add another account: a bank, cash or an e-wallet</button></div>
    </section>
    <section class="a3-card" data-card="pay"><h2>Your pay</h2>
      <div class="a3-row3" data-row="pay1">
        <div class="a3-field"><label for="s3PayName">Called</label><input class="a3-in a3-txt" id="s3PayName" data-f="name" placeholder="Pay" autocomplete="off"></div>
        <div class="a3-field"><label for="s3PayAmt">How much lands</label><input class="a3-in" id="s3PayAmt" data-f="amount" data-amount data-money></div>
      </div>
      <div class="a3-field"><label for="s3PayEvery">How often it lands</label><select class="a3-in a3-sel" id="s3PayEvery">${EVERY3.map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}</select></div>
      <div class="a3-field" data-q="day"><label for="s3PayDay">Day of the month it lands</label><select class="a3-in a3-sel" id="s3PayDay">${dayOptions3('25')}</select></div>
      <div class="a3-field" data-q="day2" hidden><label for="s3PayDay2">And on day</label><select class="a3-in a3-sel" id="s3PayDay2">${dayOptions3('last', [['last', 'the last day']])}</select></div>
      <div class="a3-field" data-q="start" hidden><label for="s3PayStart">The day of one pay (the last one or the next one)</label><input class="a3-in a3-date" type="date" id="s3PayStart"></div>
      <div class="a3-field" data-q="shift"><label for="s3PayShift">When that day is a weekend or holiday, it lands</label><select class="a3-in a3-sel" id="s3PayShift">${shiftOptions3(SHIFT3.pay, 'before')}</select></div>
      <p class="a3-sub" data-q="none" hidden>Log money as it comes in, on Receipts. Safe to spend then looks at the next 30 days and says how long your money lasts</p>
      <div class="a3-field" data-q="acct" hidden><label for="s3PayAcct">It lands in</label><select class="a3-in a3-sel" id="s3PayAcct" data-acctsel="bank,cash,ewallet"></select></div>
      <div id="s3Pays"></div>
      <div class="a3-actions"><button type="button" class="a3-btn" id="s3AddPay">Add a second income</button></div>
    </section>
    <section class="a3-card"><h2>Everyday spending</h2>
      <div class="a3-field"><label for="s3Free">About how much do you spend on food and everyday things each pay period?</label><input class="a3-in" id="s3Free" data-amount data-money data-optional aria-describedby="s3FreeH">
        <p class="a3-sub" id="s3FreeH" data-hint="free">This is Free to spend. Safe to spend leaves room for it until each pay. Leave it blank to add it later on Plan</p></div>
    </section>
    <section class="a3-card"><h2>Your cards</h2><p class="a3-sub">Each card is paid in full from your bank. If you don't know the day its statement closes, leave it as not sure</p>
      <div id="s3Cards"></div>
      <div class="a3-actions"><button type="button" class="a3-btn" id="s3AddCard">Add a card</button></div>
    </section>
    <section class="a3-card"><h2>Your bills</h2><p class="a3-sub">Bills that leave your bank on a day each month</p>
      <div id="s3Bills"></div>
      <div class="a3-actions"><button type="button" class="a3-btn" id="s3AddBill">Add a bill</button></div>
    </section>
    <section class="a3-card"><h2>Keep at least</h2><p class="a3-sub">An amount you never want your bank to go under. Leave it blank for none</p>
      <div class="a3-field"><label for="s3Min">Keep at least</label><input class="a3-in" id="s3Min" data-amount data-money data-optional aria-describedby="s3MinH">
        <p class="a3-sub" id="s3MinH" data-hint="min">Safe to spend leaves this much in your bank as a cushion</p></div>
    </section>
    <p class="a3-err" id="a3SetupErr" role="alert"></p>
    <div class="a3-actions"><button type="button" class="a3-btn solid" id="a3SetupSave">Save and see my money</button><button type="button" class="a3-btn" id="a3SetupX">Back</button></div>
  </div>`;
  host.hidden = false; $('#a3Home').hidden = true; scrollTo(0, 0);
  host.querySelectorAll('[data-money]').forEach(el => bindMoney3(el));
  host.addEventListener('input', () => { $('#a3SetupErr').textContent = ''; });
  $('#s3AddPay').addEventListener('click', () => {
    setup3.pays++; const k = 'pay' + setup3.pays;
    $('#s3Pays').insertAdjacentHTML('beforeend', `<div class="a3-row3" data-row="${k}">
      <div class="a3-field"><label for="s3-${k}-n">Called</label><input class="a3-in a3-txt" id="s3-${k}-n" data-f="name" placeholder="Second income" autocomplete="off"></div>
      <div class="a3-field"><label for="s3-${k}-a">How much lands</label><input class="a3-in" id="s3-${k}-a" data-f="amount" data-amount data-money></div>
      <div class="a3-field"><label for="s3-${k}-e">When it lands</label><select class="a3-in a3-sel" id="s3-${k}-e" data-f="every"><option value="same">On the same days as your pay</option>${EVERY2_3.map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}</select></div>
      <div class="a3-field" data-q="day" hidden><label for="s3-${k}-d">Day of the month it lands</label><select class="a3-in a3-sel" id="s3-${k}-d" data-f="day">${dayOptions3('5')}</select></div>
      <div class="a3-field" data-q="day2" hidden><label for="s3-${k}-d2">And on day</label><select class="a3-in a3-sel" id="s3-${k}-d2" data-f="day2">${dayOptions3('20', [['last', 'the last day']])}</select></div>
      <div class="a3-field" data-q="start" hidden><label for="s3-${k}-st">The day of one of them (the last one or the next one)</label><input class="a3-in a3-date" type="date" id="s3-${k}-st" data-f="start"></div>
      <div class="a3-field" data-q="acct" hidden><label for="s3-${k}-ac">It lands in</label><select class="a3-in a3-sel" id="s3-${k}-ac" data-f="acct" data-acctsel="bank,cash,ewallet"></select></div></div>`);
    bindMoney3($(`#s3-${k}-a`));
    $('#s3AddPay').hidden = true;
    shape3();
  });
  $('#s3AddCard').addEventListener('click', () => {
    setup3.cards++; const k = 'card' + setup3.cards;
    $('#s3Cards').insertAdjacentHTML('beforeend', `<div class="a3-group" data-row="${k}">
      <div class="a3-row3"><div class="a3-field"><label for="s3-${k}-n">Called</label><input class="a3-in a3-txt" id="s3-${k}-n" data-f="name" placeholder="Card" autocomplete="off"></div>
      <div class="a3-field"><label for="s3-${k}-o">On it now</label><input class="a3-in" id="s3-${k}-o" data-f="owed" data-amount data-money></div></div>
      <div class="a3-field"><label for="s3-${k}-p">Day of the month it is paid from your bank</label><select class="a3-in a3-sel" id="s3-${k}-p" data-f="payDay">${dayOptions3('10')}</select></div>
      <div class="a3-field" data-q="acct" hidden><label for="s3-${k}-pf">Paid from</label><select class="a3-in a3-sel" id="s3-${k}-pf" data-f="payFrom" data-acctsel="bank"></select></div>
      <div class="a3-field"><label for="s3-${k}-s">When that day is a weekend or holiday, it comes out</label><select class="a3-in a3-sel" id="s3-${k}-s" data-f="shift">${shiftOptions3(SHIFT3.out, 'after')}</select></div>
      <div class="a3-field"><label for="s3-${k}-c">Day its statement closes</label><select class="a3-in a3-sel" id="s3-${k}-c" data-f="closeDay" aria-describedby="s3-${k}-ch">${dayOptions3('not sure', [['last', 'the last day'], ['not sure', 'not sure']])}</select>
        <p class="a3-sub" id="s3-${k}-ch" data-hint="closeDay">Spends after this day go on the next payment</p></div>
      <div class="a3-field" data-q="stmt" hidden><label for="s3-${k}-st">How much of it was on the statement that closed?</label><input class="a3-in" id="s3-${k}-st" data-f="statement" data-amount data-money data-optional aria-describedby="s3-${k}-sth">
        <p class="a3-sub" id="s3-${k}-sth" data-hint="stmt"></p></div></div>`);
    bindMoney3($(`#s3-${k}-o`)); bindMoney3($(`#s3-${k}-st`));
    shape3(); askTaken3();
  });
  $('#s3AddBill').addEventListener('click', () => {
    setup3.bills++; const k = 'bill' + setup3.bills;
    $('#s3Bills').insertAdjacentHTML('beforeend', `<div class="a3-group" data-row="${k}"><div class="a3-row3">
      <div class="a3-field"><label for="s3-${k}-n">Called</label><input class="a3-in a3-txt" id="s3-${k}-n" data-f="name" placeholder="Bill" autocomplete="off"></div>
      <div class="a3-field"><label for="s3-${k}-a">Amount</label><input class="a3-in" id="s3-${k}-a" data-f="amount" data-amount data-money></div></div>
      <div class="a3-field"><label for="s3-${k}-e">How often</label><select class="a3-in a3-sel" id="s3-${k}-e" data-f="every"><option value="month">Each month</option><option value="year">Once a year</option></select></div>
      <div class="a3-field" data-q="month" hidden><label for="s3-${k}-m">Month it leaves</label><select class="a3-in a3-sel" id="s3-${k}-m" data-f="month">${MONTHS3.map(([v, m]) => `<option value="${v}">${m}</option>`).join('')}</select></div>
      <div class="a3-field"><label for="s3-${k}-d">Day of the month it leaves</label><select class="a3-in a3-sel" id="s3-${k}-d" data-f="day">${dayOptions3('27')}</select></div>
      <div class="a3-field" data-q="acct" hidden><label for="s3-${k}-f">Leaves from</label><select class="a3-in a3-sel" id="s3-${k}-f" data-f="from" data-acctsel="bank,cash,ewallet"></select></div>
      <div class="a3-field" data-q="takenOut" hidden><label for="s3-${k}-t">Did it leave your bank?</label><select class="a3-in a3-sel" id="s3-${k}-t" data-f="takenOut"><option value="yes" selected>Yes</option><option value="no">No, not yet</option></select></div></div>`);
    bindMoney3($(`#s3-${k}-a`));
    shape3(); askTaken3();
  });
  /* [slice 6] another account: a second bank, cash or an e-wallet, with what it holds today */
  $('#s3AddAcct').addEventListener('click', () => {
    setup3.accts++; const k = 'acct' + setup3.accts;
    $('#s3Accts').insertAdjacentHTML('beforeend', `<div class="a3-group" data-row="${k}"><div class="a3-row3">
      <div class="a3-field"><label for="s3-${k}-n">Called</label><input class="a3-in a3-txt" id="s3-${k}-n" data-f="name" placeholder="Cash, an e-wallet, a second bank" autocomplete="off"></div>
      <div class="a3-field"><label for="s3-${k}-a">What it holds today</label><input class="a3-in" id="s3-${k}-a" data-f="amount" data-amount data-money></div></div>
      <div class="a3-field"><label for="s3-${k}-t">What it is</label><select class="a3-in a3-sel" id="s3-${k}-t" data-f="type">${KINDS3.map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}</select></div></div>`);
    bindMoney3($(`#s3-${k}-a`));
    shape3();
  });
  $('#s3Cur').addEventListener('change', () => { if (!setup3.countryPicked) $('#s3Country').value = COUNTRY_OF3[$('#s3Cur').value] || 'XX'; });
  $('#s3Country').addEventListener('change', () => { setup3.countryPicked = true; });
  /* [BI3] whenever a day or an amount changes, ask again which bills were due since the last pay */
  host.addEventListener('change', () => { shape3(); askTaken3(); });
  host.addEventListener('focusout', () => { shape3(); askTaken3(); });
  $('#a3SetupX').addEventListener('click', closeSetup3);
  $('#a3SetupSave').addEventListener('click', saveSetup3);
  shape3();
  $('#s3Bank').focus();
}
/* one input behaviour (screens/inputs.js) in the chosen currency */
function bindMoney3(el) { BurrowScreens.inputs.bind(el, { kind: 'amount', get code() { return $('#s3Cur').value; }, optional: el.hasAttribute('data-optional') }); }
function closeSetup3() { $('#a3Setup').hidden = true; $('#a3Setup').innerHTML = ''; setup3 = null; $('#a3Home').hidden = false; renderHome3(); }
/* [BV1] the boxes as plain values: setup3's form shape in answers3.js (ANSWERS3, the one answers-to-book function the
   chat and "Use any AI" use too). strict: a missing or wrong amount is asked for here, on its own box (throws 'asked');
   else a box not typed is null, for the questions the day asks. */
function form3(strict) {
  const err = $('#a3SetupErr'), cur = $('#s3Cur').value;
  const ask = (el, words) => { err.textContent = words; el.focus(); throw new Error('asked'); };
  const amount = (el, words) => { const v = typed3(el.value, cur); if (v !== null || !strict) return v; return ask(el, words); };
  const maybe = (el, words) => (el.value.trim() ? amount(el, words) : null);
  const text = (el, dflt) => (el.value || '').trim() || dflt;
  const acctOf = sel => (sel && !sel.closest('[data-q=acct]').hidden && sel.value) || 'bank1';
  const dayOf = v => (v === 'last' ? 'last' : Number(v));
  const bankName = text($('#s3BankName'), 'Main bank');
  const f = { bankName, cur, country: $('#s3Country').value, bank: amount($('#s3Bank'), `Type what ${bankName} shows today`), accts: [], pays: [], cards: [], bills: [] };
  $$('#a3Setup [data-row^=acct]').forEach(row => {
    const type = row.querySelector('[data-f=type]').value, name = text(row.querySelector('[data-f=name]'), KIND_NAME3[type]);
    f.accts.push({ name, type, amount: amount(row.querySelector('[data-f=amount]'), `Type what ${name} holds today, or 0`) });
  });
  const startOf = (ev, box) => { if (!ev.startsWith('weeks')) return null; if (box.value || !strict) return box.value || null; return ask(box, 'Type the day of one pay, the last one or the next one'); };
  const every = $('#s3PayEvery').value, payName = text($('#s3PayName'), 'Pay'), payBox = $('#s3PayAmt');
  /* no fixed pay: the amount may be blank (it comes when it comes); [BL1] a fixed pay of 0 is refused in build_book's words */
  const payAmt = every === 'none' ? maybe(payBox, `Type how much ${payName} is`) : amount(payBox, `Type how much ${payName} is`);
  if (strict && every !== 'none' && payAmt === 0) ask(payBox, BurrowEngine.build.PAY_NEEDS_AMOUNT);
  f.pay = { name: payName, amount: payAmt, every, day: Number($('#s3PayDay').value), day2: dayOf($('#s3PayDay2').value), start: startOf(every, $('#s3PayStart')), shift: $('#s3PayShift').value, acct: acctOf($('#s3PayAcct')) };
  $$('#a3Setup [data-row^=pay]').slice(1).forEach(row => {
    const ev = row.querySelector('[data-f=every]').value, name = text(row.querySelector('[data-f=name]'), 'Second income'), box = row.querySelector('[data-f=amount]');
    const r = ev === 'same' ? every : ev;
    const amt = r === 'none' ? maybe(box, `Type how much ${name} is`) : amount(box, `Type how much ${name} is`);
    if (strict && r !== 'none' && amt === 0) ask(box, BurrowEngine.build.PAY_NEEDS_AMOUNT);
    f.pays.push({ name, amount: amt, every: ev, day: Number(row.querySelector('[data-f=day]').value), day2: dayOf(row.querySelector('[data-f=day2]').value), start: startOf(ev, row.querySelector('[data-f=start]')), acct: acctOf(row.querySelector('[data-f=acct]')) });
  });
  $$('#a3Setup [data-row^=card]').forEach(row => {
    const name = text(row.querySelector('[data-f=name]'), 'Card'), cd = row.querySelector('[data-f=closeDay]').value;
    /* [BL6] asked only between the close and its payment day (askTaken3 shows it); blank: all of it was on that statement */
    const q = row.querySelector('[data-q=stmt]'), st = row.querySelector('[data-f=statement]');
    f.cards.push({ name, owed: amount(row.querySelector('[data-f=owed]'), `Type what is on ${name} now, or 0`), payDay: Number(row.querySelector('[data-f=payDay]').value),
      closeDay: cd === 'not sure' || cd === 'last' ? cd : Number(cd), payFrom: acctOf(row.querySelector('[data-f=payFrom]')), shift: row.querySelector('[data-f=shift]').value,
      statement: q && !q.hidden ? maybe(st, `Type how much of ${name} was on the statement, or leave it blank`) : null });
  });
  $$('#a3Setup [data-row^=bill]').forEach(row => {
    const name = text(row.querySelector('[data-f=name]'), 'Bill'), q = row.querySelector('[data-q=takenOut]');
    f.bills.push({ name, amount: amount(row.querySelector('[data-f=amount]'), `Type the amount of ${name}`), every: row.querySelector('[data-f=every]').value,
      month: row.querySelector('[data-f=month]').value, day: Number(row.querySelector('[data-f=day]').value), from: acctOf(row.querySelector('[data-f=from]')),
      takenOut: q && !q.hidden ? row.querySelector('[data-f=takenOut]').value : 'yes' });
  });
  /* [north star F1, BJ2] Free to spend from the setup day; blank: not said (Home asks). [M1] the minimum: blank is none */
  f.free = maybe($('#s3Free'), 'Type about how much goes on everyday things, or leave it blank');
  f.min = maybe($('#s3Min'), 'Type the amount to keep at least, or leave it blank');
  /* [BV2.13] on a day the pay lands: has it already landed in that figure? asked, never assumed */
  /* (last, so every pay's own day is asked first) */
  const pt = $('#a3Setup [data-q=payToday]');
  f.payToday = pt && !pt.hidden ? $('#s3PayToday').value || (strict ? ask($('#s3PayToday'), 'Say whether today\'s pay is already in that figure') : null) : null;
  return f;
}
/* the answers (ANSWERS3's shape), from the boxes */
const answers3 = strict => ANSWERS3.fromForm(form3(strict), { day: E3.today() });
/* [slice 6] the form follows the answers: the boxes each rhythm needs, and an account choice only when there is more
   than one account of the kind it takes (banks only for a card). Options keep what was picked. */
function shape3() {
  if (!setup3) return;
  const every = $('#s3PayEvery').value, q = k => $(`#a3Setup [data-card=pay] > [data-q=${k}]`);
  q('day').hidden = !(every === 'month' || every === 'days');
  q('day2').hidden = every !== 'days';
  q('start').hidden = !every.startsWith('weeks');
  q('shift').hidden = every === 'none';
  q('none').hidden = every !== 'none';
  $$('#a3Setup [data-row^=pay] [data-f=every]').forEach(sel => {
    const row = sel.closest('[data-row]'), v = sel.value;
    row.querySelector('[data-q=day]').hidden = !(v === 'month' || v === 'days');
    row.querySelector('[data-q=day2]').hidden = v !== 'days';
    row.querySelector('[data-q=start]').hidden = !v.startsWith('weeks');
  });
  $$('#a3Setup [data-row^=bill] [data-f=every]').forEach(sel => { sel.closest('[data-row]').querySelector('[data-q=month]').hidden = sel.value !== 'year'; });
  const accts = [{ key: 'bank1', name: ($('#s3BankName').value || '').trim() || 'Main bank', type: 'bank' }]
    .concat($$('#a3Setup [data-row^=acct]').map(row => { const type = row.querySelector('[data-f=type]').value; return { key: row.dataset.row, name: (row.querySelector('[data-f=name]').value || '').trim() || KIND_NAME3[type], type }; }));
  $$('#a3Setup [data-acctsel]').forEach(sel => {
    const kinds = sel.dataset.acctsel.split(','), list = accts.filter(a => kinds.includes(a.type)), was = sel.value;
    sel.innerHTML = list.map(a => `<option value="${esc3(a.key)}"${a.key === was ? ' selected' : ''}>${esc3(a.name)}</option>`).join('');
    sel.closest('[data-q=acct]').hidden = list.length < 2;
  });
}
/* [BI3, X3, QC F3] which bills to ask whether they have left the bank, and by which day: build_book itself says
   (`asked`: each bill landing after the last pay and on or before the setup day, with its landing days). The question
   names the bill and its own day: "Did the Rent of 27 Oct leave your bank?" */
function askTaken3() {
  if (!setup3) return;
  let q = { asked: {}, statements: {}, payToday: false };
  try { q = ANSWERS3.questions(answers3(false), { day: E3.today(), currency: $('#s3Cur').value }); } catch (e) { /* not yet a whole set of answers */ }
  const yr = (E3.today() || '').slice(0, 4), key = (sec, row, dflt) => ANSWERS3.keyOf(sec, (row.querySelector('[data-f=name]').value || '').trim() || dflt);
  /* [BV2.13] the pay lands today: is it in the figure typed? */
  $('#a3Setup [data-q=payToday]').hidden = !q.payToday;
  /* [BL6] a card set up after its close and before that statement's payment day: how much was on that statement */
  $$('#a3Setup [data-row^=card]').forEach(row => {
    const el = row.querySelector('[data-q=stmt]'), g = q.statements[key('cards', row, 'Card')];
    el.hidden = !g;
    if (!g) return;
    el.querySelector('label').textContent = `How much of it was on the statement that closed on ${day3(g.closed, yr)}?`;
    el.querySelector('[data-hint=stmt]').textContent = `That part comes out on ${day3(g.payment, yr)}, the rest with a later payment. Leave it blank if you are not sure: then all of it comes out on ${day3(g.payment, yr)}`;
  });
  $$('#a3Setup [data-row^=bill]').forEach(row => {
    const el = row.querySelector('[data-q=takenOut]'), days = q.asked[key('bills', row, 'Bill')];
    el.hidden = !days;
    if (!days) return;
    const name = row.querySelector('[data-f=name]').value.trim() || 'bill';
    const when = days.map(d => day3(d, yr)), list = when.length > 1 ? when.slice(0, -1).join(', ') + ' and ' + when.slice(-1)[0] : when[0];
    el.querySelector('label').textContent = `Did the ${name} of ${list} leave your bank?`;
  });
}
async function saveSetup3() {
  const err = $('#a3SetupErr');
  let ans;
  try { ans = answers3(true); } catch (e) { if (e.message !== 'asked') err.textContent = e.message; return; }
  askTaken3();
  try { ans = answers3(true); } catch (e) { if (e.message !== 'asked') err.textContent = e.message; return; }
  let built;
  try { built = ANSWERS3.build(ans, { day: E3.today(), told: E3.told(), newId: E3.newId, currency: $('#s3Cur').value }); } catch (e) { err.textContent = e.message; return; }
  const ok = await E3.start(built.book);
  if (!ok) { err.textContent = 'This could not be saved on this device. Nothing changed'; return; }
  $('#a3Setup').hidden = true; $('#a3Setup').innerHTML = ''; setup3 = null; $('#a3Home').hidden = false;
  renderHome3(); msg3('Saved on this device');
}
