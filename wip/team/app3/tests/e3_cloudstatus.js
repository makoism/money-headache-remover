#!/usr/bin/env node
/* The cloud copy's one status (coordinator item 8, 25 Nov; M36, M61, M67): never "in step" while a change is waiting or
   after the cloud refused one. Settings and Home read the same status. One device through the page on the local fake
   vault, on the page's real clocks, made-up money.
   a. Cloud copy on, a spend logged while the send rule holds the next send back (never two sends in 10 seconds):
      before it goes, Settings and Home both say a change is waiting and neither says in step; after it goes, both say
      in step (Home then shows no cloud line).
   b. The vault answers 503 to a save: Settings and Home say the change was not taken, before and after a reload, and in
      step again after a later send goes. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const fs = require('fs'), os = require('os'), path = require('path');
const { makeVault, serve } = require('./fake_vault.js');
const DAY = '2026-12-10';
const seed = (p, bk) => p.evaluate(async bk0 => { const s = await BurrowStore.open(); await s.load(); const r = await s.save(bk0, { full: true }); s.close(); return r.ok; }, bk);
const until = async (f, ms) => { for (let i = 0; i < (ms || 8000) / 100; i++) { if (await f()) return true; await T.w(100); } return false; };
async function type(p, sel, text) { await p.tap(sel); await T.w(60); await p.keyboard.type(text); }
async function log(p, amt, note) { await type(p, '#rcAmt', amt); await type(p, '#rcNote', note); await p.tap('#rcSave'); }
(async () => {
  const vault = makeVault();
  const html = path.join(__dirname, '../index.html');
  const s = await serve(vault, () => fs.readFileSync(html));
  const URL = `http://127.0.0.1:${s.port}/?today=${DAY}`;
  const A = await T.open({ profile: fs.mkdtempSync(path.join(os.tmpdir(), 'a3sA-')) });
  const real = vault.handle;
  const rev = () => (vault.rows.size ? vault.rows.values().next().value.rev : 0);
  const homeLine = () => A.p.$eval('[data-panel=home] [data-cloud=home]', e => e.textContent).catch(() => '');
  const homeAll = () => A.p.$eval('[data-panel=home]', e => e.textContent).catch(() => '');
  const settings = async () => {
    await A.p.click('#a3SetGo'); await until(async () => !!(await A.p.$('#a3CloudNow')));
    const t = await A.p.$eval('#a3CloudState', e => e.textContent);
    await A.p.click('#a3SetClose'); await T.w(150);
    return t;
  };
  try {
    await A.p.goto(URL); await T.w(300); await seed(A.p, T.book()); await A.p.reload(); await T.w(400);
    await A.p.click('#a3SetGo'); await T.w(200); await A.p.click('#a3CloudOn');
    await until(async () => !!(await A.p.$('[data-cloud=code]')));
    await A.p.click('#a3CloudSaved');
    ck('(the cloud copy is on)', await until(() => vault.rows.size === 1));
    await T.w(500); await A.p.click('#a3SetClose'); await T.w(200);
    ck('(in step at first: Home shows no cloud line)', !(await homeLine()), await homeLine());
    await A.p.tap('[data-tab="receipts"]'); await T.w(250);

    /* ---- a. a change waiting ---- */
    await T.w(10500);   // the send of turning on is 10 seconds behind
    const r1 = rev();
    await log(A.p, '1200', 'coffee one');
    ck('(the first spend is sent at once)', await until(() => rev() > r1, 3000));
    const r2 = rev();
    await log(A.p, '700', 'tea two'); await T.w(400);
    ck('(the second waits: never two sends in 10 seconds)', rev() === r2);
    await A.p.tap('[data-tab="home"]'); await T.w(200);
    const h1 = await homeLine();
    ck('a. Home says a change is waiting before the send goes', /waiting to go to the cloud copy/.test(h1), h1);
    ck('a. Home does not say in step', !/in step/i.test(await homeAll()));
    const s1 = await settings();
    ck('a. Settings says a change is waiting, not in step', /waiting to be sent/.test(s1) && !/in step/i.test(s1), s1);
    ck('(the send went by itself)', await until(() => rev() > r2, 15000));
    await T.w(500);
    ck('a. after the send Home shows no cloud line', await until(async () => !(await homeLine()), 2000), await homeLine());
    const s2 = await settings();
    ck('a. after the send Settings says in step', /In step with the cloud/.test(s2), s2);

    /* ---- b. the cloud refuses a save ---- */
    vault.handle = (m, id, tok, body, q) => (m === 'PUT' ? { status: 503, j: { error: { code: 'down' } } } : real(m, id, tok, body, q));
    await T.w(10500);
    await A.p.tap('[data-tab="receipts"]'); await T.w(250); await log(A.p, '450', 'bun three'); await T.w(1500);
    await A.p.tap('[data-tab="home"]'); await T.w(200);
    const h3 = await homeLine();
    ck('b. Home says the cloud copy did not take the change', /did not take your last change/.test(h3) && !/\.$/.test(h3), h3);
    const s3 = await settings();
    ck('b. Settings says it was not taken, not in step', /did not take your last change/.test(s3) && !/in step/i.test(s3), s3);
    await A.p.reload(); await T.w(1500);
    const h4 = await homeLine();
    ck('b. after a reload Home still says it was not taken', /did not take your last change/.test(h4), h4);
    const s4 = await settings();
    ck('b. after a reload Settings still says it was not taken', /did not take your last change/.test(s4) && !/in step/i.test(s4), s4);
    ck('b. the line is amber at most, never red', !(await A.p.$('[data-panel=home] [data-cloud=home].a3-bad')));
    vault.handle = real;
    const r5 = rev();
    await A.p.click('#a3SetGo'); await until(async () => !!(await A.p.$('#a3CloudNow'))); await A.p.click('#a3CloudNow');
    ck('(a later send goes)', await until(() => rev() > r5, 5000));
    await T.w(500);
    ck('b. Settings says in step again', /In step with the cloud/.test(await A.p.$eval('#a3CloudState', e => e.textContent)), await A.p.$eval('#a3CloudState', e => e.textContent));
    await A.p.click('#a3SetClose'); await T.w(300);
    ck('b. Home shows no cloud line again', await until(async () => !(await homeLine()), 2000), await homeLine());
    const errs = A.errs.filter(e => !/Failed to load resource/.test(e));
    ck('no page errors', errs.length === 0, errs.join(' | '));
  } finally { await A.b.close(); await s.close(); }
  T.done('e3_cloudstatus');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
