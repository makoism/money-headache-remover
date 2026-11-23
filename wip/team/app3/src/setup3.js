/* ---------- Setup, short (WIRING_PLAN 1.1 item 1, step 10; DECISIONS_ROUND2 BE: the only way in for a person's own money) ----------
   One screen: what the bank shows today, pay (day and amount, a second income allowed), the cards (what is on each now,
   its payment day, its close day or "not sure"), the bills with their due days, and the minimum (M1: blank means none).
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
const shiftOptions3 = (list, sel) => list.map(([v, t]) => `<option value="${v}"${v === sel ? ' selected' : ''}>${t}</option>`).join('');
function openSetup3() {
  setup3 = { pays: 1, cards: 0, bills: 0 };
  const cur = 'JPY';
  const host = $('#a3Setup');
  host.innerHTML = `<div class="a3-sheet-in">
    <h1 id="a3SetupT">Set up with your own numbers</h1>
    <section class="a3-card"><h2>Your bank</h2>
      <div class="a3-field"><label for="s3BankName">Its name</label><input class="a3-in a3-txt" id="s3BankName" placeholder="Main bank" autocomplete="off"></div>
      <div class="a3-field"><label for="s3Bank">What does your bank show today?</label><input class="a3-in" id="s3Bank" data-money></div>
      <div class="a3-field"><label for="s3Cur">Money in</label><select class="a3-in a3-sel" id="s3Cur"><option value="JPY" selected>Yen</option><option value="USD">US dollars</option><option value="PHP">Philippine pesos</option><option value="EUR">Euros</option></select></div>
    </section>
    <section class="a3-card"><h2>Your pay</h2>
      <div class="a3-row3" data-row="pay1">
        <div class="a3-field"><label for="s3PayName">Called</label><input class="a3-in a3-txt" id="s3PayName" data-f="name" placeholder="Pay" autocomplete="off"></div>
        <div class="a3-field"><label for="s3PayAmt">How much lands</label><input class="a3-in" id="s3PayAmt" data-f="amount" data-money></div>
      </div>
      <div class="a3-field"><label for="s3PayDay">Day of the month it lands</label><select class="a3-in a3-sel" id="s3PayDay">${dayOptions3('25')}</select></div>
      <div class="a3-field"><label for="s3PayShift">When that day is a weekend or holiday, it lands</label><select class="a3-in a3-sel" id="s3PayShift">${shiftOptions3(SHIFT3.pay, 'before')}</select></div>
      <div id="s3Pays"></div>
      <div class="a3-actions"><button type="button" class="a3-btn" id="s3AddPay">Add a second income on the same day</button></div>
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
      <div class="a3-field"><label for="s3Min">Keep at least</label><input class="a3-in" id="s3Min" data-money data-optional aria-describedby="s3MinH">
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
      <div class="a3-field"><label for="s3-${k}-a">How much lands</label><input class="a3-in" id="s3-${k}-a" data-f="amount" data-money></div></div>`);
    bindMoney3($(`#s3-${k}-a`));
    $('#s3AddPay').hidden = true;
  });
  $('#s3AddCard').addEventListener('click', () => {
    setup3.cards++; const k = 'card' + setup3.cards;
    $('#s3Cards').insertAdjacentHTML('beforeend', `<div class="a3-group" data-row="${k}">
      <div class="a3-row3"><div class="a3-field"><label for="s3-${k}-n">Called</label><input class="a3-in a3-txt" id="s3-${k}-n" data-f="name" placeholder="Card" autocomplete="off"></div>
      <div class="a3-field"><label for="s3-${k}-o">On it now</label><input class="a3-in" id="s3-${k}-o" data-f="owed" data-money></div></div>
      <div class="a3-field"><label for="s3-${k}-p">Day of the month it is paid from your bank</label><select class="a3-in a3-sel" id="s3-${k}-p" data-f="payDay">${dayOptions3('10')}</select></div>
      <div class="a3-field"><label for="s3-${k}-s">When that day is a weekend or holiday, it comes out</label><select class="a3-in a3-sel" id="s3-${k}-s" data-f="shift">${shiftOptions3(SHIFT3.out, 'after')}</select></div>
      <div class="a3-field"><label for="s3-${k}-c">Day its statement closes</label><select class="a3-in a3-sel" id="s3-${k}-c" data-f="closeDay" aria-describedby="s3-${k}-ch">${dayOptions3('not sure', [['last', 'the last day'], ['not sure', 'not sure']])}</select>
        <p class="a3-sub" id="s3-${k}-ch" data-hint="closeDay">Spends after this day go on the next payment</p></div></div>`);
    bindMoney3($(`#s3-${k}-o`));
  });
  $('#s3AddBill').addEventListener('click', () => {
    setup3.bills++; const k = 'bill' + setup3.bills;
    $('#s3Bills').insertAdjacentHTML('beforeend', `<div class="a3-group" data-row="${k}"><div class="a3-row3">
      <div class="a3-field"><label for="s3-${k}-n">Called</label><input class="a3-in a3-txt" id="s3-${k}-n" data-f="name" placeholder="Bill" autocomplete="off"></div>
      <div class="a3-field"><label for="s3-${k}-a">Amount</label><input class="a3-in" id="s3-${k}-a" data-f="amount" data-money></div></div>
      <div class="a3-field"><label for="s3-${k}-d">Day of the month it leaves</label><select class="a3-in a3-sel" id="s3-${k}-d" data-f="day">${dayOptions3('27')}</select></div>
      <div class="a3-field" data-q="takenOut" hidden><label for="s3-${k}-t">Has it gone out of your bank yet?</label><select class="a3-in a3-sel" id="s3-${k}-t" data-f="takenOut"><option value="yes" selected>Yes</option><option value="no">No, not yet</option></select></div></div>`);
    bindMoney3($(`#s3-${k}-a`));
    askTaken3();
  });
  /* [BI3] whenever a day or an amount changes, ask again which bills were due since the last pay */
  host.addEventListener('change', askTaken3);
  host.addEventListener('focusout', askTaken3);
  $('#a3SetupX').addEventListener('click', closeSetup3);
  $('#a3SetupSave').addEventListener('click', saveSetup3);
  $('#s3Bank').focus();
}
/* one input behaviour (screens/inputs.js) in the chosen currency */
function bindMoney3(el) { BurrowScreens.inputs.bind(el, { kind: 'amount', get code() { return $('#s3Cur').value; }, optional: el.hasAttribute('data-optional') }); }
function closeSetup3() { $('#a3Setup').hidden = true; $('#a3Setup').innerHTML = ''; setup3 = null; $('#a3Home').hidden = false; renderHome3(); }
/* the answers as build_book takes them. strict: a missing amount is asked for (throws 'asked'); else it counts as 0,
   for a draft book that only says which bills were due since the last pay */
function answers3(strict) {
  const err = $('#a3SetupErr'), cur = $('#s3Cur').value;
  const need = (el, words) => { const v = typed3(el.value, cur); if (v !== null) return v; if (!strict) return 0; err.textContent = words; el.focus(); throw new Error('asked'); };
  const text = (el, dflt) => (el.value || '').trim() || dflt;
  let ans;
  {
    const bankName = text($('#s3BankName'), 'Main bank');
    const min = $('#s3Min').value.trim() ? need($('#s3Min'), 'Type the amount to keep at least, or leave it blank') : null;
    ans = {
      day: E3.today(), told: E3.told(), currency: cur, country: { JPY: 'JP', PHP: 'PH' }[cur] || 'XX',
      banks: [{ key: 'bank1', name: bankName, amount: need($('#s3Bank'), `Type what ${bankName} shows today`), main: true, min }],
      pays: [], cards: [], bills: [],
    };
    const day = Number($('#s3PayDay').value), shift = $('#s3PayShift').value;
    $$('#a3Setup [data-row^=pay]').forEach((row, i) => {
      const name = text(row.querySelector('[data-f=name]'), 'Pay');
      ans.pays.push({ key: row.dataset.row, name, bank: 'bank1', amount: need(row.querySelector('[data-f=amount]'), `Type how much ${name} is`), day, shift, startsPeriod: i === 0 });
    });
    $$('#a3Setup [data-row^=card]').forEach(row => {
      const name = text(row.querySelector('[data-f=name]'), 'Card'), cd = row.querySelector('[data-f=closeDay]').value;
      ans.cards.push({ key: row.dataset.row, name, owed: need(row.querySelector('[data-f=owed]'), `Type what is on ${name} now, or 0`),
        payDay: Number(row.querySelector('[data-f=payDay]').value), closeDay: cd === 'not sure' || cd === 'last' ? cd : Number(cd),
        payFrom: 'bank1', shift: row.querySelector('[data-f=shift]').value });
    });
    $$('#a3Setup [data-row^=bill]').forEach(row => {
      const name = text(row.querySelector('[data-f=name]'), 'Bill');
      const q = row.querySelector('[data-q=takenOut]');
      ans.bills.push({ key: row.dataset.row, name, from: 'bank1', amount: need(row.querySelector('[data-f=amount]'), `Type the amount of ${name}`), day: Number(row.querySelector('[data-f=day]').value), shift: 'after',
        ...(q && !q.hidden && row.querySelector('[data-f=takenOut]').value === 'no' ? { takenOut: false } : {}) });
    });
  }
  return ans;
}
/* [BI3, X3] which bills to ask "Has it gone out of your bank yet?": build_book itself says, from a draft where every
   bill is still to go (the opening check's notYet names each one due between the last pay and the setup day) */
function askTaken3() {
  if (!setup3) return;
  let due = new Set();
  try {
    const ans = answers3(false);
    ans.bills.forEach(x => { x.takenOut = false; });
    const built = BurrowEngine.build.buildBook(ans, { newId: BurrowEngine.ids.idMaker('draft0') });
    const open = built.book.events.find(e => e.k === 'check' && e.acct === built.ids.bank1 && !e.stmt);
    const sched = (open && open.notYet || []).map(o => BurrowEngine.ids.scheduleOf(typeof o === 'string' ? o : o.s + '@' + o.due));
    for (const key of Object.keys(built.ids)) if (sched.includes(built.ids[key])) due.add(key);
  } catch (e) { due = new Set(); }
  $$('#a3Setup [data-row^=bill]').forEach(row => { row.querySelector('[data-q=takenOut]').hidden = !due.has(row.dataset.row); });
}
async function saveSetup3() {
  const err = $('#a3SetupErr');
  let ans;
  try { ans = answers3(true); } catch (e) { if (e.message === 'asked') return; throw e; }
  askTaken3();
  try { ans = answers3(true); } catch (e) { if (e.message === 'asked') return; throw e; }
  let built;
  try { built = BurrowEngine.build.buildBook(ans, { newId: E3.newId }); } catch (e) { err.textContent = e.message; return; }
  const ok = await E3.start(built.book);
  if (!ok) { err.textContent = 'This could not be saved on this device. Nothing changed'; return; }
  $('#a3Setup').hidden = true; $('#a3Setup').innerHTML = ''; setup3 = null; $('#a3Home').hidden = false;
  renderHome3(); msg3('Saved on this device');
}
