#!/usr/bin/env node
/* [E8, M13, M38] a second pay on Plan after setup, and ending or removing a pay or a bill (LANE_H_STATE slice 8). On the
   kept made-up book (two pays on the 10th, bills), 25 Nov 2026, phone size: Add a pay asks name, what lands, how often,
   the day and where it lands; an empty name says what to do; the pay shows on Plan; End this pay asks first and the pay
   then says it ended; Undo; Remove this pay asks first and the pay leaves Plan; Undo puts it back; a bill added by
   mistake is removed the same way; a bill with a one-off amount is not removed and says to end it instead. After a reload
   it is all as left. Made-up yen. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const fs = require('fs');
const { actBook } = require('./e3_act_book.js');
const DAY = '2026-11-25';
const saved = p => p.evaluate(async () => { const s = await BurrowStore.open(); try { const r = await s.load(); return r.copy; } finally { s.close(); } });
(async () => {
  const prof = fs.mkdtempSync(require('os').tmpdir() + '/a3payadd-');
  const { b, p, errs } = await T.open({ profile: prof });
  try {
    await p.goto(T.URL0 + '?today=' + DAY); await T.w(300);
    await p.evaluate(async bk => { const s = await BurrowStore.open(); await s.load(); const r = await s.save(bk, { full: true }); s.close(); return r.ok; }, actBook());
    await p.reload(); await T.w(500);
    const plan = async () => { await p.tap('[data-tab="plan"]'); await T.w(300); if (await p.$('#plBack')) { await p.click('#plBack'); await T.w(200); } };
    const btn = label => p.evaluate(l => { const x = [...document.querySelectorAll('[data-plbtn]')].find(y => y.textContent.trim() === l); if (x) x.click(); return !!x; }, label);
    const fill = async (sel, v) => { await p.$eval(sel, e => { e.value = ''; }); await p.type(sel, v); };
    const yes = () => p.evaluate(() => { const x = [...document.querySelectorAll('#plSure button')].find(y => /Yes/.test(y.textContent)); if (x) x.click(); return !!x; });
    const undo = () => p.evaluate(() => { const x = [...document.querySelectorAll('#a3Msg button')].find(y => /Undo/.test(y.textContent)); if (x) x.click(); return !!x; });
    const row = (attr, name) => p.evaluate((a, n) => { const x = [...document.querySelectorAll(`#a3Plan [data-${a}]`)].find(y => y.textContent.includes(n)); return x ? x.textContent.replace(/\s+/g, ' ').trim() : null; }, attr, name);
    const open = (attr, name) => p.evaluate((a, n) => { const x = [...document.querySelectorAll(`#a3Plan [data-${a}]`)].find(y => y.textContent.includes(n)); if (x) x.click(); return !!x; }, attr, name);
    const err = () => p.$eval('#plErr', e => e.textContent);
    await plan();
    ck('Pay and bills has Add a pay', !!(await p.$('#plAddPay')));
    await p.click('#plAddPay'); await T.w(300);
    ck('it asks the name, what lands, how often, the day and where it lands', ['#pl-name', '#pl-amount', '#pl-every', '#pl-day', '#pl-acct'].every(Boolean) && !!(await p.$('#pl-acct')) && !!(await p.$('#pl-every')));
    await btn('Add'); await T.w(300);
    ck('empty: it says what to do and stays open', /Type a name/.test(await err()) && !!(await p.$('#plBack')), await err());
    await fill('#pl-name', 'Side gig'); await fill('#pl-amount', '20000'); await fill('#pl-day', '25');
    await btn('Add'); await T.w(600);
    let bk = await saved(p), gig = bk.schedules.find(s => s.name === 'Side gig' && !s.gone);
    ck('saved as a pay on the 25th into the main bank', gig && gig.kind === 'income' && JSON.stringify(gig.rules[0].rule) === '{"every":"month","days":[25]}' && gig.acct === bk.home.main.v.acct, JSON.stringify(gig));
    ck('it shows on Plan', /Side gig.*¥20,000/.test(await row('pay', 'Side gig') || ''), await row('pay', 'Side gig'));
    /* end it */
    await open('pay', 'Side gig'); await T.w(300);
    await btn('End this pay'); await T.w(300);
    ck('End this pay asks first', /End Side gig\?/.test(await p.$eval('#plSure', e => e.textContent)));
    await yes(); await T.w(600);
    ck('then it says it ended', /Side gig.*ended/.test(await row('pay', 'Side gig') || ''), await row('pay', 'Side gig'));
    ck('Undo', await undo()); await T.w(500);
    ck('after Undo it comes again', /Side gig.*next/.test(await row('pay', 'Side gig') || ''), await row('pay', 'Side gig'));
    /* remove it */
    await open('pay', 'Side gig'); await T.w(300);
    await btn('Remove this pay'); await T.w(300);
    ck('Remove this pay asks first, saying it is for one added by mistake', /added by mistake/.test(await p.$eval('#plSure', e => e.textContent)));
    await yes(); await T.w(600);
    ck('then it leaves Plan', (await row('pay', 'Side gig')) === null);
    ck('Undo', await undo()); await T.w(500);
    ck('Undo puts it back', !!(await row('pay', 'Side gig')));
    /* a bill added by mistake, and one with a one-off amount */
    await p.click('#plAddBill'); await T.w(300);
    await fill('#pl-name', 'Gym'); await fill('#pl-amount', '8000'); await fill('#pl-day', '5'); await btn('Add'); await T.w(600);
    await open('bill', 'Gym'); await T.w(300); await btn('Remove this bill'); await T.w(300); await yes(); await T.w(600);
    ck('a bill added by mistake is removed', (await row('bill', 'Gym')) === null);
    await open('bill', 'Rent'); await T.w(300); await fill('#pl-amount', '75000'); await btn('Change the next one only'); await T.w(600);
    await open('bill', 'Rent'); await T.w(300); await btn('Remove this bill'); await T.w(300); await yes(); await T.w(600);
    ck('Rent with a one-off amount: not removed, it says to end it instead', /End it instead/.test(await err()), await err());
    await p.click('#plBack'); await T.w(200);
    await p.reload(); await T.w(600); await plan();
    ck('after a reload: Side gig there, Gym gone, Rent there', !!(await row('pay', 'Side gig')) && (await row('bill', 'Gym')) === null && !!(await row('bill', 'Rent')));
    ck('no page errors', !errs.length, errs.join(' | '));
  } finally { await b.close(); fs.rmSync(prof, { recursive: true, force: true }); }
  T.done('e3_payadd');
})();
