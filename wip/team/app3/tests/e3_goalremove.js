#!/usr/bin/env node
/* [E7, M13, M43, M45, M46] remove a goal on Plan (LANE_H_STATE slice 7; CONTROLS_PLAN section 3). On the kept made-up book,
   25 Nov 2026, phone size: two goals, Trip with 20,000 set aside and Laptop empty. Laptop's sheet has no money question
   and Remove this goal asks first, then it leaves Plan; Undo puts it back. Trip's sheet asks where its 20,000 goes; into
   Laptop: Laptop then holds 20,000 and what the accounts can spare does not move; Undo; back to spending money: it
   rises by 20,000. After a reload it stays removed. Made-up yen. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const fs = require('fs');
const { actBook } = require('./e3_act_book.js');
const DAY = '2026-11-25';
const saved = p => p.evaluate(async () => { const s = await BurrowStore.open(); try { const r = await s.load(); return r.copy; } finally { s.close(); } });
(async () => {
  const prof = fs.mkdtempSync(require('os').tmpdir() + '/a3goalrm-');
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
    const goal = name => p.evaluate(n => { const x = [...document.querySelectorAll('#a3Plan [data-goal]')].find(y => y.textContent.includes(n)); return x ? x.textContent.replace(/\s+/g, ' ').trim() : null; }, name);
    const open = name => p.evaluate(n => { const x = [...document.querySelectorAll('#a3Plan [data-goal]')].find(y => y.textContent.includes(n)); if (x) x.click(); return !!x; }, name);
    const LA = require('../../engine/lookahead.js');
    /* what the accounts can spare (safe to spend is capped by Free to spend left in this book: the spare part is what moves) */
    const safe = async () => LA.lookahead(await saved(p), DAY).safeToSpend.whyParts[0].amount;
    await plan();
    for (const [n, a] of [['Trip', '150000'], ['Laptop', '200000']]) { await p.click('#plAddGoal'); await T.w(300); await fill('#pl-name', n); await fill('#pl-target', a); await btn('Add'); await T.w(500); }
    await open('Trip'); await T.w(300); await fill('#pl-amount', '20000'); await btn('Set aside'); await T.w(500);
    const s0 = await safe();
    /* an empty goal */
    await open('Laptop'); await T.w(300);
    ck('an empty goal: no money question', !(await p.$('#pl-to')));
    await btn('Remove this goal'); await T.w(300);
    ck('Remove this goal asks first', /Remove Laptop\?/.test(await p.$eval('#plSure', e => e.textContent)));
    await yes(); await T.w(500);
    ck('then Laptop leaves Plan', (await goal('Laptop')) === null);
    ck('Undo puts it back', await undo()); await T.w(500);
    ck('Laptop is back', !!(await goal('Laptop')));
    /* into another goal */
    await open('Trip'); await T.w(300);
    ck('a goal with money asks where it goes, back to spending money first', JSON.stringify(await p.$eval('#pl-to', e => [...e.options].map(o => o.textContent))) === JSON.stringify(['Back to spending money', 'Into Laptop']));
    await p.select('#pl-to', (await saved(p)).places.find(g => g.name === 'Laptop' && !g.gone).id);
    await btn('Remove this goal'); await T.w(300);
    ck('the question names the money', /¥20,000/.test(await p.$eval('#plSure', e => e.textContent)), await p.$eval('#plSure', e => e.textContent));
    await yes(); await T.w(600);
    ck('Trip gone, Laptop holds 20,000', (await goal('Trip')) === null && /Laptop.*¥20,000/.test(await goal('Laptop') || ''), await goal('Laptop'));
    ck('what the accounts can spare did not move', (await safe()) === s0, [await safe(), s0]);
    ck('Undo puts Trip back with its 20,000', await undo()); await T.w(600);
    ck('Trip back', /Trip.*¥20,000/.test(await goal('Trip') || '') && !/Laptop.*¥20,000/.test(await goal('Laptop') || ''), await goal('Trip'));
    /* back to spending money */
    await open('Trip'); await T.w(300);
    await btn('Remove this goal'); await T.w(300); await yes(); await T.w(600);
    ck('back to spending money: what the accounts can spare rises by 20,000', (await safe()) === s0 + 20000, [await safe(), s0]);
    await p.reload(); await T.w(600); await plan();
    ck('after a reload Trip stays removed', (await goal('Trip')) === null && !!(await goal('Laptop')));
    ck('no page errors', !errs.length, errs.join(' | '));
  } finally { await b.close(); fs.rmSync(prof, { recursive: true, force: true }); }
  T.done('e3_goalremove');
})();
