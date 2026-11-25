#!/usr/bin/env node
/* Setup fixes from Mako's first run of the live app (DECISIONS "The new foundation" items 13 and 14), through the
   built page as a person uses it. Made-up yen only.
   1. Pay is what lands in the bank (item 13, a correctness fact): the pay question says it is the amount that lands in
      your bank, after tax, with the payslip's take-home figure as its help; the pay saved is the amount typed.
   2. Everyday spending says what it covers: food, transport, small things, money spent without planning each item,
      with an example.
   3. A bill (and a card) can be removed in setup, with Undo.
   4. A blank amount never traps: a blank optional field is fine; every required field left blank says what is needed
      next to it and focuses it; typing clears it; Back always works.
   5. Each section is saved on its own with a "Saved" notice and Undo. A partly done setup is held as a draft on this
      device (not a book): a reload half way keeps what was saved and nothing that was not; "See my money" builds the
      book through build_book only from saved sections, and the draft is cleared once the book is kept. */
'use strict';
const L = require('./lives3.js').make('e3_setupfix');
const { ck, go, typeIn, txt, w } = L;
const { saveSections } = require('./setup_sections.js');
const val = (p, s) => p.$eval(s, e => e.value).catch(() => null);
const errOf = (p, id) => p.$eval(`#a3Setup [data-err-for="${id}"]`, e => e.textContent).catch(() => '(no error line)');
const focused = p => p.evaluate(() => (document.activeElement || {}).id || (document.activeElement && document.activeElement.dataset.save ? 'save:' + document.activeElement.dataset.save : ''));
const stateOf = (p, sec) => p.$eval(`#a3Setup [data-sec=${sec}]`, e => e.dataset.state).catch(() => null);
const savedWords = (p, sec) => p.$eval(`#a3Setup [data-saved=${sec}]`, e => e.textContent.trim()).catch(() => null);
const saveSec = async (p, sec) => { await p.click(`#a3Setup [data-save=${sec}]`); await w(250); };
const band = p => p.$eval('#a3Msg', e => ({ text: e.textContent, undo: [...e.querySelectorAll('button')].some(b => b.textContent === 'Undo') }));
const device = p => p.evaluate(() => new Promise(res => {
  const rq = indexedDB.open('burrow3');
  rq.onsuccess = () => { const db = rq.result; const tx = db.transaction(['device', 'book']), out = {}; tx.objectStore('device').get('device').onsuccess = e => { out.device = e.target.result || null; }; tx.objectStore('book').get('book').onsuccess = e => { out.book = e.target.result || null; }; tx.oncomplete = () => { db.close(); res(out); }; };
  rq.onerror = () => res(null);
}));
const homeBank = p => p.$eval('#a3Home [data-card=bank] [data-fig=bank]', e => Number((e.dataset.amt !== undefined ? e : e.querySelector('[data-amt]')).dataset.amt)).catch(() => null);
async function openSetup(day) {
  const o = await L.open();
  await go(o.p, day);
  await o.p.click('#a3SetupGo'); await w(250);
  return o;
}
(async () => {
  /* 1 and 2: the words, and the pay saved is the amount typed */
  {
    const { c, p } = await openSetup('2026-12-01');
    const lab = await txt(p, 'label[for=s3PayAmt]');
    ck('item 13: the pay question asks what lands in your bank each pay day, after tax', lab === 'How much lands in your bank each pay day, after tax?', lab);
    const help = await p.$eval('#s3PayAmt', e => { const h = document.getElementById(e.getAttribute('aria-describedby') || ''); return h ? h.textContent : ''; }).catch(() => '');
    ck('item 13: its one-line help, read with the box: the payslip\'s take-home figure', help === 'Your payslip\'s take-home figure, not the amount before tax', help);
    await p.click('#s3AddPay'); await w(100);
    const lab2 = await txt(p, 'label[for=s3-pay2-a]');
    ck('item 13: a second income asks for what lands, after tax, too', /lands/.test(lab2) && /after tax/.test(lab2), lab2);
    await p.click('[data-row=pay2] [data-remove]'); await w(150);
    const flab = await txt(p, 'label[for=s3Free]');
    ck('item 14: everyday spending names what it covers: food, transport and small things', flab === 'About how much do you spend each pay period on food, transport and small things?', flab);
    const fhelp = await p.$eval('#s3Free', e => { const h = document.getElementById(e.getAttribute('aria-describedby') || ''); return h ? h.textContent : ''; }).catch(() => '');
    ck('item 14: its help says money spent without planning each item, with an example', /Money you spend without planning each item/.test(fhelp) && /For example/.test(fhelp) && !/\.$/.test(fhelp), fhelp);
    await typeIn(p, '#s3Bank', '300000'); await typeIn(p, '#s3PayAmt', '241500'); await p.selectOption('#s3PayDay', '25');
    const e = await saveSections(p);
    ck('every section saves', e === '', e);
    await p.click('#a3SetupSave'); await w(700);
    ck('saved: Home shows', await p.$eval('#a3Setup', e => e.hidden), await txt(p, '#a3SetupErr'));
    const bk = await L.readBook(p), pay = (bk.schedules || []).find(s => s.kind === 'income');
    ck('item 13: the pay saved is the amount typed, what lands in the bank (241,500)', pay && pay.steps[0].amount === 241500, JSON.stringify(pay && pay.steps));
    await c.close();
  }
  /* 4: every required field left blank says what is needed next to it and focuses it; optional blanks are fine */
  {
    const { c, p } = await openSetup('2026-12-01');
    await saveSec(p, 'bank');
    ck('blank bank: says what is needed next to it', (await errOf(p, 's3Bank')) === 'Type what Main bank shows today', await errOf(p, 's3Bank'));
    ck('blank bank: the box is focused and marked', (await focused(p)) === 's3Bank' && (await p.$eval('#s3Bank', e => e.getAttribute('aria-invalid'))) === 'true', await focused(p));
    ck('blank bank: the error is read with the box', await p.$eval('#s3Bank', e => (e.getAttribute('aria-describedby') || '').split(' ').some(id => document.getElementById(id) && document.getElementById(id).dataset.errFor === 's3Bank')));
    ck('blank bank: not saved', (await stateOf(p, 'bank')) !== 'saved');
    await p.click('#a3SetupX'); await w(250);
    ck('with the error showing, Back still works: the first screen shows', await p.$eval('#a3Setup', e => e.hidden) && !!(await p.$('#a3SetupGo')));
    await p.click('#a3SetupGo'); await w(250);
    ck('setup opens again', !(await p.$eval('#a3Setup', e => e.hidden)));
    await saveSec(p, 'bank');
    await p.fill('#s3Bank', '300000');
    ck('typing clears the error', (await errOf(p, 's3Bank')) === '' && !(await p.$eval('#s3Bank', e => e.hasAttribute('aria-invalid'))), await errOf(p, 's3Bank'));
    await p.click('#s3AddAcct'); await w(100);
    await saveSec(p, 'bank');
    ck('blank second account: says what is needed next to it, focused', (await errOf(p, 's3-acct2-a')) === 'Type what Second bank holds today, or 0' && (await focused(p)) === 's3-acct2-a', (await errOf(p, 's3-acct2-a')) + ' / ' + (await focused(p)));
    await typeIn(p, '#s3-acct2-a', '5000');
    await saveSec(p, 'bank');
    ck('bank section saved, with "Saved" beside it', (await stateOf(p, 'bank')) === 'saved' && (await savedWords(p, 'bank')) === 'Saved', await savedWords(p, 'bank'));
    const b1 = await band(p);
    ck('the message band says it is saved, with Undo (screens/messages.js)', /saved/i.test(b1.text) && b1.undo, JSON.stringify(b1));
    await saveSec(p, 'pay');
    ck('blank pay: says what is needed next to it, focused', (await errOf(p, 's3PayAmt')) === 'Type how much Pay is' && (await focused(p)) === 's3PayAmt', (await errOf(p, 's3PayAmt')) + ' / ' + (await focused(p)));
    await typeIn(p, '#s3PayAmt', '0'); await saveSec(p, 'pay');
    ck('a pay of 0: build_book\'s words next to it', (await errOf(p, 's3PayAmt')) === 'A pay needs an amount. If it comes when it comes, pick No fixed pay', await errOf(p, 's3PayAmt'));
    await typeIn(p, '#s3PayAmt', '250000'); await p.selectOption('#s3PayEvery', 'weeks2'); await w(100);
    await saveSec(p, 'pay');
    ck('blank day of one pay: says what is needed next to it, focused', (await errOf(p, 's3PayStart')) === 'Type the day of one pay, the last one or the next one' && (await focused(p)) === 's3PayStart', (await errOf(p, 's3PayStart')) + ' / ' + (await focused(p)));
    await p.fill('#s3PayStart', '2026-11-27');
    await p.click('#s3AddPay'); await w(100);
    await saveSec(p, 'pay');
    ck('blank second income: says what is needed next to it, focused', (await errOf(p, 's3-pay2-a')) === 'Type how much Second income is' && (await focused(p)) === 's3-pay2-a', (await errOf(p, 's3-pay2-a')) + ' / ' + (await focused(p)));
    await typeIn(p, '#s3-pay2-a', '20000'); await p.selectOption('#s3-pay2-e', 'weeks4'); await w(100);
    await saveSec(p, 'pay');
    ck('blank day of one second income: says what is needed next to it, focused', (await errOf(p, 's3-pay2-st')) === 'Type the day of one pay, the last one or the next one' && (await focused(p)) === 's3-pay2-st', (await errOf(p, 's3-pay2-st')) + ' / ' + (await focused(p)));
    await p.fill('#s3-pay2-st', '2026-11-20');
    await saveSec(p, 'pay');
    ck('pay section saved', (await stateOf(p, 'pay')) === 'saved', await stateOf(p, 'pay'));
    await saveSec(p, 'free');
    ck('everyday spending left blank (optional): saved', (await stateOf(p, 'free')) === 'saved' && (await errOf(p, 's3Free')) !== 'x', await stateOf(p, 'free'));
    await p.click('#s3AddCard'); await w(100);
    await saveSec(p, 'cards');
    ck('blank card amount: says what is needed next to it, focused', (await errOf(p, 's3-card1-o')) === 'Type what is on Card now, or 0' && (await focused(p)) === 's3-card1-o', (await errOf(p, 's3-card1-o')) + ' / ' + (await focused(p)));
    await typeIn(p, '#s3-card1-o', '12000'); await saveSec(p, 'cards');
    ck('cards section saved', (await stateOf(p, 'cards')) === 'saved');
    await p.click('#s3AddBill'); await w(100);
    await saveSec(p, 'bills');
    ck('blank bill amount: says what is needed next to it, focused', (await errOf(p, 's3-bill1-a')) === 'Type the amount of Bill' && (await focused(p)) === 's3-bill1-a', (await errOf(p, 's3-bill1-a')) + ' / ' + (await focused(p)));
    /* K32: a bill of 0 is refused with Plan's own words, as Plan refuses it */
    await typeIn(p, '#s3-bill1-a', '0'); await saveSec(p, 'bills');
    ck('a bill of 0: Plan\'s words next to it, focused, not saved', (await errOf(p, 's3-bill1-a')) === 'Type the amount above zero' && (await focused(p)) === 's3-bill1-a' && (await stateOf(p, 'bills')) !== 'saved', (await errOf(p, 's3-bill1-a')) + ' / ' + (await focused(p)));
    await typeIn(p, '#s3-bill1-a', '8000'); await saveSec(p, 'bills');
    ck('bills section saved', (await stateOf(p, 'bills')) === 'saved');
    await saveSec(p, 'min');
    ck('keep at least left blank (optional): saved', (await stateOf(p, 'min')) === 'saved');
    await p.click('#a3SetupSave'); await w(700);
    ck('every section saved: See my money keeps the book and Home shows', await p.$eval('#a3Setup', e => e.hidden), await txt(p, '#a3SetupErr'));
    await c.close();
  }
  /* 3: a bill and a card can be removed, with Undo */
  {
    const { c, p } = await openSetup('2026-12-01');
    await typeIn(p, '#s3Bank', '300000'); await typeIn(p, '#s3PayAmt', '250000'); await p.selectOption('#s3PayDay', '25');
    for (const [k, name, amt, day] of [[1, 'Rent', 72000, '27'], [2, 'Phone', 4800, '20']]) {
      await p.click('#s3AddBill'); await w(100);
      await typeIn(p, `[data-row=bill${k}] [data-f=name]`, name); await typeIn(p, `[data-row=bill${k}] [data-f=amount]`, amt); await p.selectOption(`[data-row=bill${k}] [data-f=day]`, day);
    }
    await saveSec(p, 'bills');
    ck('a bill row has its own Remove', !!(await p.$('[data-row=bill1] [data-remove]')));
    await p.click('[data-row=bill1] [data-remove]'); await w(200);
    ck('Rent removed from setup', !(await p.$('[data-row=bill1]')) && !!(await p.$('[data-row=bill2]')));
    const b = await band(p);
    ck('the band says Rent removed, with Undo', /Rent removed/.test(b.text) && b.undo, JSON.stringify(b));
    ck('the bills section is not saved yet after the removal', (await stateOf(p, 'bills')) === 'changed' && (await savedWords(p, 'bills')) === 'Not saved yet', await savedWords(p, 'bills'));
    await p.click('#a3Msg button'); await w(250);
    ck('Undo puts Rent back as it was', (await val(p, '[data-row=bill1] [data-f=name]')) === 'Rent' && (await val(p, '[data-row=bill1] [data-f=amount]')) === '72000' && (await val(p, '[data-row=bill1] [data-f=day]')) === '27', await val(p, '[data-row=bill1] [data-f=amount]'));
    ck('and the bills section is as saved again', (await stateOf(p, 'bills')) === 'saved');
    await p.click('[data-row=bill1] [data-remove]'); await w(200);
    await p.click('#s3AddCard'); await w(100);
    await p.click('[data-row=card1] [data-remove]'); await w(200);
    ck('a card can be removed too', !(await p.$('[data-row=card1]')));
    /* M13: a bank row too (a second bank added in setup), with Undo */
    await p.click('#s3AddAcct'); await w(100);
    await typeIn(p, '[data-row=acct2] [data-f=name]', 'Savings'); await typeIn(p, '[data-row=acct2] [data-f=amount]', '5000');
    await p.click('[data-row=acct2] [data-remove]'); await w(200);
    const ba = await band(p);
    ck('M13: a second bank can be removed, with Undo', !(await p.$('[data-row=acct2]')) && /Savings removed/.test(ba.text) && ba.undo, JSON.stringify(ba));
    await p.click('#a3Msg button'); await w(250);
    ck('M13: Undo puts the bank back as it was', (await val(p, '[data-row=acct2] [data-f=name]')) === 'Savings' && (await val(p, '[data-row=acct2] [data-f=amount]')) === '5000');
    await p.click('[data-row=acct2] [data-remove]'); await w(200);
    const e = await saveSections(p);
    ck('every section saves', e === '', e);
    await p.click('#a3SetupSave'); await w(700);
    ck('saved', await p.$eval('#a3Setup', e => e.hidden), await txt(p, '#a3SetupErr'));
    const bk = await L.readBook(p), names = (bk.schedules || []).filter(s => !s.gone).map(s => s.name);
    ck('the book has Phone and not the removed Rent', names.includes('Phone') && !names.includes('Rent'), names.join(','));
    ck('M13: the book has no Savings account', !(bk.accounts || []).some(a => a.name === 'Savings'), (bk.accounts || []).map(a => a.name).join(','));
    await c.close();
  }
  /* 5: each section saved on its own, Undo, and a reload half way */
  {
    const { c, p } = await openSetup('2026-11-24');
    await typeIn(p, '#s3Bank', '286000'); await saveSec(p, 'bank');
    await typeIn(p, '#s3PayAmt', '180000'); await p.selectOption('#s3PayDay', '10'); await saveSec(p, 'pay');
    ck('pay saved on its own', (await stateOf(p, 'pay')) === 'saved' && (await savedWords(p, 'pay')) === 'Saved');
    await typeIn(p, '#s3PayAmt', '190000');
    ck('a change after saving says not saved yet', (await stateOf(p, 'pay')) === 'changed' && (await savedWords(p, 'pay')) === 'Not saved yet', await savedWords(p, 'pay'));
    await saveSec(p, 'pay');
    ck('saved again', (await stateOf(p, 'pay')) === 'saved');
    await p.click('#a3Msg button'); await w(300);
    ck('Undo takes back that save: the pay is 180,000 again, as saved', (await val(p, '#s3PayAmt')) === '180000' && (await stateOf(p, 'pay')) === 'saved', await val(p, '#s3PayAmt'));
    let d = await device(p);
    ck('the draft on this device holds the pay as 180,000', d && d.device && d.device.setup && d.device.setup.sections.pay.v.s3PayAmt === '180000', JSON.stringify(d && d.device));
    ck('and nothing typed is held for the pay: the 190,000 taken back is not kept as typed', d && d.device && d.device.setup && !(d.device.setup.typed || {}).pay, JSON.stringify(d && d.device && d.device.setup && d.device.setup.typed));
    ck('a partly done setup is a draft, not a book: nothing is kept as a book yet', d && !d.book, JSON.stringify(d && d.book));
    /* the same again with the typed-keeping timer already run before Undo, and one still waiting when Undo is pressed */
    for (const [wait, how] of [[600, 'after the typed 190,000 was kept'], [0, 'pressed at once']]) {
      await typeIn(p, '#s3PayAmt', '190000'); await saveSec(p, 'pay'); await w(wait);
      await p.click('#a3Msg button'); await w(700);
      d = await device(p);
      const su = d && d.device && d.device.setup;
      ck(`Undo ${how}: the draft holds the pay as 180,000 saved, nothing typed`, su && su.sections.pay.v.s3PayAmt === '180000' && !(su.typed || {}).pay && (await val(p, '#s3PayAmt')) === '180000' && (await stateOf(p, 'pay')) === 'saved', JSON.stringify(su));
    }
    await p.click('#s3AddBill'); await w(100);
    await typeIn(p, '[data-row=bill1] [data-f=name]', 'Rent'); await typeIn(p, '[data-row=bill1] [data-f=amount]', '72000');
    await p.click('#a3SetupSave'); await w(300);
    ck('See my money with a section not saved: says which, setup stays open', /Your bills/.test(await txt(p, '#a3SetupErr')) && !(await p.$eval('#a3Setup', e => e.hidden)), await txt(p, '#a3SetupErr'));
    ck('and puts you on that section\'s Save', (await focused(p)) === 'save:bills', await focused(p));
    /* leave half way: a reload */
    await p.reload(); await w(700);
    ck('after a reload half way, setup opens again by itself', !(await p.$eval('#a3Setup', e => e.hidden)));
    ck('what was saved is back: the bank 286,000 and the pay 180,000', (await val(p, '#s3Bank')) === '286000' && (await val(p, '#s3PayAmt')) === '180000' && (await val(p, '#s3PayDay')) === '10', (await val(p, '#s3Bank')) + ' ' + (await val(p, '#s3PayAmt')));
    ck('with Saved beside them', (await savedWords(p, 'bank')) === 'Saved' && (await savedWords(p, 'pay')) === 'Saved');
    /* [SORTED C1] what was typed and not saved comes back too, still not saved (not counted) */
    ck('what was typed but not saved is back, still Not saved yet', (await val(p, '[data-row=bill1] [data-f=name]')) === 'Rent' && (await stateOf(p, 'bills')) === 'changed', await stateOf(p, 'bills'));
    d = await device(p);
    ck('still no book after the reload', d && !d.book);
    await p.selectOption('[data-row=bill1] [data-f=day]', '27');
    const e = await saveSections(p);
    ck('every section saves', e === '', e);
    await p.click('#a3SetupSave'); await w(700);
    ck('See my money: the book is built and Home shows', await p.$eval('#a3Setup', e => e.hidden), await txt(p, '#a3SetupErr'));
    ck('Home shows the bank saved half way, 286,000', (await homeBank(p)) === 286000, await homeBank(p));
    d = await device(p);
    ck('the draft is cleared once the book is kept', d && d.book && !(d.device && d.device.setup), JSON.stringify(d && d.device));
    await p.reload(); await w(600);
    ck('after a reload Home shows, not setup', await p.$eval('#a3Setup', e => e.hidden) && (await homeBank(p)) === 286000);
    await c.close();
  }
  /* 5c (SORTED C1, M16, M61): a section typed but not saved is not lost on a reload: what was typed comes back, still
     "Not saved yet" (not counted until its Save) */
  {
    const { c, p } = await openSetup('2026-11-24');
    await typeIn(p, '#s3Bank', '286000'); await saveSec(p, 'bank');
    await typeIn(p, '#s3PayAmt', '180000'); await p.selectOption('#s3PayDay', '10');
    await p.click('#s3AddBill'); await w(100); await typeIn(p, '[data-row=bill1] [data-f=name]', 'Rent');
    await w(800);
    await p.reload(); await w(700);
    ck('C1: after a reload, setup is back', !(await p.$eval('#a3Setup', e => e.hidden)));
    ck('C1: the pay typed but not saved is still there, with its day', (await val(p, '#s3PayAmt')) === '180000' && (await val(p, '#s3PayDay')) === '10', await val(p, '#s3PayAmt'));
    ck('C1: the bill typed is still there', (await val(p, '[data-row=bill1] [data-f=name]')) === 'Rent');
    ck('C1: those sections still say Not saved yet; the bank says Saved', (await stateOf(p, 'pay')) === 'changed' && (await savedWords(p, 'pay')) === 'Not saved yet' && (await stateOf(p, 'bills')) === 'changed' && (await savedWords(p, 'bank')) === 'Saved', await savedWords(p, 'pay'));
    const d = await device(p);
    ck('C1: what was typed is not counted: still no book, and the pay is not among the saved sections', d && !d.book && !(d.device.setup.sections || {}).pay, JSON.stringify(d && d.device && d.device.setup && Object.keys(d.device.setup.sections || {})));
    await p.click('#a3SetupSave'); await w(300);
    ck('C1: See my money still asks for the pay to be saved first', /Your pay/.test(await txt(p, '#a3SetupErr')), await txt(p, '#a3SetupErr'));
    await typeIn(p, '[data-row=bill1] [data-f=amount]', '72000');
    const e = await saveSections(p);
    ck('C1: every section saves', e === '', e);
    await p.click('#a3SetupSave'); await w(700);
    ck('C1: Home shows', await p.$eval('#a3Setup', e => e.hidden) && (await homeBank(p)) === 286000);
    await w(800);
    const d2 = await device(p);
    ck('C1: the draft is cleared, nothing typed left behind', d2 && d2.book && !(d2.device && d2.device.setup), JSON.stringify(d2 && d2.device));
    await c.close();
  }
  /* 5d (M16, M61): Undo of a Save pressed on Home after Back takes back that Save only: what was typed in another
     section and not saved stays in the draft */
  {
    const { c, p } = await openSetup('2026-11-24');
    await typeIn(p, '#s3Bank', '286000'); await saveSec(p, 'bank');
    await p.click('#s3AddBill'); await w(100); await typeIn(p, '[data-row=bill1] [data-f=name]', 'Rent');
    await typeIn(p, '#s3PayAmt', '180000'); await p.selectOption('#s3PayDay', '10'); await saveSec(p, 'pay');
    await w(600);
    await p.click('#a3SetupX'); await w(300);
    ck('5d: Back closes setup with Undo for the pay still offered', await p.$eval('#a3Setup', e => e.hidden) && (await band(p)).undo, JSON.stringify(await band(p)));
    await p.click('#a3Msg button'); await w(400);
    const d = await device(p), su = d && d.device && d.device.setup;
    ck('5d: Undo on Home takes back the pay Save and keeps the bill typed', su && !su.sections.pay && !!su.sections.bank && !(su.typed || {}).pay && su.typed && su.typed.bills && su.typed.bills.v && Object.values(su.typed.bills.v).includes('Rent'), JSON.stringify(su));
    await c.close();
  }
  /* 5b: a draft left on one day and picked up on a later day. The bank, an account, a card's amount on it now and which
     bills have left are figures of the day they were typed (LESSONS lesson 1: the only bank figure is what the bank
     shows today): those sections come back with their answers but ask to be checked and saved again; the pay does not */
  {
    const { c, p } = await openSetup('2026-11-24');
    await typeIn(p, '#s3Bank', '286000'); await saveSec(p, 'bank');
    await typeIn(p, '#s3PayAmt', '180000'); await p.selectOption('#s3PayDay', '10'); await saveSec(p, 'pay');
    await p.click('#s3AddCard'); await w(100); await typeIn(p, '#s3-card1-o', '54000'); await saveSec(p, 'cards');
    await go(p, '2026-11-26'); await w(300);
    ck('two days later, setup opens with what was saved', !(await p.$eval('#a3Setup', e => e.hidden)) && (await val(p, '#s3Bank')) === '286000' && (await val(p, '#s3-card1-o')) === '54000');
    ck('the bank asks to be checked again: saved on 24 Nov', (await stateOf(p, 'bank')) === 'stale' && /^Saved on 24 Nov\. Check it still shows the same today, then Save$/.test(await savedWords(p, 'bank')), await savedWords(p, 'bank'));
    ck('the card too', (await stateOf(p, 'cards')) === 'stale', await stateOf(p, 'cards'));
    ck('the pay does not', (await stateOf(p, 'pay')) === 'saved' && (await savedWords(p, 'pay')) === 'Saved', await savedWords(p, 'pay'));
    await p.click('#a3SetupSave'); await w(300);
    ck('See my money first asks for the bank to be checked', /Your bank/.test(await txt(p, '#a3SetupErr')) && !(await p.$eval('#a3Setup', e => e.hidden)), await txt(p, '#a3SetupErr'));
    await typeIn(p, '#s3Bank', '279000');
    const e = await saveSections(p);
    ck('checked and saved again', e === '' && (await stateOf(p, 'bank')) === 'saved', e);
    await p.click('#a3SetupSave'); await w(700);
    ck('Home shows the bank as checked on 26 Nov, 279,000', (await homeBank(p)) === 279000, await homeBank(p));
    await c.close();
  }
  /* 6 (BV2.13, M36, M37): set up on pay day. foundation_review/scenarios/notyet_opening.json: Fri 25 Jun 2027, the bank
     shows 40,000, pay 250,000 on the 25th (the working day before), rent 80,000 on the 27th (Sun: Mon 28 Jun), Free to
     spend 60,000. Not landed yet: the pay stays to come (the opening check's notYet) and ny-01 says safe to spend is
     40,000; Home says it includes today's pay, not in the bank yet. Landed: the 40,000 holds the pay, rent leaves 40,000
     short, safe to spend 0. Not on a pay day: no question. An answer is required. */
  for (const answer of ['no', 'yes']) {
    const { c, p } = await openSetup('2027-06-25');
    await typeIn(p, '#s3Bank', '40000'); await typeIn(p, '#s3PayAmt', '250000'); await p.selectOption('#s3PayDay', '10'); await w(150);
    ck(answer + ': not a pay day (the 10th): no question about today\'s pay', await p.$eval('[data-q=payToday]', e => e.hidden));
    await p.selectOption('#s3PayDay', '25'); await w(150);
    ck(answer + ': on the pay day the question shows, in the bank section', !(await p.$eval('[data-q=payToday]', e => e.hidden)) && !!(await p.$('[data-sec=bank] #s3PayToday'))
      && (await txt(p, 'label[for=s3PayToday]')) === 'Your pay lands today. Has today\'s pay already landed in that figure?', await txt(p, 'label[for=s3PayToday]'));
    await p.click('#s3AddBill'); await w(100);
    await typeIn(p, '[data-row=bill1] [data-f=name]', 'Rent'); await typeIn(p, '[data-row=bill1] [data-f=amount]', '80000'); await p.selectOption('[data-row=bill1] [data-f=day]', '27');
    await typeIn(p, '#s3Free', '60000');
    const e0 = await saveSections(p);
    ck(answer + ': saving without an answer asks it next to the box', e0 === 'Say whether today\'s pay is already in that figure' && (await focused(p)) === 's3PayToday', e0);
    await p.selectOption('#s3PayToday', answer);
    const e = await saveSections(p);
    ck(answer + ': every section saves', e === '', e);
    await p.click('#a3SetupSave'); await w(700);
    ck(answer + ': saved', await p.$eval('#a3Setup', e => e.hidden), await txt(p, '#a3SetupErr'));
    const bk = await L.readBook(p), check = bk.events.find(x => x.k === 'check' && bk.accounts.find(a => a.id === x.acct && a.type === 'bank'));
    const safe = await p.$eval('#a3Home [data-fig="safe"]', e => Number((e.dataset.amt !== undefined ? e : e.querySelector('[data-amt]')).dataset.amt)).catch(() => null);
    const home = await txt(p, '#a3Home');
    if (answer === 'no') {
      ck('not yet: the opening check names today\'s pay as still to come', (check.notYet || []).length === 1 && /@2027-06-25$/.test(check.notYet[0]), JSON.stringify(check.notYet));
      ck('not yet: safe to spend 40,000 (ny-01)', safe === 40000, safe);
      ck('not yet: Home says it includes today\'s pay of ¥250,000, not in your bank yet', /includes today's pay of ¥250,000, not in your bank yet/.test(home), home);
    } else {
      ck('landed: nothing named as still to come', !(check.notYet || []).length, JSON.stringify(check.notYet));
      ck('landed: safe to spend 0 (the pay is inside the 40,000; rent leaves it 40,000 short)', safe === 0, safe);
      ck('landed: no "not in your bank yet" words', !/not in your bank yet/.test(home), home);
    }
    ck(answer + ': the next pay never reads "in null days"', !/null/.test(home), home);
    await c.close();
  }
  /* 7: an amount typed with a comma stays saved (qc-novice on 3a4f514, three phones: "182,400" saved, then the part fell
     back to "Not saved yet" when the next part was saved, and See my money refused). A part is compared by the VALUE of
     each amount box, never its text. Save is pressed without leaving the box first, as a phone's tap on a button does. */
  {
    const { c, p } = await openSetup('2026-11-24');
    const put = (sel, t) => p.$eval(sel, (e, t) => { e.focus(); e.value = t; e.dispatchEvent(new Event('input', { bubbles: true })); }, t);
    const press = sec => p.$eval(`#a3Setup [data-save=${sec}]`, e => e.click());
    await put('#s3Bank', '182,400'); await press('bank'); await w(300);
    ck('comma: the bank part says Saved', (await stateOf(p, 'bank')) === 'saved', await savedWords(p, 'bank'));
    await put('#s3PayAmt', '231,000'); await p.selectOption('#s3PayDay', '25'); await press('pay'); await w(300);
    ck('comma: after the pay part is saved, the bank part is still Saved', (await stateOf(p, 'bank')) === 'saved', await savedWords(p, 'bank'));
    await put('#s3Free', '６０，０００'); await press('free'); await w(300);
    await p.click('#s3AddCard'); await w(100); await put('[data-row=card1] [data-f=owed]', '48,000'); await press('cards'); await w(300);
    await p.click('#s3AddBill'); await w(100); await put('[data-row=bill1] [data-f=name]', 'Rent'); await put('[data-row=bill1] [data-f=amount]', '72 000'); await press('bills'); await w(300);
    await put('#s3Min', '¥10,000'); await press('min'); await w(300);
    await p.evaluate(() => document.activeElement && document.activeElement.blur()); await w(200);
    const states = []; for (const sec of ['bank', 'pay', 'free', 'cards', 'bills', 'min']) states.push(sec + ':' + await stateOf(p, sec));
    ck('comma: all six parts are still Saved after every box is left', states.every(x => /:saved$/.test(x)), states.join(' '));
    await p.reload(); await w(500);
    if (await p.$('#a3SetupGo')) { await p.click('#a3SetupGo').catch(() => {}); await w(300); }
    const states2 = []; for (const sec of ['bank', 'pay', 'free', 'cards', 'bills', 'min']) states2.push(sec + ':' + await stateOf(p, sec));
    ck('comma: all six parts are Saved after a reload', states2.every(x => /:saved$/.test(x)), states2.join(' '));
    await p.click('#a3SetupSave'); await w(700);
    ck('comma: See my money keeps the book', await p.$eval('#a3Setup', e => e.hidden), await txt(p, '#a3SetupErr'));
    const bk = await L.readBook(p);
    const bank = bk && bk.events.find(x => x.k === 'check');
    ck('comma: the bank in the book is 182,400', !!bank && JSON.stringify(bank).includes('182400'), JSON.stringify(bank));
    ck('comma: Home shows the bank as ¥182,400', (await homeBank(p)) === 182400, await homeBank(p));
    await c.close();
  }
  /* 6: leaving a box never moves the row's Remove (found by LANE B): what a row shows is worked out while the person
     types, so a tap on Remove straight after typing lands on Remove. A real tap at the place the button was. */
  {
    const { c, p } = await openSetup('2026-11-24');
    await typeIn(p, '#s3Bank', '300000'); await typeIn(p, '#s3PayAmt', '250000'); await p.selectOption('#s3PayDay', '25');
    const top = sel => p.$eval(sel, e => Math.round(e.getBoundingClientRect().top + scrollY));
    for (const [kind, add, f, typed] of [['bill', '#s3AddBill', 'name', 'Gym and swimming'], ['bill', '#s3AddBill', 'amount', '4800'], ['card', '#s3AddCard', 'owed', '52000'], ['card', '#s3AddCard', 'name', 'Everyday card'], ['pay', '#s3AddPay', 'amount', '30000']]) {
      await p.click(add); await w(150);
      const row = kind === 'pay' ? '[data-row=pay2]' : `[data-row^=${kind}]`, rm = row + ' [data-remove]';
      await p.focus(`${row} [data-f=${f}]`); await p.keyboard.type(typed, { delay: 20 }); await w(400);
      const before = await top(rm);
      const box = await p.$eval(rm, e => { e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
      await p.mouse.click(box.x, box.y); await w(250);
      const gone = !(await p.$(row));
      ck(`${kind}, after typing its ${f}: a tap where Remove was takes the row out`, gone, gone ? '' : `Remove was at ${before}, now at ${await top(rm)}`);
      if (!gone) { await p.click(rm); await w(150); }
    }
    await c.close();
  }
  /* 7: an account taken out of setup never moves a bill, a card or a pay onto another account (setup3 reads its boxes
     through answers3, which names accounts by their place; a row keeps its own key when one before it is removed) */
  {
    const { c, p } = await openSetup('2026-11-24');
    await typeIn(p, '#s3Bank', '300000'); await typeIn(p, '#s3PayAmt', '250000'); await p.selectOption('#s3PayDay', '25');
    await p.click('#s3AddAcct'); await w(120);
    await typeIn(p, '[data-row=acct2] [data-f=name]', 'Coin jar'); await typeIn(p, '[data-row=acct2] [data-f=amount]', '900'); await p.selectOption('[data-row=acct2] [data-f=type]', 'cash');
    await p.click('#s3AddAcct'); await w(120);
    await typeIn(p, '[data-row=acct3] [data-f=name]', 'Second bank'); await typeIn(p, '[data-row=acct3] [data-f=amount]', '41000'); await p.selectOption('[data-row=acct3] [data-f=type]', 'bank');
    await p.click('#s3AddBill'); await w(120);
    await typeIn(p, '[data-row=bill1] [data-f=name]', 'Gym'); await typeIn(p, '[data-row=bill1] [data-f=amount]', '4800'); await p.selectOption('[data-row=bill1] [data-f=day]', '28');
    await p.selectOption('[data-row=bill1] [data-f=from]', 'acct3');
    await p.click('#s3AddCard'); await w(120);
    await typeIn(p, '[data-row=card1] [data-f=name]', 'Everyday card'); await typeIn(p, '[data-row=card1] [data-f=owed]', '12000');
    await p.selectOption('[data-row=card1] [data-f=payFrom]', 'acct3');
    await p.click('[data-row=acct2] [data-remove]'); await w(250);
    ck('account removed: the bill and the card still say Second bank', (await val(p, '[data-row=bill1] [data-f=from]')) === 'acct3' && (await val(p, '[data-row=card1] [data-f=payFrom]')) === 'acct3' && !(await p.$('[data-row=acct2]')));
    const err = await saveSections(p);
    await p.click('#a3SetupSave'); await w(700);
    const bk = (await device(p)).book;
    const acct = id => (((bk || {}).accounts || []).find(a => a.id === id) || {}).name;
    const names = ((bk || {}).accounts || []).map(a => a.name);
    const bill = ((bk || {}).schedules || []).find(s => s.kind === 'bill' && s.name === 'Gym');
    const card = ((bk || {}).accounts || []).find(a => a.name === 'Everyday card');
    const field = x => (x && typeof x === 'object' && 'v' in x ? x.v : x);   // a stamped field or a plain one
    ck('account removed: the book is kept, with Second bank and no Coin jar', !err && !!bk && names.includes('Second bank') && !names.includes('Coin jar'), err || JSON.stringify(names));
    ck('account removed: the Gym bill leaves from Second bank', !!bill && acct(bill.acct) === 'Second bank', bill && acct(bill.acct));
    ck('account removed: the card is paid from Second bank', !!card && acct(field(card.payFrom)) === 'Second bank', JSON.stringify(card && card.payFrom));
    await c.close();
  }
  /* 8 (AI_JOIN_FIXES I1): two bills (or two cards) with no name: the words sit next to the rows, at that section's own
     Save, not only at See my money; the section is not saved until each has its own name */
  {
    const { c, p } = await openSetup('2026-11-24');
    await p.click('#s3AddBill'); await w(120); await p.click('#s3AddBill'); await w(120);
    await typeIn(p, '[data-row=bill1] [data-f=amount]', '4800'); await typeIn(p, '[data-row=bill2] [data-f=amount]', '5200');
    await saveSec(p, 'bills');
    ck('I1: two bills with no name: said next to the second one at Save', (await errOf(p, 's3-bill2-n')) === 'There are two called Bill. Give each its own name', await errOf(p, 's3-bill2-n'));
    ck('I1: its name box is focused, and the section is not saved', (await focused(p)) === 's3-bill2-n' && (await stateOf(p, 'bills')) !== 'saved', await focused(p));
    await typeIn(p, '[data-row=bill2] [data-f=name]', 'Internet'); await w(400);   // the row's question words follow the name a moment after typing
    await saveSec(p, 'bills');
    ck('I1: named, it saves', (await stateOf(p, 'bills')) === 'saved', await errOf(p, 's3-bill2-n'));
    await p.click('#s3AddCard'); await w(120); await p.click('#s3AddCard'); await w(120);
    await typeIn(p, '[data-row=card1] [data-f=owed]', '1000'); await typeIn(p, '[data-row=card2] [data-f=owed]', '2000');
    await saveSec(p, 'cards');
    ck('I1: two cards with no name: said next to the second one at Save', (await errOf(p, 's3-card2-n')) === 'There are two called Card. Give each its own name', await errOf(p, 's3-card2-n'));
    await c.close();
  }
  await L.finish();
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
