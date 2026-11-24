#!/usr/bin/env node
/* Setup for the other lives (slice 6, app3/SLICE6.md first item), through the page as a plain file, made-up amounts.
   - The country is chosen, not guessed: it follows the money only until the person picks one.
   - More than one account (a second bank, an e-wallet, cash), each with what it holds today.
   - Pay on two days each month, every 2 weeks from the day of one pay, or no fixed pay; a second income on its own day
     into another account; a card paid from the second bank; bills from the account they leave and once a year.
   What is saved is read back from the store (IndexedDB burrow3) and checked against the answers. */
'use strict';
const { finishSetup: finishSetup3 } = require('./setup_sections.js');   // setup is saved one section at a time (item 14)
const T = require('./lib3.js'), { ck } = T;
const typeIn = async (p, sel, v) => { await p.click(sel, { clickCount: 3 }); await p.keyboard.press('Backspace'); await p.type(sel, String(v)); };
/* the kept book, as the store holds it */
const readBook = p => p.evaluate(() => new Promise(res => {
  const rq = indexedDB.open('burrow3');
  rq.onsuccess = () => {
    const db = rq.result, tx = db.transaction(['book', 'events']), out = {};
    tx.objectStore('book').get('book').onsuccess = e => { out.book = e.target.result; };
    tx.objectStore('events').getAll().onsuccess = e => { out.events = e.target.result; };
    tx.oncomplete = () => { db.close(); res(Object.assign({}, out.book, { events: out.events })); };
  };
  rq.onerror = () => res(null);
}));
const sel = (p, s, v) => p.select(s, v);
async function fresh(day) {
  const o = await T.open({ profile: require('fs').mkdtempSync(require('os').tmpdir() + '/a3setup6-') });
  await o.p.goto(T.URL0 + '?today=' + day); await T.w(400);
  await o.p.click('#a3SetupGo'); await T.w(300);
  return o;
}
const shown = (p, s) => p.$eval(s, e => !e.closest('[hidden]')).catch(() => false);
(async () => {
  /* 1. the country: from the money until picked */
  {
    const o = await fresh('2026-12-01'), p = o.p;
    ck('yen: Japan', (await p.$eval('#s3Country', e => e.value)) === 'JP');
    await sel(p, '#s3Cur', 'PHP'); ck('pesos: the Philippines', (await p.$eval('#s3Country', e => e.value)) === 'PH');
    await sel(p, '#s3Cur', 'USD'); ck('dollars: somewhere else, weekends only', (await p.$eval('#s3Country', e => e.value)) === 'XX');
    await sel(p, '#s3Country', 'JP'); await sel(p, '#s3Cur', 'EUR');
    ck('once picked, the country stays when the money changes (euros banked in Japan)', (await p.$eval('#s3Country', e => e.value)) === 'JP');
    ck('one account: no "lands in" or "paid from" choice', !(await shown(p, '#s3PayAcct')));
    ck('a day each month is the first choice, with its day box', (await p.$eval('#s3PayEvery', e => e.value)) === 'month' && await shown(p, '#s3PayDay') && !(await shown(p, '#s3PayStart')));
    await b(o);
  }
  /* 2. Lia: pesos, the Philippines; Bank A ₱18,000, Bank B ₱6,000, GCash ₱1,500; pay ₱15,000 on the 15th and the last
     day (the working day before); a side gig ₱4,000 on the 5th into GCash; card A ₱3,000 from Bank A on the 20th, card
     B ₱1,200 from Bank B on the 25th; rent ₱8,000 on the 1st from Bank A, internet ₱1,500 on the 10th from Bank B */
  {
    const o = await fresh('2026-12-01'), p = o.p;
    await sel(p, '#s3Cur', 'PHP');
    await typeIn(p, '#s3BankName', 'Bank A'); await typeIn(p, '#s3Bank', '18000');
    for (const [k, name, amt, type] of [[2, 'Bank B', 6000, 'bank'], [3, 'GCash', 1500, 'ewallet']]) {
      await p.click('#s3AddAcct'); await T.w(100);
      const r = `[data-row=acct${k}] `;
      await typeIn(p, r + '[data-f=name]', name); await typeIn(p, r + '[data-f=amount]', amt); await sel(p, r + '[data-f=type]', type);
    }
    await typeIn(p, '#s3PayName', 'Salary'); await typeIn(p, '#s3PayAmt', '15000');
    await sel(p, '#s3PayEvery', 'days'); await T.w(100);
    ck('two days each month: a second day box', await shown(p, '#s3PayDay2'));
    await sel(p, '#s3PayDay', '15'); await sel(p, '#s3PayDay2', 'last'); await sel(p, '#s3PayShift', 'before');
    ck('more than one account: "It lands in" is asked, naming each', await shown(p, '#s3PayAcct') && (await p.$$eval('#s3PayAcct option', os => os.map(o => o.textContent))).join() === 'Bank A,Bank B,GCash');
    await p.click('#s3AddPay'); await T.w(100);
    await typeIn(p, '[data-row=pay2] [data-f=name]', 'Side gig'); await typeIn(p, '[data-row=pay2] [data-f=amount]', '4000');
    ck('the second income starts on the same days as the pay', (await p.$eval('[data-row=pay2] [data-f=every]', e => e.value)) === 'same' && !(await shown(p, '[data-row=pay2] [data-f=day]')));
    await sel(p, '[data-row=pay2] [data-f=every]', 'month'); await T.w(100); await sel(p, '[data-row=pay2] [data-f=day]', '5'); await sel(p, '[data-row=pay2] [data-f=acct]', 'acct3');
    for (const [k, name, owed, day, from] of [[1, 'Card A', 3000, '20', 'bank1'], [2, 'Card B', 1200, '25', 'acct2']]) {
      await p.click('#s3AddCard'); await T.w(100); const r = `[data-row=card${k}] `;
      await typeIn(p, r + '[data-f=name]', name); await typeIn(p, r + '[data-f=owed]', owed); await sel(p, r + '[data-f=payDay]', day);
      ck(name + ': paid from offers the banks only', (await p.$$eval(r + '[data-f=payFrom] option', os => os.map(o => o.textContent))).join() === 'Bank A,Bank B');
      await sel(p, r + '[data-f=payFrom]', from);
    }
    for (const [k, name, amt, day, from] of [[1, 'Rent', 8000, '1', 'bank1'], [2, 'Internet', 1500, '10', 'acct2']]) {
      await p.click('#s3AddBill'); await T.w(100); const r = `[data-row=bill${k}] `;
      await typeIn(p, r + '[data-f=name]', name); await typeIn(p, r + '[data-f=amount]', amt); await sel(p, r + '[data-f=day]', day); await sel(p, r + '[data-f=from]', from);
    }
    await finishSetup3(p); await T.w(700);
    ck('Lia: saved', await p.$eval('#a3Setup', e => e.hidden), await p.$eval('#a3SetupErr', e => e.textContent).catch(() => ''));
    const bk = await readBook(p), acc = n => bk.accounts.find(a => a.name === n), sch = n => bk.schedules.find(s => s.name === n);
    ck('Lia: the country chosen is saved', bk.home.country.v === 'PH');
    ck('Lia: three accounts with their kinds, Bank A the main one', ['Bank A', 'Bank B', 'GCash'].map(n => acc(n).type).join() === 'bank,bank,ewallet' && bk.home.main.v.acct === acc('Bank A').id);
    const open = n => bk.events.find(e => e.k === 'check' && e.acct === acc(n).id).a;
    ck('Lia: each opens with what it holds today (in centavos)', [open('Bank A'), open('Bank B'), open('GCash')].join() === '1800000,600000,150000');
    ck('Lia: the salary on the 15th and the last day, into Bank A, starting the period', JSON.stringify(sch('Salary').rules[0].rule) === '{"every":"month","days":[15,"last"]}' && sch('Salary').acct === acc('Bank A').id && sch('Salary').startsPeriod === true && sch('Salary').shift === 'before');
    ck('Lia: the side gig on the 5th into GCash', JSON.stringify(sch('Side gig').rules[0].rule) === '{"every":"month","days":[5]}' && sch('Side gig').acct === acc('GCash').id && !sch('Side gig').startsPeriod);
    ck('Lia: each card paid from its own bank', acc('Card A').payFrom === acc('Bank A').id && acc('Card B').payFrom === acc('Bank B').id);
    ck('Lia: each bill from its own account', sch('Rent').acct === acc('Bank A').id && sch('Internet').acct === acc('Bank B').id);
    const banks = await p.$$eval('#a3Home [data-card=bank] h2', es => es.map(e => e.textContent));
    ck('Lia: Home shows each account', banks.length === 3 && /GCash/.test(banks[2]), banks.join(' | '));
    ck('Lia: no page errors', o.errs.length === 0, o.errs.join(' | '));
    await b(o);
  }
  /* 3. Sam: dollars, somewhere else; pay every 2 weeks; the day of one pay is asked; car insurance once a year on 1 Mar */
  {
    const o = await fresh('2026-12-07'), p = o.p;
    await sel(p, '#s3Cur', 'USD');
    await typeIn(p, '#s3BankName', 'Checking'); await typeIn(p, '#s3Bank', '1850');
    await typeIn(p, '#s3PayAmt', '1600'); await sel(p, '#s3PayEvery', 'weeks2'); await T.w(100);
    ck('every 2 weeks: the day of one pay is asked, no day of the month', await shown(p, '#s3PayStart') && !(await shown(p, '#s3PayDay')));
    await p.click('#s3AddBill'); await T.w(100);
    await typeIn(p, '[data-row=bill1] [data-f=name]', 'Car insurance'); await typeIn(p, '[data-row=bill1] [data-f=amount]', '480');
    await sel(p, '[data-row=bill1] [data-f=every]', 'year'); await T.w(100);
    ck('once a year: its month is asked', await shown(p, '[data-row=bill1] [data-f=month]'));
    await sel(p, '[data-row=bill1] [data-f=month]', '03'); await sel(p, '[data-row=bill1] [data-f=day]', '1');
    await finishSetup3(p); await T.w(400);
    ck('Sam: the day of one pay is asked before saving', (await p.$eval('[data-err-for=s3PayStart]', e => e.textContent).catch(() => '')) === 'Type the day of one pay, the last one or the next one' && !(await p.$eval('#a3Setup', e => e.hidden)));
    await p.$eval('#s3PayStart', e => { e.value = '2026-12-04'; e.dispatchEvent(new Event('change', { bubbles: true })); });
    await finishSetup3(p); await T.w(700);
    ck('Sam: saved', await p.$eval('#a3Setup', e => e.hidden), await p.$eval('#a3SetupErr', e => e.textContent).catch(() => ''));
    const bk = await readBook(p), sch = n => bk.schedules.find(s => s.name === n);
    ck('Sam: the pay every 2 weeks from Fri 4 Dec', JSON.stringify(sch('Pay').rules[0].rule) === '{"every":"weeks","n":2,"from":"2026-12-04"}' && sch('Pay').startsPeriod === true);
    ck('Sam: the car insurance once a year on 1 Mar', JSON.stringify(sch('Car insurance').rules[0].rule) === '{"every":"year","date":"03-01"}');
    ck('Sam: somewhere else (weekends only)', bk.home.country.v === 'XX');
    const per = await p.$eval('[data-fig=period]', e => e.textContent).catch(() => '');
    ck('Sam: the pay period runs 4 Dec to 17 Dec', per === '4 Dec to 17 Dec', per);
    ck('Sam: no page errors', o.errs.length === 0, o.errs.join(' | '));
    await b(o);
  }
  /* 4. Kai: yen, no fixed pay, the amount left blank */
  {
    const o = await fresh('2026-12-01'), p = o.p;
    await typeIn(p, '#s3Bank', '420000'); await typeIn(p, '#s3PayName', 'Client work');
    await sel(p, '#s3PayEvery', 'none'); await T.w(100);
    ck('no fixed pay: no day, no weekend rule, and words on what happens instead', !(await shown(p, '#s3PayDay')) && !(await shown(p, '#s3PayShift')) && /Receipts/.test(await p.$eval('[data-card=pay] [data-q=none]', e => e.textContent)));
    await finishSetup3(p); await T.w(700);
    ck('Kai: saved with the amount blank', await p.$eval('#a3Setup', e => e.hidden), await p.$eval('#a3SetupErr', e => e.textContent).catch(() => ''));
    const bk = await readBook(p), s = bk.schedules.find(x => x.name === 'Client work');
    ck('Kai: no fixed day, no amount, not starting a period', JSON.stringify(s.rules[0].rule) === '{"every":"none"}' && s.steps[0].amount === null && !s.startsPeriod);
    const f = await T.figs(p), safe = f.find(x => x.fig === 'safe');
    ck('Kai: Home shows safe to spend: the bank', safe && safe.amt === 420000, JSON.stringify(safe));
    ck('Kai: no page errors', o.errs.length === 0, o.errs.join(' | '));
    await b(o);
  }
  T.done('e3_setup6');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
async function b(o) { await o.b.close(); }
