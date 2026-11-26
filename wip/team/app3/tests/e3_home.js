#!/usr/bin/env node
/* Home, the new top, on the made-up Mako book (WIRING_PLAN step 7). On 23 Nov, 9, 10, 11 and 12 Dec,,
   and Fri 8 Jan 2027, every figure on screen is the engine's figure for that day: bank
   today and its age, safe to spend and the sum behind it, the next pay, due before next pay, each card, all the money
   after the cards. One bank figure on the page. No page errors, no outside requests, the old app's copies untouched. */
'use strict';
const T = require('./lib3.js');
const { ck } = T;
const SN0 = require('../../screens/names.js');
const DAYS = ['2026-11-23', '2026-12-09', '2026-12-10', '2026-12-11', '2026-12-12', '2027-01-08'];
(async () => {
  const { b, p, errs, requests } = await T.open();
  await p.goto(T.URL0 + '?try=mako'); await T.w(300);
  await T.seedOld(p);
  const bk = T.book(), bank = bk.home.main.v.acct;
  for (const day of DAYS) {
    await p.goto(T.URL0 + '?try=mako&today=' + day); await T.w(400);
    const r = T.L.lookahead(bk, day), f = await T.figs(p);
    const one = k => f.filter(x => x.fig === k);
    const bankFigs = one('bank');
    const overdueN = [].concat(...[r.cards, r.owed || {}].map(m => Object.values(m).map(x => (x.overdue || []).length))).filter(n => n > 0).length;
    const odCard = await p.$('[data-card=overdue]'), odItems = (await p.$$('[data-card=overdue] li')).length;
    ck(day + ' the overdue card shows only with an overdue item under it', overdueN ? !!odCard && odItems > 0 : !odCard, `${overdueN} accounts overdue, card ${!!odCard}, ${odItems} items`);
    ck(day + ' one bank figure, the engine\'s', bankFigs.length === 1 && bankFigs[0].amt === r.accounts[bank].bank, JSON.stringify(bankFigs));
    ck(day + ' its age', one('age')[0] && one('age')[0].text === (r.accounts[bank].ageDays === 0 ? 'checked today' : r.accounts[bank].ageDays === 1 ? 'checked yesterday' : 'checked ' + r.accounts[bank].ageDays + ' days ago') + ', on 20 Nov' + (day.startsWith('2027') ? ' 2026' : ''), one('age')[0] && one('age')[0].text);
    ck(day + ' safe to spend is the engine\'s headline', one('safe')[0] && one('safe')[0].amt === r.safeToSpend.headline, JSON.stringify(one('safe')) + ' vs ' + r.safeToSpend.headline);
    { const w = one('why')[0], want = require('../../screens/money.js').sumLine(r.accounts[bank].whyParts, r.accounts[bank].headroom, r.accounts[bank].currency);
      ck(day + ' the sum behind it is the engine\'s parts, one minus sign, without a minimum of 0 (S4)', w && w.text === want && !/minimum/.test(w.text) && !/ - /.test(w.text) && (r.accounts[bank].whyParts.filter(p => p.amount < 0 && p.label !== 'minimum').length === 0 || w.text.includes('\u2212')), w && w.text); }
    const npDay = r.period.nextPay.state === 'notSeen' ? r.period.nextPay.due : r.daysToNextPay.next_pay;
    ck(day + ' the next pay (' + r.period.nextPay.state + ')', one('nextpay')[0] && one('nextpay')[0].text.indexOf(SN0.dayLabel(npDay)) > 0, one('nextpay')[0] && one('nextpay')[0].text);
    const dt = one('duetotal');
    ck(day + ' due before next pay', r.dueBeforeNextPay.items.length ? dt.length === 1 && dt[0].amt === r.dueBeforeNextPay.total : dt.length === 0, JSON.stringify(dt) + ' vs ' + r.dueBeforeNextPay.total);
    const owed = one('owed');
    ck(day + ' each card', owed.length === Object.keys(r.cards).length && Object.keys(r.cards).every((id, i) => owed[i].amt === r.cards[id].owedNow), JSON.stringify(owed));
    ck(day + ' no undated "bank after the cards" (BB2)', !(await p.$('[data-figure="total.afterCards"]')) && !/after the cards/i.test(await p.$eval('#a3Home', e => e.textContent)));
    /* [NORTH_STAR, BB2] the bank after the cards are paid: the engine's dated per-bank figure, once, in the cards box,
       naming the pay in it and the card days, and saying it is not safe to spend */
    { const ac = one('aftercards'), want = r.bankAfterCards || {}, accts = Object.keys(want);
      ck(day + ' the bank after the cards are paid, once per bank, the engine\'s, in the cards box', ac.length === accts.length && accts.every((id, i) => ac[i].amt === want[id].amount && ac[i].card === 'cards'), JSON.stringify(ac) + ' vs ' + JSON.stringify(want));
      for (const [i, id] of accts.entries()) {
        /* [C10] a card day that is today is written "today" (an overdue payment is taken today) */
        const x = want[id], rest = x.cardDays.filter(d => d !== day), wy = x.cardDays.some(d => d.slice(0, 4) !== day.slice(0, 4));
        const head = `After your cards are paid ${rest.length === x.cardDays.length ? 'on ' + SN0.dayList(x.cardDays, wy) : 'today' + (rest.length ? ' and on ' + SN0.dayList(rest, wy) : '')}: Main bank`;
        const t = ac[i] ? ac[i].text : '';
        ck(day + ' it names its day, the pay in it, close days not sure, and says it is not safe to spend', t.startsWith(head) && /not safe to spend/.test(t) && (!x.pays.length || t.includes('Your pay on')) && (!x.ifAllTaken || t.includes('It counts everything on the cards now, as their close days are not sure')) && (!x.paysNotCounted.length || /is not counted/.test(t)), t);
      } }
    if (day === '2026-11-23') {
      const lines = await p.$$eval('[data-cardid] .when', es => es.map(e => e.textContent));
      ck(day + ' card A comes out the day pay lands', lines[0] === 'Comes out on 10 Dec, the day your pay lands', lines[0]);
      ck(day + ' card B comes out the day after', lines[1] === 'Comes out on 11 Dec', lines[1]);
      ck(day + ' the bank after the cards are paid, hand-worked: 286,000 - 84,600 + 240,000 - 54,000 - 23,000 = 364,400', one('aftercards')[0] && one('aftercards')[0].amt === 364400 && one('aftercards')[0].text.startsWith('After your cards are paid on 10 and 11 Dec: Main bank') && one('aftercards')[0].text.includes('Your pay on 10 Dec is in it'), JSON.stringify(one('aftercards')));
    }
    const shown = await p.evaluate(() => [...document.querySelectorAll('[data-amt]')].every(e => e.textContent.replace(/[^\d]/g, '') === String(Math.abs(Number(e.dataset.amt)))));
    ck(day + ' every amount written is the amount it stands for', shown);
    const audit = await p.evaluate(() => BurrowScreens.provenance.audit(document.getElementById('a3Home')));
    ck(day + ' every figure is marked sample on the sample screen (provenance audit)', audit.length === 0 && (await p.$$('[data-figure]')).length > 5, audit.join('; '));
    const st = await p.evaluate(() => ({ card: !!document.querySelector('[data-card=status]'), band: document.getElementById('a3Try').hidden ? '' : document.getElementById('a3Try').textContent, n: (document.getElementById('a3').textContent.match(/[Mm]ade.up|Sample numbers/g) || []).length }));
    ck(day + ' made-up numbers are said once, in the yellow band, with no status card', !st.card && /Made-up numbers/.test(st.band) && st.n === 1, JSON.stringify(st));
    if (day === '2026-11-23' || day === '2027-01-08' || day === '2026-12-10') await T.shot(p, 'home_' + day);
  }
  /* the phone width: no sideways scroll at 320 */
  await p.setViewport({ width: 320, height: 700, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await p.goto(T.URL0 + '?try=mako&today=2026-12-10'); await T.w(300);
  ck('no sideways scroll at 320 px', await p.evaluate(() => Math.max(document.documentElement.scrollWidth, document.getElementById('a3').scrollWidth) <= 320), await p.evaluate(() => Math.max(document.documentElement.scrollWidth, document.getElementById('a3').scrollWidth)));
  /* every label beside a figure is the name table's name for that figure */
  const SN = require('../../screens/names.js');
  const shown = await p.evaluate(() => [['[data-card=safe] h2', 'safeToSpend.headline'], ['[data-card=due] h2', 'dueBeforeNextPay.total'], ['[data-card=period] h2', 'period.start']].map(([s, f]) => ({ label: document.querySelector(s) ? document.querySelector(s).textContent : '', figure: f })));
  const labelOnly = shown.map(x => ({ label: x.label.replace(/ until (next pay on|the pay after today's,) .*$/, '').replace(/(the pay after today's), on .*$/, '$1'), figure: x.figure }));
  ck('labels come from the name table', SN.check(labelOnly).length === 0, SN.check(labelOnly).join('; '));
  /* Plan and Receipts are here already: the last line names only what is still to come */
  ck('no "Coming next" line on Home', !/Coming next/.test(await p.$eval('#a3Home', e => e.textContent)));
  /* [C11] late bills the sum takes off today are listed under "Due before next pay", marked late.
     The made-up book on 12 Dec, nothing ticked: the sum takes off Rent 27 Nov, Power 26 Nov and Internet 27 Nov (late). */
  {
    await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await p.goto(T.URL0 + '?try=mako&today=2026-12-12'); await T.w(400);
    const why = (await p.$eval('[data-fig=why]', e => e.textContent)).replace(/\u2060/g, '');
    const lateRows = await p.$$eval('[data-card=due] [data-fig=duelate] li', ls => ls.map(l => l.textContent.replace(/\u2060/g, '')));
    ck('C11: the sum takes off three late bills', ['Rent 27 Nov, late', 'Power 26 Nov, late', 'Internet 27 Nov, late'].every(x => why.includes(x)), why);
    ck('C11: the same three are listed under Due before next pay, each marked late with its day and amount', lateRows.join(' | ') === 'Power26 Nov, late¥7,400 | Rent27 Nov, late¥72,000 | Internet27 Nov, late¥5,200', lateRows.join(' | '));
    const dueTxt = (await p.$eval('[data-card=due]', e => e.textContent)).replace(/\u2060/g, '');
    ck('C11: the heading over them says safe to spend takes them off today', /Late, not ticked off yet/.test(dueTxt) && /Safe to spend takes these off today/.test(dueTxt), dueTxt);
    ck('C11: late card payments are not listed here again (C10: once, in the overdue card)', !lateRows.some(x => /Card/.test(x)), lateRows.join(' | '));
  }
  /* [C11] nothing more is due, but a late bill is taken off: never "Nothing is due before next pay". Yen, set up Mon 23 Nov
     with 200,000, Pay 100,000 on the 25th, Rent 60,000 on the 26th. Seen Wed 2 Dec, nothing ticked: the pay of 25 Nov is not
     counted, so the list runs to the pay on 25 Dec; Rent 26 Nov is late and comes off today; the next Rent is 26 Dec. */
  {
    const B = require('../../engine/build_book.js'), I = require('../../engine/ids.js');
    const bk = B.buildBook({ day: '2026-11-23', told: '2026-11-23T09:00+09:00', country: 'JP', currency: 'JPY',
      banks: [{ key: 'b', name: 'Main bank', amount: 200000 }],
      pays: [{ key: 'pay', name: 'Pay', bank: 'b', amount: 100000, day: 25, shift: 'none', startsPeriod: true }],
      bills: [{ key: 'rent', name: 'Rent', from: 'b', amount: 60000, day: 26, shift: 'none' }] }, { newId: I.idMaker('c11hme', () => 0.5) }).book;
    const r = T.L.lookahead(bk, '2026-12-02');
    ck('C11: the engine: nothing in the due list, Rent 26 Nov taken off late', r.dueBeforeNextPay.items.length === 0 && Object.values(r.accounts)[0].whyParts.some(x => x.label === 'Rent 26 Nov, late' && x.amount === -60000), JSON.stringify(r.dueBeforeNextPay) + JSON.stringify(Object.values(r.accounts)[0].whyParts));
    const prof = require('fs').mkdtempSync(require('os').tmpdir() + '/a3prof-');
    const o = await T.open({ profile: prof });
    await o.p.goto(T.URL0 + '?today=2026-12-02'); await T.w(300);
    await o.p.evaluate(async bk0 => { const s = await BurrowStore.open(); await s.save(bk0, { full: true }); s.db && s.db.close(); }, bk);
    await o.p.reload(); await T.w(500);
    const dueTxt = (await o.p.$eval('[data-card=due]', e => e.textContent)).replace(/\u2060/g, '');
    ck('C11: Home never says nothing is due while the sum takes Rent off', !/Nothing is due/.test(dueTxt) && /Rent26 Nov, late¥60,000/.test(dueTxt), dueTxt);
    ck('C11: no page errors', o.errs.length === 0, o.errs.join(' | '));
    await o.b.close();
  }
  /* [N26] three weeks since the last bank check: Home leads with "Check your bank", above "Pay not in yet". The made-up
     book kept as the person's own (so the status card shows), seen 12 Dec: last checked 20 Nov, the 10 Dec pay not seen. */
  {
    const prof = require('fs').mkdtempSync(require('os').tmpdir() + '/a3prof-');
    const o = await T.open({ profile: prof });
    await o.p.goto(T.URL0 + '?today=2026-12-12'); await T.w(300);
    await o.p.evaluate(async bk0 => { const s = await BurrowStore.open(); await s.save(bk0, { full: true }); s.db && s.db.close(); }, bk);
    await o.p.reload(); await T.w(500);
    const r = T.L.lookahead(bk, '2026-12-12');
    const st = await o.p.$eval('[data-card=status]', e => ({ head: e.querySelector('h2').textContent, text: e.textContent })).catch(() => null);
    ck('N26: the engine: checked 22 days ago, and the pay not seen', r.accounts[bank].ageDays === 22 && r.period.nextPay.state === 'notSeen', r.accounts[bank].ageDays + ' ' + r.period.nextPay.state);
    ck('N26: Home leads with Check your bank and the day of the last check, not "Pay not in yet"', st && st.head === 'Check your bank' && /Your bank figure is from 20 Nov/.test(st.text), JSON.stringify(st));
    ck('N26: the status card is the first card on Home', await o.p.$eval('#a3Home [data-card]', e => e.dataset.card) === 'status');
    ck('N26: no page errors', o.errs.length === 0, o.errs.join(' | '));
    await o.b.close();
  }
  const old = await T.readOld(p);
  /* [M36; qc-data-safety run 2] a bank figure dated after this device's day (another device a day ahead): never a
     negative age. It says the day it was checked and nothing untrue */
  {
    const AH = '2026-11-19';   // the made-up book's bank figure is dated 20 Nov
    await p.goto(T.URL0 + '?try=mako&today=' + AH); await T.w(400);
    const txt = await p.$eval('#a3Home', e => e.textContent);
    ck('a figure dated after today: no negative age on Home', !/checked -\d/.test(txt) && !/-\d+ days ago/.test(txt), (txt.match(/checked[^.]{0,40}/) || [''])[0]);
  }
  ck('the old app\'s copy is byte for byte the same', old.ls === T.OLD_TEXT && old.idb === T.OLD_IDB, JSON.stringify(old).slice(0, 200));
  ck('no page errors', errs.length === 0, errs.join(' | '));
  ck('no outside requests', requests.length === 0, requests.join(' '));
  await b.close(); T.done('e3_home');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
