#!/usr/bin/env node
/* [qc-assistant run 4, fix B ruled by the coordinator 26 Nov] One set of setup answers before the book exists, on the
   real page with the real core (tests/chat_real.js: the fake model behind a made-up relay). Made-up amounts, Tue 24 Nov
   2026: the chat is told Japan, yen, Sora Bank 250,000, Pay 240,000 after tax on the 10th, nothing for everyday, no
   minimum. Then:
   A. The setup screens (the link at the foot of the first screen): the bank changed to 260,000, Save, Back. "Your
      answers so far" reads 260,000 and the chat's fill makes Home show Sora Bank 260,000 (worked by hand: next pay Thu
      10 Dec, no bill or card before it, no Free to spend, no minimum: safe to spend 260,000).
   B. Undo of that Save on the screens: the chat's draft reads 250,000 again; the same with the screens closed (Back,
      then Undo on the band).
   C. After the screens' Save the chat is told 270,000: the fill writes 270,000; opening the screens shows 270,000 with
      "Not saved yet", and the line at the top names Your bank as filled in from the chat.
   D. The same as A in US dollars: 2,500.00 told, 2,600.50 saved on the screens, Home shows 2,600.50.
   E. A pay typed by hand on the screens is "Not saved yet: Your pay", never "Filled in from the chat".
   F. [found by check3 full, 26 Nov] a draft write already on its way when See my money clears the draft never lands
      after the clear: no setup draft is left behind once the book exists (the store's writes made slow on purpose).
   G. [coordinator's ruling 26 Nov, M61] the device record (the setup draft, the cloud copy's state, the fill mark ...)
      is read and written whole: ten keys written at once through E3.rec are all kept, and the same after a reload. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const fs = require('fs'), os = require('os');
const R = require('./chat_real.js');
const DAY = '2026-11-24';
const answers = cur => ({ country: cur === 'JPY' ? 'JP' : 'XX', currency: cur, banks: [{ name: 'Sora Bank', amount: cur === 'JPY' ? 250000 : 2500 }],
  pays: [{ name: 'Pay', amount: cur === 'JPY' ? 240000 : 3000, every: 'month', day: 10, shift: 'before', afterTax: true }], cards: [], bills: [], asked: undefined, free: null, min: null, fill: false });
const typeIn = (p, sel, v) => p.evaluate((s, x) => { const e = document.querySelector(s); e.focus(); e.value = x; e.dispatchEvent(new Event('input', { bubbles: true })); e.blur(); }, sel, v);
const draftText = p => p.evaluate(() => { const c = [...document.querySelectorAll('[data-card=chat-draft]')].pop(); return c ? c.textContent.replace(/\s+/g, ' ') : '(none)'; });
const bankLine = t => (/Sora Bank: [^ ]+/.exec(t) || ['(no line)'])[0];
const band = p => p.$eval('#a3Msg', e => e.textContent).catch(() => '');
const undoBand = p => p.evaluate(() => { const b = [...document.querySelectorAll('#a3Msg button')].find(x => x.textContent === 'Undo'); if (b) b.click(); return !!b; });
async function start(tag, cur) {
  const o = await T.open({ profile: fs.mkdtempSync(os.tmpdir() + '/a3twodrafts' + tag + '-') });
  const ai = await R.relay(o.p);
  await o.p.goto(T.URL0 + '?today=' + DAY); await T.w(700);
  ai.push(...R.setupSteps(answers(cur)));
  await R.tell(o.p, 'Japan. Sora Bank ' + (cur === 'JPY' ? '250,000' : '2,500') + '. Pay ' + (cur === 'JPY' ? '240,000' : '3,000') + ' after tax on the 10th. Nothing for everyday, no minimum');
  return { o, ai };
}
async function screensSave(p, bank) {
  await p.$eval('#a3SetupGo', e => e.click()); await T.w(500);
  await typeIn(p, '#s3Bank', bank); await T.w(100);
  await p.$eval('[data-save=bank]', e => e.click()); await T.w(400);
}
const back = async p => { await p.$eval('#a3SetupX', e => e.click()); await T.w(500); };
async function fill(p, ai) { ai.push(R.say('', [R.call('fill_book', {})]), R.say('Done.')); await R.tell(p, 'Fill it in'); await T.w(300); }

(async () => {
  /* A */
  {
    const { o, ai } = await start('A', 'JPY');
    try {
      ck('A: the chat holds Sora Bank 250,000', bankLine(await draftText(o.p)) === 'Sora Bank: ¥250,000', bankLine(await draftText(o.p)));
      await screensSave(o.p, '260000');
      ck('A: the screens say Your bank: saved', /Your bank: saved/.test(await band(o.p)), await band(o.p));
      await back(o.p);
      ck('A: after Back, "Your answers so far" reads Sora Bank 260,000', bankLine(await draftText(o.p)) === 'Sora Bank: ¥260,000', bankLine(await draftText(o.p)));
      await fill(o.p, ai);
      const h = await R.home(o.p);
      ck('A: the chat\'s fill makes Home show Sora Bank 260,000 and safe to spend 260,000', h.bank === 260000 && h.safe === 260000, JSON.stringify(h));
      ck('A: no page errors', !o.errs.length, o.errs.join(' | '));
    } catch (e) { ck('A: the check ran to its end', false, e.stack); }
    finally { await o.b.close(); }
  }
  /* B */
  {
    const { o } = await start('B', 'JPY');
    try {
      await screensSave(o.p, '260000');
      ck('B: Undo is on the band', await undoBand(o.p)); await T.w(400);
      ck('B: the box reads 250,000 again', (await o.p.$eval('#s3Bank', e => e.value.replace(/,/g, ''))) === '250000', await o.p.$eval('#s3Bank', e => e.value));
      await back(o.p);
      ck('B: Undo of the screens\' Save puts the chat\'s draft back to 250,000', bankLine(await draftText(o.p)) === 'Sora Bank: ¥250,000', bankLine(await draftText(o.p)));
      await screensSave(o.p, '260000');
      await back(o.p);
      ck('B: saved again: the chat reads 260,000', bankLine(await draftText(o.p)) === 'Sora Bank: ¥260,000', bankLine(await draftText(o.p)));
      ck('B: with the screens closed, Undo is still on the band', await undoBand(o.p)); await T.w(500);
      ck('B: and puts the chat\'s draft back to 250,000', bankLine(await draftText(o.p)) === 'Sora Bank: ¥250,000', bankLine(await draftText(o.p)));
      ck('B: no page errors', !o.errs.length, o.errs.join(' | '));
    } catch (e) { ck('B: the check ran to its end', false, e.stack); }
    finally { await o.b.close(); }
  }
  /* C */
  {
    const { o, ai } = await start('C', 'JPY');
    try {
      await screensSave(o.p, '260000');
      await back(o.p);
      ai.push(R.say('', [R.call('draft_set', { section: 'banks', value: [{ name: 'Sora Bank', amount: 270000 }] })]), R.say('Got it.'));
      await R.tell(o.p, 'Actually Sora Bank shows 270,000 now');
      ck('C: the chat reads 270,000', bankLine(await draftText(o.p)) === 'Sora Bank: ¥270,000', bankLine(await draftText(o.p)));
      await o.p.$eval('#a3SetupGo', e => e.click()); await T.w(500);
      const s = await o.p.evaluate(() => ({ bank: document.querySelector('#s3Bank').value.replace(/,/g, ''), st: document.querySelector('[data-sec=bank]').dataset.state,
        todo: document.querySelector('#a3SetupTodo').textContent }));
      ck('C: the screens show the newer 270,000, Not saved yet, named as filled in from the chat', s.bank === '270000' && s.st === 'changed' && /Filled in from the chat, not saved yet: Your bank/.test(s.todo), JSON.stringify(s));
      await back(o.p);
      await fill(o.p, ai);
      const h = await R.home(o.p);
      ck('C: the fill writes the newest answer, 270,000', h.bank === 270000, JSON.stringify(h));
      ck('C: no page errors', !o.errs.length, o.errs.join(' | '));
    } catch (e) { ck('C: the check ran to its end', false, e.stack); }
    finally { await o.b.close(); }
  }
  /* D */
  {
    const { o, ai } = await start('D', 'USD');
    try {
      ck('D: the chat holds Sora Bank 2,500', bankLine(await draftText(o.p)) === 'Sora Bank: $2,500', bankLine(await draftText(o.p)));
      await screensSave(o.p, '2600.50');
      await back(o.p);
      ck('D: after Back, the chat reads 2,600.50', bankLine(await draftText(o.p)) === 'Sora Bank: $2,600.50', bankLine(await draftText(o.p)));
      await fill(o.p, ai);
      const h = await R.home(o.p);
      ck('D: Home shows 2,600.50 (260050 cents)', h.bank === 260050, JSON.stringify(h));
      ck('D: no page errors', !o.errs.length, o.errs.join(' | '));
    } catch (e) { ck('D: the check ran to its end', false, e.stack); }
    finally { await o.b.close(); }
  }
  /* E: a chat with a bank only; the pay typed by hand on the screens */
  {
    const o = await T.open({ profile: fs.mkdtempSync(os.tmpdir() + '/a3twodraftsE-') });
    try {
      const ai = await R.relay(o.p);
      await o.p.goto(T.URL0 + '?today=' + DAY); await T.w(700);
      ai.push(R.say('', [R.call('draft_set', { section: 'banks', value: [{ name: 'Sora Bank', amount: 250000 }] })]), R.say('Got it.'));
      await R.tell(o.p, 'Sora Bank 250,000');
      await o.p.$eval('#a3SetupGo', e => e.click()); await T.w(500);
      await typeIn(o.p, '#s3PayAmt', '240000'); await T.w(200);
      const todo = await o.p.$eval('#a3SetupTodo', e => e.textContent);
      ck('E: a pay typed by hand is "Not saved yet: Your pay", the bank "Filled in from the chat"', todo === 'Filled in from the chat, not saved yet: Your bank. Not saved yet: Your pay. Press Save under each', todo);
      ck('E: no page errors', !o.errs.length, o.errs.join(' | '));
    } catch (e) { ck('E: the check ran to its end', false, e.stack); }
    finally { await o.b.close(); }
  }
  /* F */
  {
    const o = await T.open({ profile: fs.mkdtempSync(os.tmpdir() + '/a3twodraftsF-') });
    try {
      await o.p.goto(T.URL0 + '?today=' + DAY); await T.w(700);
      await o.p.$eval('#a3SetupGo', e => e.click()); await T.w(500);
      await typeIn(o.p, '#s3Bank', '250000'); await o.p.$eval('[data-save=bank]', e => e.click()); await T.w(300);
      await typeIn(o.p, '#s3PayAmt', '240000'); await o.p.$eval('[data-save=pay]', e => e.click()); await T.w(300);
      /* a typed-keeping write that takes 600 ms, started just before See my money */
      await o.p.evaluate(() => { const E = BurrowApp3.E3, rec = E.rec; E.rec = async (k, v) => { if (k === 'setup' && v) await new Promise(r => setTimeout(r, 600)); return rec(k, v); }; });
      await typeIn(o.p, '#s3Bank', '250000'); await T.w(350);
      await o.p.$eval('#a3SetupSave', e => e.click()); await T.w(1500);
      const d = await o.p.evaluate(() => new Promise(res => { const rq = indexedDB.open('burrow3'); rq.onsuccess = () => { const db = rq.result, tx = db.transaction(['device', 'book']), out = {};
        tx.objectStore('device').get('device').onsuccess = e => { out.setup = (e.target.result || {}).setup || null; }; tx.objectStore('book').get('book').onsuccess = e => { out.book = !!e.target.result; }; tx.oncomplete = () => { db.close(); res(out); }; }; }));
      ck('F: the book is kept and no setup draft is left behind', d.book && !d.setup, JSON.stringify(d).slice(0, 200));
      ck('F: no page errors', !o.errs.length, o.errs.join(' | '));
    } catch (e) { ck('F: the check ran to its end', false, e.stack); }
    finally { await o.b.close(); }
  }
  /* G */
  {
    const o = await T.open({ profile: fs.mkdtempSync(os.tmpdir() + '/a3twodraftsG-') });
    try {
      await o.p.goto(T.URL0 + '?today=' + DAY); await T.w(700);
      const keys = [...Array(10).keys()].map(i => 'qcG' + i);
      const r = await o.p.evaluate(async ks => { const E = BurrowApp3.E3; const ok = await Promise.all(ks.map((k, i) => E.rec(k, { n: i }))); const back = await Promise.all(ks.map(k => E.rec(k))); return { ok, back }; }, keys);
      ck('G: ten device keys written at once are all kept', r.ok.every(x => x === true) && r.back.every((x, i) => x && x.n === i), JSON.stringify(r));
      await o.p.reload(); await T.w(700);
      const back2 = await o.p.evaluate(ks => Promise.all(ks.map(k => BurrowApp3.E3.rec(k))), keys);
      ck('G: and after a reload', back2.every((x, i) => x && x.n === i), JSON.stringify(back2));
      ck('G: no page errors', !o.errs.length, o.errs.join(' | '));
    } catch (e) { ck('G: the check ran to its end', false, e.stack); }
    finally { await o.b.close(); }
  }
  T.done('e3_twodrafts');
})().catch(e => { console.log('FAIL crashed ' + (e && e.stack || e)); process.exit(1); });
