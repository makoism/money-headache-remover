#!/usr/bin/env node
/* Home's bank today in its parts (QC F4): once something is logged after the last check, the figure is no longer the
   check, so the line under it says both parts, from the engine (accounts.*.checked, loggedOut, loggedIn), never
   "checked today" beside a figure that moved. Made-up US dollars: set up 1 Dec with Checking $2,000.00.
   2 Dec, nothing logged: "checked yesterday, on 1 Dec".
   2 Dec, a spend of $15.50 logged: $1,984.50, "$2,000.00 checked 1 Dec, $15.50 out logged since".
   2 Dec, also $40.00 in: $2,024.50, "$2,000.00 checked 1 Dec, $15.50 out and $40.00 in logged since". */
'use strict';
const T = require('./lib3.js');
const { ck } = T;
const B = require('../../engine/build_book.js'), I = require('../../engine/ids.js');
const DAY = '2026-12-02';
const usBook = more => {
  const { book, ids } = B.buildBook({ day: '2026-12-01', told: '2026-12-01T09:00-05:00', country: 'US', currency: 'USD',
    banks: [{ key: 'chk', name: 'Checking', amount: 200000 }],
    pays: [{ key: 'pay', name: 'Pay', bank: 'chk', amount: 250000, day: 25, shift: 'none', startsPeriod: true }] }, { newId: I.idMaker('usd004', () => 0.6) });
  const ev = (id, k, a, x) => Object.assign({ id: 'usd004-zzzzzzzzzz-' + id, k, acct: ids.chk, date: DAY, a, told: DAY + 'T10:00-05:00', at: DAY + 'T10:00-05:00', by: 'usd004' }, x);
  if (more >= 1) book.events.push(ev(901, 'spend', 1550));
  if (more >= 2) book.events.push(ev(902, 'in', 4000, { sub: 'other' }));
  return book;
};
async function home(bk) {
  const prof = require('fs').mkdtempSync(require('os').tmpdir() + '/a3prof-');
  const { b, p, errs } = await T.open({ profile: prof });
  await p.goto(T.URL0 + '?today=' + DAY); await T.w(300);
  await p.evaluate(async bk0 => { const s = await BurrowStore.open(); await s.save(bk0, { full: true }); s.db && s.db.close(); }, bk);
  await p.reload(); await T.w(400);
  const f = await T.figs(p);
  await b.close();
  return { bank: f.find(x => x.fig === 'bank'), age: f.find(x => x.fig === 'age'), errs };
}
(async () => {
  for (const [more, amt, line] of [[0, 200000, 'checked yesterday, on 1 Dec'], [1, 198450, '$2,000.00 checked 1 Dec, $15.50 out logged since'],
    [2, 202450, '$2,000.00 checked 1 Dec, $15.50 out and $40.00 in logged since']]) {
    const bk = usBook(more), r = T.L.lookahead(bk, DAY);
    const { bank, age, errs } = await home(bk);
    ck(`${more}: bank today is the engine's`, bank && bank.amt === amt && r.accounts[Object.keys(r.accounts)[0]].bank === amt, JSON.stringify(bank));
    ck(`${more}: the line under it: ${line}`, age && age.text === line, age && age.text);
    ck(`${more}: no page errors`, errs.length === 0, errs.join(' | '));
  }
  T.done('e3_bankparts');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
