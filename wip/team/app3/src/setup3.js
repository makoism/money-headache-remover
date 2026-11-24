/* ---------- Setup, short (WIRING_PLAN 1.1 item 1, step 10; DECISIONS_ROUND2 BE: the only way in for a person's own money) ----------
   One screen: what the bank shows today, the country (chosen, its weekends and holidays), other accounts (a second
   bank, cash, an e-wallet) [slice 6], pay (how often: a day each month, two days, every week or every n weeks, or no
   fixed pay; a second income with its own days and account), the cards (what is on each now, its payment day, its
   close day or "not sure", the bank that pays it), what goes on food, transport and small things each pay period (Free to
   spend, blank allowed), the bills (each month or once a year, the account they leave), and the minimum (M1: blank
   means none). Every default is the one-bank, pay-on-a-day shape, so Mako's answers give the same book as before.
   [item 14] Each section has its own Save and is held as a draft on this device until "See my money" turns the saved
   answers into a book through engine/build_book.js and keeps it through the store (the draft section below says
   how). Nothing is worked out here. The words are drafts for Mako's copy pass. */
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
/* the rows a person adds: a second income, a card, a bill, another account. Each is built here by its key (pay2,
   card1, bill3, acct2), so a row taken out can be put back with the same key, and each has its own Remove. */
const ROWS_IN3 = { pay: '#s3Pays', card: '#s3Cards', bill: '#s3Bills', acct: '#s3Accts' };
const REMOVE3 = { pay: 'Remove this income', card: 'Remove this card', bill: 'Remove this bill', acct: 'Remove this account' };
const ROW_NAME3 = { pay: 'Second income', card: 'Card', bill: 'Bill' };
const removeBtn3 = kind => `<div class="a3-actions"><button type="button" class="a3-btn" data-remove>${REMOVE3[kind]}</button></div>`;
const ROW3 = {
  pay: k => `<div class="a3-group" data-row="${k}"><div class="a3-row3">
      <div class="a3-field"><label for="s3-${k}-n">Called</label><input class="a3-in a3-txt" id="s3-${k}-n" data-f="name" placeholder="Second income" autocomplete="off"></div>
      <div class="a3-field"><label for="s3-${k}-a">How much lands each time, after tax?</label><input class="a3-in" id="s3-${k}-a" data-f="amount" data-amount data-money></div></div>
      <div class="a3-field"><label for="s3-${k}-e">When it lands</label><select class="a3-in a3-sel" id="s3-${k}-e" data-f="every"><option value="same">On the same days as your pay</option>${EVERY2_3.map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}</select></div>
      <div class="a3-field" data-q="day" hidden><label for="s3-${k}-d">Day of the month it lands</label><select class="a3-in a3-sel" id="s3-${k}-d" data-f="day">${dayOptions3('5')}</select></div>
      <div class="a3-field" data-q="day2" hidden><label for="s3-${k}-d2">And on day</label><select class="a3-in a3-sel" id="s3-${k}-d2" data-f="day2">${dayOptions3('20', [['last', 'the last day']])}</select></div>
      <div class="a3-field" data-q="start" hidden><label for="s3-${k}-st">The day of one of them (the last one or the next one)</label><input class="a3-in a3-date" type="date" id="s3-${k}-st" data-f="start"></div>
      <div class="a3-field" data-q="acct" hidden><label for="s3-${k}-ac">It lands in</label><select class="a3-in a3-sel" id="s3-${k}-ac" data-f="acct" data-acctsel="bank,cash,ewallet"></select></div>${removeBtn3('pay')}</div>`,
  card: k => `<div class="a3-group" data-row="${k}">
      <div class="a3-row3"><div class="a3-field"><label for="s3-${k}-n">Called</label><input class="a3-in a3-txt" id="s3-${k}-n" data-f="name" placeholder="Card" autocomplete="off"></div>
      <div class="a3-field"><label for="s3-${k}-o">On it now</label><input class="a3-in" id="s3-${k}-o" data-f="owed" data-amount data-money></div></div>
      <div class="a3-field"><label for="s3-${k}-p">Day of the month it is paid from your bank</label><select class="a3-in a3-sel" id="s3-${k}-p" data-f="payDay">${dayOptions3('10')}</select></div>
      <div class="a3-field" data-q="acct" hidden><label for="s3-${k}-pf">Paid from</label><select class="a3-in a3-sel" id="s3-${k}-pf" data-f="payFrom" data-acctsel="bank"></select></div>
      <div class="a3-field"><label for="s3-${k}-s">When that day is a weekend or holiday, it comes out</label><select class="a3-in a3-sel" id="s3-${k}-s" data-f="shift">${shiftOptions3(SHIFT3.out, 'after')}</select></div>
      <div class="a3-field"><label for="s3-${k}-c">Day its statement closes</label><select class="a3-in a3-sel" id="s3-${k}-c" data-f="closeDay" aria-describedby="s3-${k}-ch">${dayOptions3('not sure', [['last', 'the last day'], ['not sure', 'not sure']])}</select>
        <p class="a3-sub" id="s3-${k}-ch" data-hint="closeDay">Spends after this day go on the next payment</p></div>
      <div class="a3-field" data-q="stmt" hidden><label for="s3-${k}-st">How much of it was on the statement that closed?</label><input class="a3-in" id="s3-${k}-st" data-f="statement" data-amount data-money data-optional aria-describedby="s3-${k}-sth">
        <p class="a3-sub" id="s3-${k}-sth" data-hint="stmt"></p></div>${removeBtn3('card')}</div>`,
  bill: k => `<div class="a3-group" data-row="${k}"><div class="a3-row3">
      <div class="a3-field"><label for="s3-${k}-n">Called</label><input class="a3-in a3-txt" id="s3-${k}-n" data-f="name" placeholder="Bill" autocomplete="off"></div>
      <div class="a3-field"><label for="s3-${k}-a">Amount</label><input class="a3-in" id="s3-${k}-a" data-f="amount" data-amount data-money></div></div>
      <div class="a3-field"><label for="s3-${k}-e">How often</label><select class="a3-in a3-sel" id="s3-${k}-e" data-f="every"><option value="month">Each month</option><option value="year">Once a year</option></select></div>
      <div class="a3-field" data-q="month" hidden><label for="s3-${k}-m">Month it leaves</label><select class="a3-in a3-sel" id="s3-${k}-m" data-f="month">${MONTHS3.map(([v, m]) => `<option value="${v}">${m}</option>`).join('')}</select></div>
      <div class="a3-field"><label for="s3-${k}-d">Day of the month it leaves</label><select class="a3-in a3-sel" id="s3-${k}-d" data-f="day">${dayOptions3('27')}</select></div>
      <div class="a3-field" data-q="acct" hidden><label for="s3-${k}-f">Leaves from</label><select class="a3-in a3-sel" id="s3-${k}-f" data-f="from" data-acctsel="bank,cash,ewallet"></select></div>
      <div class="a3-field" data-q="takenOut" hidden><label for="s3-${k}-t">Did it leave your bank?</label><select class="a3-in a3-sel" id="s3-${k}-t" data-f="takenOut"><option value="yes" selected>Yes</option><option value="no">No, not yet</option></select></div>${removeBtn3('bill')}</div>`,
  /* [slice 6] another account: a second bank, cash or an e-wallet, with what it holds today */
  acct: k => `<div class="a3-group" data-row="${k}"><div class="a3-row3">
      <div class="a3-field"><label for="s3-${k}-n">Called</label><input class="a3-in a3-txt" id="s3-${k}-n" data-f="name" placeholder="Cash, an e-wallet, a second bank" autocomplete="off"></div>
      <div class="a3-field"><label for="s3-${k}-a">What it holds today</label><input class="a3-in" id="s3-${k}-a" data-f="amount" data-amount data-money></div></div>
      <div class="a3-field"><label for="s3-${k}-t">What it is</label><select class="a3-in a3-sel" id="s3-${k}-t" data-f="type">${KINDS3.map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}</select></div>${removeBtn3('acct')}</div>`,
};
/* adds a row of that kind (a new key, or the key given to put one back); gives the row */
function addRow3(kind, key) {
  let k = key;
  if (!k) { setup3.n[kind]++; k = `${kind}${setup3.n[kind]}`; }
  const n = Number(k.slice(kind.length));
  if (n > setup3.n[kind]) setup3.n[kind] = n;
  $(ROWS_IN3[kind]).insertAdjacentHTML('beforeend', ROW3[kind](k));
  const row = $(`#a3Setup [data-row="${k}"]`);
  row.querySelectorAll('[data-money]').forEach(el => bindMoney3(el));
  rowsShown3(); shape3(); askTaken3();
  return row;
}
/* one second income at most: its Add shows again once it is taken out */
function rowsShown3() { $('#s3AddPay').hidden = $$('#s3Pays [data-row]').length > 0; }
/* [item 14] a row taken out of setup, with Undo (it comes back in its place, as it was). Its section then says not
   saved yet, until its Save */
function removeRow3(row) {
  if (!row) return;
  const key = row.dataset.row, kind = key.replace(/[0-9]+$/, ''), parent = row.parentElement, next = row.nextElementSibling;
  const v = {}; row.querySelectorAll('input[id], select[id]').forEach(x => { v[x.id] = x.value; });
  const name = (row.querySelector('[data-f=name]').value || '').trim() || (kind === 'acct' ? KIND_NAME3[row.querySelector('[data-f=type]').value] : ROW_NAME3[kind]);
  row.remove();
  rowsShown3(); shape3(); askTaken3(); markAll3();
  MSG3.post({ kind: 'undo', key: 'act3', text: `${name} removed`, action: { label: 'Undo', run: () => {
    if (!setup3 || !parent.isConnected || $(`#a3Setup [data-row="${key}"]`)) return;
    const back = addRow3(kind, key);
    parent.insertBefore(back, next && next.isConnected ? next : null);
    const fill = () => { for (const id of Object.keys(v)) { const x = document.getElementById(id); if (x) x.value = v[id]; } };
    fill(); shape3(); fill(); rowsShown3(); askTaken3(); markAll3();
    MSG3.post({ kind: 'toast', key: 'act3', text: 'Undone' });
  } } });
}
async function openSetup3() {
  setup3 = { n: { pay: 1, card: 0, bill: 0, acct: 1 }, countryPicked: false };
  const cur = 'JPY';
  const host = $('#a3Setup');
  host.innerHTML = `<div class="a3-sheet-in">
    <h1 id="a3SetupT">Set up with your own numbers</h1>
    <p class="a3-sub">Press Save under each part as you go. What you save stays on this device, so you can leave and come back. See my money at the end puts it together</p>
    <p class="a3-sub" id="a3SetupBack" hidden>What you saved before is back below. Carry on where you left off</p>
    <section class="a3-card" data-sec="bank"><h2>Your bank</h2>
      <div class="a3-field"><label for="s3BankName">Its name</label><input class="a3-in a3-txt" id="s3BankName" placeholder="Main bank" autocomplete="off"></div>
      <div class="a3-field"><label for="s3Bank">What does your bank show today?</label><input class="a3-in" id="s3Bank" data-amount data-money></div>
      <div class="a3-field"><label for="s3Cur">Money in</label><select class="a3-in a3-sel" id="s3Cur"><option value="JPY" selected>Yen</option><option value="USD">US dollars</option><option value="PHP">Philippine pesos</option><option value="EUR">Euros</option></select></div>
      <div class="a3-field"><label for="s3Country">Where you bank</label><select class="a3-in a3-sel" id="s3Country" aria-describedby="s3CountryH">${COUNTRY3.map(([v, t]) => `<option value="${v}"${v === 'JP' ? ' selected' : ''}>${t}</option>`).join('')}</select>
        <p class="a3-sub" id="s3CountryH" data-hint="country">Its weekends and holidays move pay and bills to a working day</p></div>
      <div id="s3Accts"></div>
      <div class="a3-actions"><button type="button" class="a3-btn" id="s3AddAcct">Add another account: a bank, cash or an e-wallet</button></div>
      ${saveBar3('bank')}
    </section>
    <section class="a3-card" data-card="pay" data-sec="pay"><h2>Your pay</h2>
      <div data-row="pay1">
        <div class="a3-field"><label for="s3PayName">Called</label><input class="a3-in a3-txt" id="s3PayName" data-f="name" placeholder="Pay" autocomplete="off"></div>
        <div class="a3-field"><label for="s3PayAmt">How much lands in your bank each pay day, after tax?</label><input class="a3-in" id="s3PayAmt" data-f="amount" data-amount data-money aria-describedby="s3PayAmtH">
          <p class="a3-sub" id="s3PayAmtH" data-hint="pay">Your payslip's take-home figure, not the amount before tax</p></div>
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
      ${saveBar3('pay')}
    </section>
    <section class="a3-card" data-sec="free"><h2>Everyday spending</h2>
      <div class="a3-field"><label for="s3Free">About how much do you spend each pay period on food, transport and small things?</label><input class="a3-in" id="s3Free" data-amount data-money data-optional aria-describedby="s3FreeH">
        <p class="a3-sub" id="s3FreeH" data-hint="free">Money you spend without planning each item. For example groceries, lunches, coffee, train fares and small shopping. Not your bills or card payments: those come below. The app calls this Free to spend, and Safe to spend leaves room for it until each pay. Leave it blank to add it later on Plan</p></div>
      ${saveBar3('free')}
    </section>
    <section class="a3-card" data-sec="cards"><h2>Your cards</h2><p class="a3-sub">Each card is paid in full from your bank. If you don't know the day its statement closes, leave it as not sure</p>
      <div id="s3Cards"></div>
      <div class="a3-actions"><button type="button" class="a3-btn" id="s3AddCard">Add a card</button></div>
      ${saveBar3('cards')}
    </section>
    <section class="a3-card" data-sec="bills"><h2>Your bills</h2><p class="a3-sub">Bills that leave your bank on a day each month</p>
      <div id="s3Bills"></div>
      <div class="a3-actions"><button type="button" class="a3-btn" id="s3AddBill">Add a bill</button></div>
      ${saveBar3('bills')}
    </section>
    <section class="a3-card" data-sec="min"><h2>Keep at least</h2><p class="a3-sub">An amount you never want your bank to go under. Leave it blank for none</p>
      <div class="a3-field"><label for="s3Min">Keep at least</label><input class="a3-in" id="s3Min" data-amount data-money data-optional aria-describedby="s3MinH">
        <p class="a3-sub" id="s3MinH" data-hint="min">Safe to spend leaves this much in your bank as a cushion</p></div>
      ${saveBar3('min')}
    </section>
    <p class="a3-err" id="a3SetupErr" role="alert"></p>
    <div class="a3-actions"><button type="button" class="a3-btn solid" id="a3SetupSave">See my money</button><button type="button" class="a3-btn" id="a3SetupX">Back</button></div>
  </div>`;
  host.hidden = false; $('#a3Home').hidden = true; scrollTo(0, 0);
  $('#a3').classList.add('a3-setup-open');
  host.querySelectorAll('[data-money]').forEach(el => bindMoney3(el));
  /* the sheet's own listeners, once: the sheet stays, only its inside is drawn again on each open */
  if (!host.dataset.wired) {
    host.dataset.wired = '1';
    host.addEventListener('input', e => { if (!setup3) return; $('#a3SetupErr').textContent = ''; clearErr3(e.target); markAll3(); });
    /* [item 14] any row added here can be taken out; each section has its own Save */
    host.addEventListener('click', e => {
      if (!setup3) return;
      const r = e.target.closest('[data-remove]'); if (r) { removeRow3(r.closest('[data-row]')); return; }
      const s = e.target.closest('[data-save]'); if (s) saveSec3(s.dataset.save);
    });
    /* [BI3] whenever a day or an amount changes, ask again which bills were due since the last pay. A changed choice
       clears the asks in its section (a box asked for may not be needed any more) */
    host.addEventListener('change', e => {
      if (!setup3) return;
      if (e.target.tagName === 'SELECT') { const sec = e.target.closest('[data-sec]'); if (sec) sec.querySelectorAll('[data-err-for]').forEach(p => clearErr3(document.getElementById(p.dataset.errFor))); }
      shape3(); askTaken3(); markAll3();
    });
    host.addEventListener('focusout', () => { if (!setup3) return; shape3(); askTaken3(); markAll3(); });
  }
  $('#s3AddPay').addEventListener('click', () => addRow3('pay'));
  $('#s3AddCard').addEventListener('click', () => addRow3('card'));
  $('#s3AddBill').addEventListener('click', () => addRow3('bill'));
  $('#s3AddAcct').addEventListener('click', () => addRow3('acct'));
  $('#s3Cur').addEventListener('change', () => { if (!setup3.countryPicked) $('#s3Country').value = COUNTRY_OF3[$('#s3Cur').value] || 'XX'; });
  $('#s3Country').addEventListener('change', () => { setup3.countryPicked = true; });
  $('#a3SetupX').addEventListener('click', closeSetup3);
  $('#a3SetupSave').addEventListener('click', saveSetup3);
  shape3();
  setup3.base = {}; setup3.saved = {}; setup3.days = {};
  for (const [sec] of SEC3) setup3.base[sec] = snap3(sec);
  markAll3();
  $('#s3Bank').focus();
  /* [item 14] the sections saved before on this device come back */
  const me = setup3, draft = await E3.rec('setup');
  if (setup3 === me && draft && draft.sections) { restoreDraft3(draft); $('#a3SetupBack').hidden = false; $('#s3Bank').focus(); }
}
/* one input behaviour (screens/inputs.js) in the chosen currency */
/* [item 14] a box that can't be read says why next to it when it is left; a blank one is asked for only on Save */
function bindMoney3(el) {
  BurrowScreens.inputs.bind(el, { kind: 'amount', get code() { return $('#s3Cur').value; }, optional: el.hasAttribute('data-optional'),
    onError: r => { if (r.reason !== 'empty') fieldErr3(el, r.message); }, onValue: () => clearErr3(el) });
}
/* [item 14] a box's own error line, right after it and read with it; it goes as soon as the box is changed, and the
   person can always leave the box, go Back or change any other answer: nothing is locked */
function fieldErr3(el, words) {
  let p = $(`#a3Setup [data-err-for="${el.id}"]`);
  if (!p) {
    p = document.createElement('p'); p.className = 'a3-err'; p.id = el.id + '-err'; p.dataset.errFor = el.id; p.setAttribute('role', 'alert');
    el.insertAdjacentElement('afterend', p);
  }
  p.textContent = words;
  el.setAttribute('aria-invalid', 'true');
  const d = (el.getAttribute('aria-describedby') || '').split(' ').filter(Boolean);
  if (!d.includes(p.id)) el.setAttribute('aria-describedby', d.concat(p.id).join(' '));
}
function clearErr3(el) {
  if (!el || !el.id) return;
  const p = $(`#a3Setup [data-err-for="${el.id}"]`);
  if (!p) return;
  p.textContent = '';
  el.removeAttribute('aria-invalid');
  const d = (el.getAttribute('aria-describedby') || '').split(' ').filter(x => x && x !== p.id);
  if (d.length) el.setAttribute('aria-describedby', d.join(' ')); else el.removeAttribute('aria-describedby');
}
/* Back: setup closes; every saved section stays in the draft on this device */
function closeSetup3() { endSetup3(); renderHome3(); }
function endSetup3() { $('#a3Setup').hidden = true; $('#a3Setup').innerHTML = ''; setup3 = null; $('#a3Home').hidden = false; $('#a3').classList.remove('a3-setup-open'); }
/* the answers as build_book takes them. strict: a missing amount is asked for next to its box, which is focused
   (throws 'asked'); else it counts as 0, for a draft book that only says which bills were due since the last pay.
   sec (a setup section): only the boxes in it are asked for; the others count as 0 */
function answers3(strict, sec) {
  const cur = $('#s3Cur').value;
  const asks = el => strict && (!sec || sec.contains(el));
  const ask = (el, words) => { fieldErr3(el, words); el.focus(); throw new Error('asked'); };
  const need = (el, words) => { const v = typed3(el.value, cur); if (v !== null) return v; if (!asks(el)) return 0; return ask(el, words); };
  const text = (el, dflt) => (el.value || '').trim() || dflt;
  const bankName = text($('#s3BankName'), 'Main bank');
  const min = $('#s3Min').value.trim() ? need($('#s3Min'), 'Type the amount to keep at least, or leave it blank') : null;
  const ans = {
    day: E3.today(), told: E3.told(), currency: cur, country: $('#s3Country').value,
    banks: [{ key: 'bank1', name: bankName, amount: need($('#s3Bank'), `Type what ${bankName} shows today`), main: true, min }],
    pays: [], cards: [], bills: [],
    /* [north star F1, BJ2] Free to spend, the first plan amount, from the setup day; blank: not said (Home asks) */
    free: $('#s3Free').value.trim() ? need($('#s3Free'), 'Type about how much goes on everyday things, or leave it blank') : null,
  };
  /* [slice 6] the other accounts: a second bank, cash, an e-wallet, each with what it holds today */
  $$('#a3Setup [data-row^=acct]').forEach(row => {
    const name = text(row.querySelector('[data-f=name]'), KIND_NAME3[row.querySelector('[data-f=type]').value]);
    ans.banks.push({ key: row.dataset.row, name, type: row.querySelector('[data-f=type]').value, amount: need(row.querySelector('[data-f=amount]'), `Type what ${name} holds today, or 0`) });
  });
  /* the account a select names; a hidden one (only one account to choose) is the main bank */
  const acctOf = sel => (sel && !sel.closest('[data-q=acct]').hidden && sel.value) || 'bank1';
  /* the first pay's rhythm: a day each month, two days, every n weeks from the day of one, or no fixed pay */
  const every = $('#s3PayEvery').value, shift = $('#s3PayShift').value, day = Number($('#s3PayDay').value);
  /* [slice 6b] one rhythm from the answers, for the pay and for a second income: every n weeks from the day of one
     (build_book steps it back to on or before the setup day, BP1) */
  const rhythmOf = (ev, d, d2v, startBox) => {
    const d2 = d2v === 'last' ? 'last' : Number(d2v);
    if (ev === 'month') return { every: 'month', day: d };
    if (ev === 'days') return { every: 'month', days: d === d2 ? [d] : [d, d2] };
    if (ev === 'none') return { every: 'none' };
    const start = startBox.value;
    if (!start && asks(startBox)) ask(startBox, 'Type the day of one pay, the last one or the next one');
    return { every: 'weeks', n: Number(ev.slice(5)), start: start || ans.day };
  };
  const rhythm = rhythmOf(every, day, $('#s3PayDay2').value, $('#s3PayStart'));
  $$('#a3Setup [data-row^=pay]').forEach((row, i) => {
    const name = text(row.querySelector('[data-f=name]'), i ? 'Second income' : 'Pay');
    const ev = i ? row.querySelector('[data-f=every]').value : null;
    const r = !i || ev === 'same' ? rhythm : rhythmOf(ev, Number(row.querySelector('[data-f=day]').value), row.querySelector('[data-f=day2]').value, row.querySelector('[data-f=start]'));
    const box = row.querySelector('[data-f=amount]'), bank = acctOf(i ? row.querySelector('[data-f=acct]') : $('#s3PayAcct'));
    /* no fixed pay: the amount may be blank (it comes when it comes) */
    if (r.every === 'none' && !box.value.trim()) { ans.pays.push(Object.assign({ key: row.dataset.row, name, bank, shift: 'none' }, r)); return; }
    /* [BL1] a pay of 0 is refused with build_book's own words; a draft counts a pay not typed yet as some amount */
    const amount = need(box, `Type how much ${name} is`);
    if (amount === 0 && asks(box)) ask(box, BurrowEngine.build.PAY_NEEDS_AMOUNT);
    ans.pays.push(Object.assign({ key: row.dataset.row, name, bank, amount: amount || 1, shift: r.every === 'none' ? 'none' : shift }, r));
  });
  /* the first pay with a fixed day starts the pay period */
  const first = ans.pays.find(x => x.every !== 'none');
  if (first) first.startsPeriod = true;
  $$('#a3Setup [data-row^=card]').forEach(row => {
    const name = text(row.querySelector('[data-f=name]'), 'Card'), cd = row.querySelector('[data-f=closeDay]').value;
    const owed = need(row.querySelector('[data-f=owed]'), `Type what is on ${name} now, or 0`);
    /* [BL6] asked only between the close and its payment day (askTaken3 shows it); blank: all of it was on that statement */
    const q = row.querySelector('[data-q=stmt]'), st = row.querySelector('[data-f=statement]');
    const statement = strict && q && !q.hidden ? (st.value.trim() ? need(st, `Type how much of ${name} was on the statement, or leave it blank`) : owed) : undefined;
    ans.cards.push({ key: row.dataset.row, name, owed,
      payDay: Number(row.querySelector('[data-f=payDay]').value), closeDay: cd === 'not sure' || cd === 'last' ? cd : Number(cd),
      payFrom: acctOf(row.querySelector('[data-f=payFrom]')), shift: row.querySelector('[data-f=shift]').value, ...(statement !== undefined ? { statement } : {}) });
  });
  $$('#a3Setup [data-row^=bill]').forEach(row => {
    const name = text(row.querySelector('[data-f=name]'), 'Bill');
    const q = row.querySelector('[data-q=takenOut]'), d = Number(row.querySelector('[data-f=day]').value);
    /* once a year: its month and day ('MM-DD'); a day the month does not have is refused by build_book with words */
    const yearly = row.querySelector('[data-f=every]').value === 'year';
    const when = yearly ? { every: 'year', date: row.querySelector('[data-f=month]').value + '-' + row.querySelector('[data-f=day]').value.padStart(2, '0') } : { day: d };
    ans.bills.push(Object.assign({ key: row.dataset.row, name, from: acctOf(row.querySelector('[data-f=from]')), amount: need(row.querySelector('[data-f=amount]'), `Type the amount of ${name}`), shift: 'after' }, when,
      q && !q.hidden && row.querySelector('[data-f=takenOut]').value === 'no' ? { takenOut: false } : {}));
  });
  return ans;
}
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
  let asked = {}, stmts = {};
  try { const d = BurrowEngine.build.buildBook(answers3(false), { newId: BurrowEngine.ids.idMaker('draft0') }); asked = d.asked || {}; stmts = d.askedStatements || {}; } catch (e) { asked = {}; }
  const yr = (E3.today() || '').slice(0, 4);
  /* [BL6] a card set up after its close and before that statement's payment day: how much was on that statement */
  $$('#a3Setup [data-row^=card]').forEach(row => {
    const q = row.querySelector('[data-q=stmt]'), g = stmts[row.dataset.row];
    q.hidden = !g;
    if (!g) return;
    q.querySelector('label').textContent = `How much of it was on the statement that closed on ${day3(g.closed, yr)}?`;
    q.querySelector('[data-hint=stmt]').textContent = `That part comes out on ${day3(g.payment, yr)}, the rest with a later payment. Leave it blank if you are not sure: then all of it comes out on ${day3(g.payment, yr)}`;
  });
  $$('#a3Setup [data-row^=bill]').forEach(row => {
    const q = row.querySelector('[data-q=takenOut]'), days = asked[row.dataset.row];
    q.hidden = !days;
    if (!days) return;
    const name = row.querySelector('[data-f=name]').value.trim() || 'bill';
    const when = days.map(d => day3(d, yr)), list = when.length > 1 ? when.slice(0, -1).join(', ') + ' and ' + when.slice(-1)[0] : when[0];
    q.querySelector('label').textContent = `Did the ${name} of ${list} leave your bank?`;
  });
}
/* ---------- [item 14] each section saved on its own ----------
   A partly done setup is HELD AS A DRAFT, not a book: each section's Save keeps that section's answers (what is in its
   boxes and which rows it has) in this device's own record (E3.rec('setup'), the store's device record: never in the
   cloud copy or a backup). No book exists until "See my money", which builds the whole book through
   engine/build_book.js from the saved sections only, exactly as before, keeps it, and then clears the draft. So the
   engine is unchanged, and a half-done setup can never be read as someone's money. Leaving half way (Back, a reload,
   closing the tab) keeps every saved section; opening setup again (or opening the page) puts them back. A bank, card or
   bills section saved on an earlier day comes back asking to be checked and saved again (DAY_BOUND3). Each Save and each removed row
   posts in the one message band (screens/messages.js) with Undo, under act3's key so one Undo shows at a time. There is
   no book yet, so act3 itself cannot hold these steps: Undo here puts back the section as it was before that Save. */
const SEC3 = [['bank', 'Your bank'], ['pay', 'Your pay'], ['free', 'Everyday spending'], ['cards', 'Your cards'], ['bills', 'Your bills'], ['min', 'Keep at least']];
const SEC_ROWS3 = { bank: 'acct', pay: 'pay', cards: 'card', bills: 'bill' };
const secName3 = sec => (SEC3.find(([s]) => s === sec) || [sec, sec])[1];
const secEl3 = sec => $(`#a3Setup [data-sec="${sec}"]`);
const saveBar3 = sec => `<div class="a3-actions a3-secsave"><button type="button" class="a3-btn" data-save="${sec}" aria-label="Save ${secName3(sec)}">Save</button><p class="a3-sub" data-saved="${sec}" role="status"></p></div>`;
/* what a section holds: its added rows (by key, in order) and every box's value (by id) */
function snap3(sec) {
  const el = secEl3(sec);
  const rows = $$(`#a3Setup [data-sec="${sec}"] [data-row]`).map(r => r.dataset.row).filter(k => k !== 'pay1');
  const v = {};
  el.querySelectorAll('input[id], select[id]').forEach(x => { v[x.id] = x.value; });
  return { rows, v };
}
const same3 = (a, b) => JSON.stringify(a) === JSON.stringify(b);
/* saved: as last saved; changed: not saved yet; empty: never saved and as it started */
/* stale: saved on an earlier day in a section whose figures are of the day they were typed (LESSONS lesson 1: the only
   bank figure is what the bank shows today): what the bank and each account hold, what is on each card now, which
   bills have left. Its answers come back, and it asks to be checked and saved again before the book is built. The
   pay, everyday spending and the minimum do not change with the day. */
const DAY_BOUND3 = { bank: 1, cards: 1, bills: 1 };
function state3(sec) {
  const now = snap3(sec), was = setup3.saved[sec], day = setup3.days[sec];
  if (was && DAY_BOUND3[sec] && day && day !== E3.today()) return 'stale';
  if (was) return same3(now, was) ? 'saved' : 'changed';
  return same3(now, setup3.base[sec]) ? 'empty' : 'changed';
}
const STATE_WORDS3 = { saved: () => 'Saved', changed: () => 'Not saved yet', empty: () => '',
  stale: sec => `Saved on ${day3(setup3.days[sec], E3.today().slice(0, 4))}. Check it still shows the same today, then Save` };
function markAll3() {
  if (!setup3 || !setup3.base) return;
  for (const [sec] of SEC3) {
    const st = state3(sec), el = secEl3(sec);
    el.dataset.state = st;
    el.querySelector(`[data-saved="${sec}"]`).textContent = STATE_WORDS3[st](sec);
  }
}
/* puts a section back as a snapshot holds it: its rows, then every box (the account choices need the rows first) */
function put3(sec, snap) {
  const kind = SEC_ROWS3[sec];
  if (kind) {
    $$(`#a3Setup [data-sec="${sec}"] [data-row]`).filter(r => r.dataset.row !== 'pay1').forEach(r => r.remove());
    for (const k of snap.rows) addRow3(kind, k);
  }
  shape3();
  const fill = () => { for (const id of Object.keys(snap.v)) { const x = document.getElementById(id); if (x && secEl3(sec).contains(x)) x.value = snap.v[id]; } };
  fill(); shape3(); fill();
  if (sec === 'bank') setup3.countryPicked = true;
  secEl3(sec).querySelectorAll('[data-err-for]').forEach(p => clearErr3(document.getElementById(p.dataset.errFor)));
  rowsShown3(); shape3(); askTaken3(); markAll3();
}
/* the draft on this device: { v: 1, sections: { <sec>: snapshot }, days: { <sec>: the day it was saved } }, or nothing */
const keepDraft3 = (sections, days) => E3.rec('setup', Object.keys(sections).length ? { v: 1, sections, days } : null);
async function saveSec3(sec) {
  if (!setup3 || setup3.busy) return;
  const el = secEl3(sec);
  $('#a3SetupErr').textContent = '';
  el.querySelectorAll('[data-err-for]').forEach(p => clearErr3(document.getElementById(p.dataset.errFor)));
  try { askTaken3(); answers3(true, el); } catch (e) { if (e.message === 'asked') return; throw e; }
  const before = setup3.saved[sec] || null, beforeDay = setup3.days[sec] || null, now = snap3(sec);
  const sections = Object.assign({}, setup3.saved, { [sec]: now }), days = Object.assign({}, setup3.days, { [sec]: E3.today() });
  setup3.busy = true;
  const ok = await keepDraft3(sections, days);
  setup3.busy = false;
  if (!setup3) return;
  if (ok !== true) { el.querySelector(`[data-saved="${sec}"]`).textContent = 'This could not be saved on this device. Nothing changed'; return; }
  setup3.saved = sections; setup3.days = days;
  markAll3();
  MSG3.post({ kind: 'undo', key: 'act3', text: `${secName3(sec)}: saved`, action: { label: 'Undo', run: () => undoSec3(sec, before, beforeDay, now) } });
}
/* Undo a section's Save: the section as it was before it (or as it started); refused when it was saved again since */
async function undoSec3(sec, before, beforeDay, now) {
  const open = !!setup3, kept = open ? null : ((await E3.rec('setup')) || {});
  const saved = open ? setup3.saved : (kept.sections || {}), savedDays = open ? setup3.days : (kept.days || {});
  if (!same3(saved[sec] || null, now)) { MSG3.post({ kind: 'toast', key: 'act3', text: 'Something changed it since. Undo that change first' }); return; }
  const sections = Object.assign({}, saved), days = Object.assign({}, savedDays);
  if (before) { sections[sec] = before; days[sec] = beforeDay; } else { delete sections[sec]; delete days[sec]; }
  if ((await keepDraft3(sections, days)) !== true) { MSG3.post({ kind: 'toast', key: 'act3', text: 'This could not be saved on this device. Nothing changed' }); return; }
  if (open && setup3) { setup3.saved = sections; setup3.days = days; put3(sec, before || setup3.base[sec]); }
  MSG3.post({ kind: 'toast', key: 'act3', text: 'Undone' });
}
/* opening setup again: every saved section comes back, in order (the accounts first: the others choose from them) */
function restoreDraft3(draft) {
  if (!setup3 || !draft || !draft.sections) return;
  setup3.saved = {}; setup3.days = Object.assign({}, draft.days);
  for (const [sec] of SEC3) if (draft.sections[sec]) { setup3.saved[sec] = draft.sections[sec]; put3(sec, draft.sections[sec]); }
  markAll3();
}
/* See my money: only when every section is as saved (a section never touched counts as its start); the book is then
   built from those answers through build_book, kept, and the draft cleared */
async function saveSetup3() {
  if (!setup3 || setup3.busy) return;
  const err = $('#a3SetupErr');
  err.textContent = '';
  markAll3();
  const open = SEC3.find(([sec]) => state3(sec) === 'changed' || state3(sec) === 'stale');
  if (open) {
    err.textContent = state3(open[0]) === 'stale' ? `${open[1]} was saved on ${day3(setup3.days[open[0]], E3.today().slice(0, 4))}. Check it still shows the same today, then press Save under it`
      : `${open[1]} is not saved yet. Press Save under it first`;
    const b = secEl3(open[0]).querySelector('[data-save]'); b.focus(); b.scrollIntoView({ block: 'center' });
    return;
  }
  let ans;
  try { ans = answers3(true); } catch (e) { if (e.message === 'asked') return; throw e; }
  askTaken3();
  try { ans = answers3(true); } catch (e) { if (e.message === 'asked') return; throw e; }
  let built;
  try { built = BurrowEngine.build.buildBook(ans, { newId: E3.newId }); } catch (e) { err.textContent = e.message; return; }
  const ok = await E3.start(built.book);
  if (!ok) { err.textContent = 'This could not be saved on this device. Nothing changed'; return; }
  await E3.rec('setup', null);
  endSetup3();
  renderHome3(); msg3('Saved on this device');
}
