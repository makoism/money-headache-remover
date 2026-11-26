#!/usr/bin/env node
/* Check your bank asks about a card payment left unticked (coordinator, 24 Nov; MAKO_SAYS M11 he logs weekly, M27 his
   cards are paid in full on the 10th and 11th, M36, M45, M53 it holds your hand), through the built page. Made-up yen.

   Mako's shape, set up 24 Nov 2026: Main bank 300,000, pay 300,000 on the 10th, Card A with 20,000 on it paid on the
   10th, Card B with 10,000 on it paid on the 11th (close days not sure), Free to spend 60,000 each pay period.
     6 Dec  cards checked: A 50,000, B 24,000 (the bank is not looked at).
    13 Dec  Check your bank. He ticks the pay but unticks the two card payments (or thinks they have not gone), and
            types what he sees: bank 526,000, Card A 21,000, Card B 7,000.
            The truth: Card A's 50,000 left the bank on 10 Dec and Card B's 24,000 on 11 Dec
            (300,000 + 300,000 - 50,000 - 24,000 = 526,000). Card A shows 21,000 where the app, with the payment not
            gone, had 50,000: 29,000 less. With the payment ticked the app has 0 and the card shows 21,000 more: a far
            smaller gap. So the sheet asks, under the card: "Did Card A's payment of ¥50,000 go out on 10 Dec?"
            Yes ticks it. The same for Card B (¥24,000 on 11 Dec).
            Saved with both ticked: the period to 9 Dec holds 30,000 + 14,000 = 44,000 and the new one the whole 13 Dec
            gaps, 21,000 + 7,000 = 28,000 [CHECKGAP, coordinator 15, 26 Nov: a check's gap is its own period's; by days it
            was 56,000 and 16,000], so safe to spend is 60,000 - 28,000 = 32,000 and the cards owe 21,000 and 7,000.
   Saved with the question not answered (before this fix: no question at all), the periods read 82,706 and minus
   10,706 and both payments stay on the list: the fault this test holds off. */
'use strict';
const L = require('./lives3.js').make('e3_cardpay');
const { ck, go, tab, typeIn, txt, w } = L;
const { finishSetup } = require('./setup_sections.js');
const BANK = 'Main bank';
const figAmt = (p, sel) => p.$eval(sel, e => Number((e.dataset.amt !== undefined ? e : e.querySelector('[data-amt]')).dataset.amt)).catch(() => null);
/* the sheet's rows and boxes by name */
const rowOf = (p, name) => p.evaluateHandle(n => [...document.querySelectorAll('#a3Check .a3-tick')].find(r => r.textContent.includes(n)), name);
const tickState = (p, name) => p.evaluate(n => { const r = [...document.querySelectorAll('#a3Check .a3-tick')].find(x => x.querySelector('label span').textContent.includes(n)); return r ? r.querySelector('input[type=checkbox]').checked : null; }, name);
const setTick = (p, name, on) => p.evaluate(([n, v]) => { const r = [...document.querySelectorAll('#a3Check .a3-tick')].find(x => x.querySelector('label span').textContent.includes(n)); const b = r.querySelector('input[type=checkbox]'); if (b.checked !== v) b.click(); }, [name, on]);
async function typeBox(p, name, v) {
  const id = await p.evaluate(n => { const e = [...document.querySelectorAll('#a3Check [data-bankfig], #a3Check [data-cardfig]')].find(x => document.querySelector(`label[for="${x.id}"]`).textContent.includes(n)); return e ? e.id : null; }, name);
  await p.click('#' + id); await p.keyboard.type(String(v)); await p.$eval('#' + id, e => e.dispatchEvent(new Event('input', { bubbles: true }))); await w(120);
}
/* the question under a card's box: its words and its button, or null when it is not shown */
const ask = (p, name) => p.evaluate(n => {
  const box = [...document.querySelectorAll('#a3Check [data-cardfig]')].find(x => document.querySelector(`label[for="${x.id}"]`).textContent.includes(n));
  const q = box && box.closest('.a3-field').querySelector('[data-payask]');
  if (!q || q.hidden) return null;
  const b = q.querySelector('button');
  return { text: q.querySelector('[data-payq]').textContent.trim(), button: b ? b.textContent.trim() : null, h: b ? Math.round(b.getBoundingClientRect().height) : 0 };
}, name);
const yes = (p, name) => p.evaluate(n => { const box = [...document.querySelectorAll('#a3Check [data-cardfig]')].find(x => document.querySelector(`label[for="${x.id}"]`).textContent.includes(n)); box.closest('.a3-field').querySelector('[data-payask] button').click(); }, name);
async function checkin6(p) {
  await tab(p, 'home'); await p.click('#a3CheckGo'); await w(250);
  await typeBox(p, BANK, 300000); await typeBox(p, 'Card A', 50000); await typeBox(p, 'Card B', 24000);
  await p.click('#a3CheckSave'); await w(600);
}
(async () => {
  const { c, p } = await L.open();
  await go(p, '2026-11-24');
  await p.click('#a3SetupGo'); await w(250);
  await p.fill('#s3BankName', BANK);
  await typeIn(p, '#s3Bank', '300000');
  await p.selectOption('#s3PayDay', '10'); await typeIn(p, '#s3PayAmt', '300000');
  for (const [k, name, owed, day] of [[1, 'Card A', 20000, '10'], [2, 'Card B', 10000, '11']]) {
    await p.click('#s3AddCard'); const r = `[data-row=card${k}] `;
    await typeIn(p, r + '[data-f=name]', name); await typeIn(p, r + '[data-f=owed]', owed); await p.selectOption(r + '[data-f=payDay]', day);
  }
  await typeIn(p, '#s3Free', '60000');
  const e = await finishSetup(p); await w(800);
  ck('setup saved', e === '' && await p.$eval('#a3Setup', x => x.hidden).catch(() => false), e);
  await go(p, '2026-12-06'); await checkin6(p);
  ck('6 Dec check saved', await p.$eval('#a3Check', x => x.hidden), await txt(p, '#a3CheckErr'));

  /* ---- 13 Dec ---- */
  await go(p, '2026-12-13');
  await tab(p, 'home'); await p.click('#a3CheckGo'); await w(300);
  ck('13 Dec: the sheet lists the pay and both card payments, ticked', (await tickState(p, 'Pay')) === true && (await tickState(p, 'Card A')) === true && (await tickState(p, 'Card B')) === true);
  await typeBox(p, BANK, 526000); await typeBox(p, 'Card A', 21000); await typeBox(p, 'Card B', 7000);
  ck('everything ticked: no question under either card', (await ask(p, 'Card A')) === null && (await ask(p, 'Card B')) === null, JSON.stringify(await ask(p, 'Card A')));
  await setTick(p, 'Card A', false); await setTick(p, 'Card B', false); await w(200);
  const qa = await ask(p, 'Card A'), qb = await ask(p, 'Card B');
  ck('Card A unticked and showing far less than the app had: the sheet asks whether its payment went out', !!qa && qa.text === 'Did Card A\'s payment of ¥50,000 go out on 10 Dec?', JSON.stringify(qa));
  ck('Card B the same: ¥24,000 on 11 Dec', !!qb && qb.text === 'Did Card B\'s payment of ¥24,000 go out on 11 Dec?', JSON.stringify(qb));
  ck('the answer is one button, big enough to tap', !!qa && qa.button === 'Yes, tick it' && qa.h >= 44, JSON.stringify(qa));
  /* Save with the question open: it is asked first, nothing is saved, and the first question is in view */
  await p.click('#a3CheckSave'); await w(400);
  const err = await txt(p, '#a3CheckErr');
  ck('Save with the question open: not saved, and the line says to answer it or carry on', !(await p.$eval('#a3Check', x => x.hidden)) && /Card A/.test(err) && /Save again/.test(err), err);
  await yes(p, 'Card A'); await w(250);
  ck('Yes ticks Card A\'s payment and its question goes', (await tickState(p, 'Card A')) === true && (await ask(p, 'Card A')) === null);
  ck('Card B\'s question is still there', !!(await ask(p, 'Card B')));
  ck('what was typed is still in the boxes', (await p.$$eval('#a3Check [data-cardfig]', es => es.map(x => x.value).join(','))) === '21000,7000');
  await yes(p, 'Card B'); await w(250);
  ck('Yes ticks Card B\'s payment too', (await tickState(p, 'Card B')) === true && (await ask(p, 'Card B')) === null);
  await p.click('#a3CheckSave'); await w(700);
  ck('saved', await p.$eval('#a3Check', x => x.hidden), await txt(p, '#a3CheckErr'));
  await L.home(p, '13 Dec, both payments ticked: 28,000 of the 60,000 spent since the pay', 32000, { [BANK]: 526000 });
  const owed = await p.$$eval('#a3Home [data-card=cards] [data-fig=owed] [data-amt]', es => es.map(x => Number(x.dataset.amt)));
  ck('the cards owe what was typed, 21,000 and 7,000', JSON.stringify(owed) === '[21000,7000]', JSON.stringify(owed));
  await tab(p, 'plan');
  ck('Plan: Free to spend has 32,000 left of 60,000', (await figAmt(p, '#a3Plan [data-line=free] [data-fig=free-left]')) === 32000);
  await L.sameAfterReload(p, '13 Dec after the check');

  /* ---- a card that really is not paid yet: "No" is to leave it unticked and Save again ---- */
  await go(p, '2026-12-13'); await tab(p, 'home'); await p.click('#a3CheckGo'); await w(300);
  ck('a second check the same day: nothing is left to tick, so no question', (await p.$$('#a3Check .a3-tick')).length === 0 && (await ask(p, 'Card A')) === null);
  await p.click('#a3CheckX'); await w(200);
  await c.close();

  /* ---- the payment truly not gone: the card shows what the app had, so no question; and Save twice passes a question ---- */
  {
    const o = await L.open(), q = o.p;
    await go(q, '2026-11-24');
    await q.click('#a3SetupGo'); await w(250);
    await q.fill('#s3BankName', BANK); await typeIn(q, '#s3Bank', '300000');
    await q.selectOption('#s3PayDay', '10'); await typeIn(q, '#s3PayAmt', '300000');
    await q.click('#s3AddCard'); await typeIn(q, '[data-row=card1] [data-f=name]', 'Card A'); await typeIn(q, '[data-row=card1] [data-f=owed]', 20000); await q.selectOption('[data-row=card1] [data-f=payDay]', '10');
    await typeIn(q, '#s3Free', '60000');
    const e2 = await finishSetup(q); await w(800);
    ck('second person: setup saved', e2 === '', e2);
    await go(q, '2026-12-13'); await tab(q, 'home'); await q.click('#a3CheckGo'); await w(300);
    await setTick(q, 'Card A', false);
    await typeBox(q, BANK, 600000); await typeBox(q, 'Card A', 26000);
    ck('the payment unticked and the card showing MORE than the app had (20,000): no question', (await ask(q, 'Card A')) === null, JSON.stringify(await ask(q, 'Card A')));
    await q.evaluate(() => { const b = document.querySelector('#a3Check [data-cardfig]'); b.value = ''; b.dispatchEvent(new Event('input', { bubbles: true })); }); await w(100);
    await typeBox(q, 'Card A', 3000);
    const q3 = await ask(q, 'Card A');
    ck('the card showing 3,000 where the app had 20,000: asked, ¥20,000 on 10 Dec', !!q3 && q3.text === 'Did Card A\'s payment of ¥20,000 go out on 10 Dec?', JSON.stringify(q3));
    await q.click('#a3CheckSave'); await w(400);
    ck('first Save: asked first, not saved', !(await q.$eval('#a3Check', x => x.hidden)));
    await q.click('#a3CheckSave'); await w(700);
    ck('Save again with the question left: saved as typed, the payment still to tick (nobody is trapped)', await q.$eval('#a3Check', x => x.hidden), await txt(q, '#a3CheckErr'));
    await q.click('#a3CheckGo'); await w(300);
    ck('the payment is still on the list at the next check', (await tickState(q, 'Card A')) !== null);
    await o.c.close();
  }
  await L.finish();
})().catch(e => { console.log('FAIL e3_cardpay crashed ' + (e && e.stack || e)); process.exit(1); });
