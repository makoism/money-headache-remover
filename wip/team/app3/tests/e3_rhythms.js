#!/usr/bin/env node
/* Plan names every rhythm (slice 6, app3/SLICE6.md): a day each month, two days, every week, every n weeks with its
   weekday, every few months, set months each year, once a year, once, the last working day, no fixed day. One book
   (made-up yen, set up Tue 1 Dec 2026) with one schedule of each kind, kept through the store; Plan's rows must read: */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const path = require('path');
const B = require(path.join(__dirname, '../../engine/build_book.js')), I = require(path.join(__dirname, '../../engine/ids.js'));
const DAY = '2026-12-01';
const WANT = {
  'Salary': 'day 25 each month',
  'Tips': 'day 15 and the last day each month',
  'Weekly': 'every week, on Fridays',
  'Fortnight': 'every 2 weeks, on Fridays',
  'Water': 'every 2 months, on day 15',
  'Tax': 'each year in May and Nov, on day 31',
  'Car tax': 'each year on 31 May',
  'Course': 'once, on 10 Jan 2027',
  'Pension': 'the last working day of each month',
  'Client work': 'no fixed day',
};
const { book } = B.buildBook({ day: DAY, told: DAY + 'T10:00:00+09:00', country: 'JP', currency: 'JPY',
  banks: [{ key: 'bank', name: 'Bank', amount: 500000 }],
  pays: [{ key: 's', name: 'Salary', bank: 'bank', amount: 200000, day: 25, shift: 'before', startsPeriod: true },
    { key: 't', name: 'Tips', bank: 'bank', amount: 5000, days: [15, 'last'] },
    { key: 'w', name: 'Weekly', bank: 'bank', amount: 1000, every: 'weeks', n: 1, start: '2026-12-04' },
    { key: 'f', name: 'Fortnight', bank: 'bank', amount: 2000, every: 'weeks', n: 2, start: '2026-12-04' },
    { key: 'c', name: 'Client work', bank: 'bank', every: 'none' }],
  bills: [{ key: 'wa', name: 'Water', from: 'bank', amount: 6200, every: 'months', n: 2, start: '2026-12-15', shift: 'after' },
    { key: 'ct', name: 'Car tax', from: 'bank', amount: 34500, every: 'year', date: '05-31', shift: 'after' }] },
{ newId: I.idMaker('rhy7k2') });
/* three rhythms setup does not ask for, written the way Plan or a statement would */
const sch = (id, name, rule) => ({ id: I.idMaker('rhy8m3')(), kind: 'bill', name, acct: book.home.main.v.acct, cur: 'JPY', shift: 'after', told: DAY + 'T10:00:00+09:00', at: DAY + 'T10:00:00+09:00', by: 'rhy8m3',
  rules: [{ from: null, rule }], steps: [{ from: null, amount: 1000 }] });
const mk = I.idMaker('rhy9q4');
for (const [name, rule] of [['Tax', { every: 'monthsList', months: [5, 11], day: 31 }], ['Course', { every: 'once', date: '2027-01-10' }], ['Pension', { every: 'lastWorkday' }]])
  book.schedules.push(Object.assign(sch(null, name, rule), { id: mk() }));
(async () => {
  const prof = require('fs').mkdtempSync(require('os').tmpdir() + '/a3rhy-');
  const { b, p, errs } = await T.open({ profile: prof });
  await p.goto(T.URL0 + '?today=' + DAY); await T.w(300);
  await p.evaluate(async bk => { const s = await BurrowStore.open(); await s.save(bk, { full: true }); if (s.db) s.db.close(); }, book);
  await p.reload(); await T.w(400);
  await p.tap('[data-tab="plan"]'); await T.w(300);
  const rows = await p.$$eval('[data-card=plan-bills] [data-pay], [data-card=plan-bills] [data-bill]', bs => bs.map(b => b.innerText.replace(/\n+/g, ' | ')));
  for (const [name, words] of Object.entries(WANT)) {
    const row = rows.find(r => r.startsWith(name + ' | '));
    ck(`${name}: "${words}"`, !!row && row.split(' | ')[1].startsWith(words), row);
  }
  /* [slice 6] the nudge to set money aside ahead (engine periods.aheadFor): the pays on the 25th before car tax on Mon
     31 May 2027 are 25 Dec, 25 Jan, 25 Feb, 25 Mar, Fri 23 Apr (25 Apr is a Sunday) and 25 May: 6 pays, ¥34,500 / 6 =
     ¥5,750. Water (every 2 months) lands 15 Dec, before the next pay: no nudge. A goal made from it fills in the form. */
  const nudge = async name => p.evaluate(n => { const b = [...document.querySelectorAll('[data-bill]')].find(x => x.innerText.startsWith(n + '\n')); const a = b && b.parentElement.querySelector('[data-fig=ahead]'); return a ? a.innerText.replace(/\n+/g, ' | ') : null; }, name);
  let nd = await nudge('Car tax');
  ck('Car tax: set aside about ¥5,750 each pay', nd === 'Set aside about ¥5,750 each pay to have ¥34,500 ready by 31 May 2027 (6 pays before it) | Make a goal for it', nd);
  ck('Water: no nudge (due before the next pay)', (await nudge('Water')) === null);
  ck('Pension (each month): no nudge', (await nudge('Pension')) === null);
  await p.evaluate(() => [...document.querySelectorAll('[data-bill]')].find(x => x.innerText.startsWith('Car tax\n')).parentElement.querySelector('[data-ahead]').click()); await T.w(300);
  const form = await p.evaluate(() => ({ name: document.querySelector('#pl-name').value, target: document.querySelector('#pl-target').value, due: document.querySelector('#pl-due').value }));
  ck('Make a goal for it: the goal form is filled in', form.name === 'Car tax' && form.target.replace(/\D/g, '') === '34500' && form.due === '2027-05-31', JSON.stringify(form));
  await p.click('[data-plbtn="0"]'); await T.w(400);
  ck('with the goal made, the nudge is gone', (await nudge('Car tax')) === null);
  ck('no page errors', errs.length === 0, errs.join(' | '));
  await b.close();
  T.done('e3_rhythms');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
