#!/usr/bin/env node
/* The made-up Mako book behind ?try=mako (WIRING_PLAN step 6): it is the file make_mako_book.js makes, its ids look
   like the app's own, the ledger adds up, it has Mako's shape (one bank, two incomes on the 10th, two cards paid in full
   on the 10th and 11th with close days not sure, bills on due days, no minimum), and the page opens it with no errors,
   no outside requests and nothing written. Made-up yen only. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const { execFileSync } = require('child_process');
const path = require('path');
const G = require('../../engine/ledger.js'), I = require('../../engine/ids.js');
(async () => {
  let same = true; try { execFileSync('node', [path.join(__dirname, '../fixtures/make_mako_book.js'), '--check']); } catch (e) { same = false; }
  ck('the book is the one make_mako_book.js makes', same);
  const bk = T.book();
  ck('every account, schedule and event id is an ordinary id', [...bk.accounts, ...bk.schedules, ...bk.events].every(x => I.isOrdinary(x.id)));
  ck('the ledger adds up', G.proof(bk).ok, JSON.stringify(G.proof(bk)));
  const banks = bk.accounts.filter(a => a.type === 'bank'), cards = bk.accounts.filter(a => a.type === 'card');
  const pays = bk.schedules.filter(s => s.kind === 'income');
  ck('one bank', banks.length === 1);
  ck('two incomes on the 10th, the main one starts the period', pays.length === 2 && pays.every(s => s.rules[0].rule.days[0] === 10) && pays.filter(s => s.startsPeriod).length === 1);
  ck('two cards paid in full on the 10th and 11th, close days not sure', cards.length === 2 && cards.map(c => c.payDay).join() === '10,11' && cards.every(c => c.inFull && c.cutDay === null));
  ck('bills on their due days', bk.schedules.filter(s => s.kind === 'bill').length === 4);
  ck('no minimum (M1: skipped means none)', bk.home.main.v.min === null);
  const { b, p, errs, requests } = await T.open();
  await p.goto(T.URL0 + '?try=mako'); await T.w(400);
  ck('the page opens it', /Safe to spend/.test(await p.$eval('#a3Home', e => e.textContent)) && !(await p.$eval('#a3Try', e => e.hidden)));
  const st = await p.evaluate(() => (indexedDB.databases ? indexedDB.databases() : Promise.resolve([])).then(d => ({ dbs: d.map(x => x.name), ls: localStorage.length })));
  ck('nothing written', st.dbs.length === 0 && st.ls === 0, JSON.stringify(st));
  ck('no page errors', errs.length === 0, errs.join(' | '));
  ck('no outside requests', requests.length === 0, requests.join(' '));
  await b.close(); T.done('e3_try');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
