#!/usr/bin/env node
/* Walk 2 fixes (DECISIONS_ROUND2 BI3, BI4), made-up yen.
   BI3: setup on 24 Nov asks, only for a bill due between the last pay and the setup day, whether it left the bank,
   naming its own day: "Did the Phone of 20 Nov leave your bank?" (QC F3). Phone (due 20 Nov) not gone yet: safe to spend is 196,600, not 201,400.
   BI4a: Home lists what may still go through: on 28 Nov Rent and Internet by name, on 11 Dec the late side job.
   BI4b: a late or not seen pay is named by the day it lands (after the weekend rule), not its unmoved due day: with
   pay moved to the working day before, the January pay lands Fri 8 Jan, and on 13 Jan Home says "due 8 Jan". */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const CI = require('../../engine/checkin.js'), I = require('../../engine/ids.js');
const typeIn = async (p, sel, v) => { await p.click(sel, { clickCount: 3 }); await p.keyboard.press('Backspace'); await p.type(sel, String(v)); };
(async () => {
  /* ---- BI3 ---- */
  {
    const prof = require('fs').mkdtempSync(require('os').tmpdir() + '/a3w2-');
    const { b, p, errs } = await T.open({ profile: prof });
    await p.goto(T.URL0 + '?today=2026-11-24'); await T.w(400);
    await p.click('#a3SetupGo'); await T.w(300);
    await typeIn(p, '#s3Bank', '286000');
    await p.select('#s3PayDay', '10'); await p.select('#s3PayShift', 'after');
    await typeIn(p, '#s3PayAmt', '180000'); await typeIn(p, '#s3PayName', 'Main job');
    await p.click('#s3AddPay'); await T.w(100);
    await typeIn(p, '[data-row=pay2] [data-f=name]', 'Side job'); await typeIn(p, '[data-row=pay2] [data-f=amount]', '60000');
    for (const [n, name, owed, day, shift] of [[1, 'Card A', 54000, '10', 'after'], [2, 'Card B', 23000, '11', 'before']]) {
      await p.click('#s3AddCard'); await T.w(100);
      const r = `[data-row=card${n}] `;
      await typeIn(p, r + '[data-f=name]', name); await typeIn(p, r + '[data-f=owed]', owed);
      await p.select(r + '[data-f=payDay]', day); await p.select(r + '[data-f=shift]', shift);
    }
    let n = 0;
    for (const [name, amt, day] of [['Rent', 72000, '27'], ['Power', 7400, '26'], ['Phone', 4800, '20'], ['Internet', 5200, '27']]) {
      n++; await p.click('#s3AddBill'); await T.w(100);
      const r = `[data-row=bill${n}] `;
      await typeIn(p, r + '[data-f=name]', name); await typeIn(p, r + '[data-f=amount]', amt); await p.select(r + '[data-f=day]', day);
    }
    await p.click('#s3Min'); await T.w(200);
    const asked = await p.$$eval('[data-row^=bill]', rs => rs.map(r => { const q = r.querySelector('[data-f=takenOut]'); return [r.querySelector('[data-f=name]').value, !!q && !q.closest('[hidden]'), q && q.value, q && q.closest('.a3-field').textContent]; }));
    ck('only Phone (due 20 Nov, after the 10 Nov pay) is asked whether it has gone out yet', asked.filter(x => x[1]).map(x => x[0]).join() === 'Phone', JSON.stringify(asked));
    ck('the question names the bill and its own day (QC F3), and the answer starts as yes', /^Did the Phone of 20 Nov leave your bank\?/.test(asked[2][3]) && asked[2][2] === 'yes', JSON.stringify(asked[2]));
    await p.select('[data-row=bill3] [data-f=takenOut]', 'no');
    await T.shot(p, 'setup_bi3_2026-11-24');
    await p.click('#a3SetupSave'); await T.w(600);
    const f = await T.figs(p), safe = f.filter(x => x.fig === 'safe')[0];
    ck('with Phone still to go, safe to spend is 196,600', safe && safe.amt === 196600, JSON.stringify(safe));
    const why = f.filter(x => x.fig === 'why')[0];
    ck('and its sum names the phone bill', why && /Phone 20 Nov/.test(why.text), why && why.text);
    ck('no page errors (BI3)', errs.length === 0, errs.join(' | '));
    await b.close();
  }
  const { b, p, errs } = await T.open();
  /* ---- BI4a ---- */
  for (const [day, names] of [['2026-11-28', ['Rent', 'Internet']], ['2026-12-11', ['Side job']]]) {
    await p.goto(T.URL0 + '?try=mako&today=' + day); await T.w(400);
    const list = await p.$$eval('[data-card=maystill] li', ls => ls.map(l => l.textContent)).catch(() => []);
    ck(day + ': what may still go through is listed by name: ' + names.join(', '), names.every(nm => list.some(t => t.indexOf(nm) === 0)), JSON.stringify(list));
    const r = T.L.lookahead(T.book(), day);
    ck(day + ': the list is the engine\'s, item for item', list.length === r.mayStillPost.length, list.length + ' vs ' + r.mayStillPost.length);
    if (day === '2026-11-28') await T.shot(p, 'home_maystill_' + day);
  }
  /* ---- BI4b ---- */
  {
    const bk = T.book(), bank = bk.home.main.v.acct;
    for (const s of bk.schedules) if (s.kind === 'income') s.shift = 'before';
    const li = T.L.lookahead(bk, '2026-12-10').checkIn.toConfirm;
    const nb = CI.apply(bk, CI.checkIn(bk, { day: '2026-12-10', told: '2026-12-10T20:00+09:00', newId: I.idMaker('t3wlk2', () => 0.4), figures: { [bank]: 300000 },
      ticked: li.map(o => o.item), expected: Object.fromEntries(li.map(o => [o.item, o.amount])), lands: Object.fromEntries(li.map(o => [o.item, o.lands])) }));
    const r = T.L.lookahead(nb, '2027-01-13');
    ck('the engine has the January pay not ticked on 13 Jan, landed 8 Jan', r.period.nextPay && r.period.nextPay.due === '2027-01-10' && r.period.nextPay.state !== 'coming', JSON.stringify(r.period.nextPay));
    const prof = require('fs').mkdtempSync(require('os').tmpdir() + '/a3w2b-');
    const o = await T.open({ profile: prof });
    await o.p.goto(T.URL0 + '?today=2027-01-13'); await T.w(300);
    const put = await o.p.evaluate(async bk => { const s = await BurrowStore.open(); const x = await s.save(bk, { full: true }); if (s.db) s.db.close(); return x; }, nb);
    ck('the book is kept through the store', put && put.ok);
    await o.p.reload(); await T.w(400);
    const words = await o.p.$eval('[data-fig=nextpay]', e => e.textContent), head = await o.p.$eval('[data-card=safe] h2', e => e.textContent);
    ck('13 Jan: the period card names the pay by the day it landed, 8 Jan', /due 8 Jan/.test(words) && !/10 Jan/.test(words), words);
    ck('13 Jan: and so does the safe to spend heading', /8 Jan/.test(head) && !/10 Jan/.test(head), head);
    ck('no page errors (BI4b)', o.errs.length === 0, o.errs.join(' | '));
    await o.b.close();
  }
  ck('no page errors', errs.length === 0, errs.join(' | '));
  await b.close(); T.done('e3_walk2');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
