#!/usr/bin/env node
/* Home's ways into the plan (north star F3), made-up yen, set up Mon 23 Nov 2026 with no cards:
   - the cards box is there with no card yet and has "Add a card", which opens Plan's own add-card form (no second form);
     a card added there shows in the box. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const typeIn = async (p, sel, v) => { await p.click(sel, { clickCount: 3 }); await p.keyboard.press('Backspace'); await p.type(sel, String(v)); };
const clean = s => (s || '').replace(/⁠/g, '').replace(/\s+/g, ' ').trim();
(async () => {
  const prof = require('fs').mkdtempSync(require('os').tmpdir() + '/a3homeplan-');
  const { b, p, errs } = await T.open({ profile: prof });
  await p.goto(T.URL0 + '?today=2026-11-23'); await T.w(400);
  await p.click('#a3SetupGo'); await T.w(300);
  await typeIn(p, '#s3Bank', '320000'); await typeIn(p, '#s3PayAmt', '250000'); await p.select('#s3PayDay', '25');
  await typeIn(p, '#s3Free', '40000');
  await p.click('#a3SetupSave'); await T.w(700);
  ck('saved', await p.$eval('#a3Setup', e => e.hidden));
  /* F3: the cards box with no card, and its Add a card */
  ck('the cards box shows with no card yet', /No cards yet/.test(clean(await p.$eval('[data-card=cards]', e => e.textContent).catch(() => ''))));
  await p.click('#a3AddCardGo'); await T.w(400);
  const form = await p.evaluate(() => ({ plan: !document.querySelector('[data-panel=plan]').hidden, title: (document.querySelector('[data-card=plan-form] h2') || {}).textContent, forms: document.querySelectorAll('[data-card=plan-form]').length }));
  ck('Add a card opens Plan\'s own add-card form', form.plan && form.title === 'Add a card' && form.forms === 1, JSON.stringify(form));
  await typeIn(p, '#pl-name', 'Visa'); await typeIn(p, '#pl-owed', '12000'); await typeIn(p, '#pl-payDay', '10');
  await p.click('[data-plbtn="0"]'); await T.w(500);
  await p.click('[data-tab=home]'); await T.w(400);
  const cards = clean(await p.$eval('[data-card=cards]', e => e.textContent));
  ck('the card added there shows in Home\'s cards box, and Add a card stays', /Visa/.test(cards) && /12,000/.test(cards) && !!(await p.$('#a3AddCardGo')), cards);
  ck('no page errors', errs.length === 0, errs.join(' | '));
  await b.close();
  T.done('e3_homeplan');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
